import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-guard";
import { LOST_STAGES, WON_STAGES, channelOf } from "@/lib/crm";

// Yönetim: bugünün işleri ve yönetici göstergeleri. POST: personel, görev tamamlama, tahsilat işlemleri.

type Line = { adet?: number; birimFiyat?: number; maliyetUsd?: number };

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const days = Math.min(730, Math.max(7, Number(new URL(req.url).searchParams.get("gun")) || 90));
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);
  const db = adminClient();

  const [staff, customers, proposals, tasks, payments, leads, calcs, meta] = await Promise.all([
    db.from("staff").select("*").order("full_name"),
    db.from("customers").select("id, created_at, full_name, phone, source, assigned_to").limit(5000),
    db.from("proposals").select("id, created_at, updated_at, proposal_no, customer_id, customer_name, customer_phone, assigned_to, dc_kwp, total, currency:data->>priceCurrency, tracking:data->tracking, last_view_at:data->>lastViewAt, lines:data->lines").limit(5000),
    db.from("customer_activities").select("id, customer_id, kind, text, due_at, staff_id, customers(full_name, phone)").is("done_at", null).not("due_at", "is", null).lte("due_at", `${today}T23:59:59`).order("due_at").limit(100),
    db.from("project_payments").select("id, proposal_id, step, amount, currency, due_at, paid_at").limit(5000),
    db.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since),
    db.from("calculations").select("id", { count: "exact", head: true }).gte("created_at", since),
    db.from("meta_leads").select("id", { count: "exact", head: true }).gte("created_time", since),
  ]);
  for (const r of [staff, customers, proposals, tasks, payments]) if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });

  const stageOf = (p: { tracking: unknown }) => (p.tracking as { stage?: string } | null)?.stage ?? "teklif";
  const all = proposals.data ?? [];
  const inPeriod = all.filter((p) => p.created_at >= since);
  const won = inPeriod.filter((p) => WON_STAGES.includes(stageOf(p)));
  const lost = inPeriod.filter((p) => stageOf(p) === "kayip");
  const usdWon = won.filter((p) => p.currency === "USD");
  const profitOf = (p: { total: number | null; lines: unknown }) => {
    const lines = (p.lines ?? []) as Line[];
    const cost = lines.reduce((a, l) => a + (l.adet ?? 0) * (l.maliyetUsd ?? 0), 0);
    return cost > 0 ? Number(p.total ?? 0) / 1.2 - cost : 0;
  };

  // Kaynak: hangi kanal satış getiriyor.
  const custById = new Map((customers.data ?? []).map((c) => [c.id, c]));
  const channels = new Map<string, { musteri: number; teklif: number; satis: number }>();
  const bump = (k: string, f: "musteri" | "teklif" | "satis") => {
    const r = channels.get(k) ?? { musteri: 0, teklif: 0, satis: 0 };
    r[f]++;
    channels.set(k, r);
  };
  for (const c of customers.data ?? []) if (c.created_at >= since) bump(channelOf(c.source), "musteri");
  for (const p of inPeriod) {
    const ch = channelOf(custById.get(p.customer_id as number)?.source);
    bump(ch, "teklif");
    if (WON_STAGES.includes(stageOf(p))) bump(ch, "satis");
  }

  // Personel.
  const perStaff = (staff.data ?? []).map((s) => {
    // Teklifin sorumlusu, müşterinin sorumlusudur.
    const own = inPeriod.filter((p) => (p.assigned_to ?? custById.get(p.customer_id as number)?.assigned_to) === s.id);
    const ownWon = own.filter((p) => WON_STAGES.includes(stageOf(p)));
    return { id: s.id, ad: s.full_name, musteri: (customers.data ?? []).filter((c) => c.assigned_to === s.id).length, teklif: own.length, satis: ownWon.length, ciro: ownWon.filter((p) => p.currency === "USD").reduce((a, p) => a + Number(p.total ?? 0), 0) };
  });

  // Kapanma süresi: teklif tarihinden kabul aşamasına.
  const closes = won.map((p) => {
    const at = (p.tracking as { dates?: Record<string, string> } | null)?.dates?.kabul;
    return at ? (new Date(at).getTime() - new Date(p.created_at).getTime()) / 864e5 : null;
  }).filter((v): v is number => v != null && v >= 0);

  const reasons: Record<string, number> = {};
  for (const p of lost) {
    const r = (p.tracking as { lostReason?: string } | null)?.lostReason || "Belirtilmedi";
    reasons[r] = (reasons[r] ?? 0) + 1;
  }

  // Bugün yapılacaklar.
  const open = all.filter((p) => !LOST_STAGES.includes(stageOf(p)) && stageOf(p) !== "tamam");
  const hot = open.filter((p) => !WON_STAGES.includes(stageOf(p)) && p.last_view_at && Date.now() - new Date(p.last_view_at).getTime() < 48 * 36e5);
  const follow = open.filter((p) => {
    const f = (p.tracking as { followUp?: string } | null)?.followUp;
    return f && f <= today;
  });
  const contacted = new Set(((await db.from("customer_activities").select("customer_id").limit(10000)).data ?? []).map((a) => a.customer_id));
  const withProposal = new Set(all.map((p) => p.customer_id));
  const fresh = (customers.data ?? []).filter((c) => !contacted.has(c.id) && !withProposal.has(c.id) && Date.now() - new Date(c.created_at).getTime() < 14 * 864e5).slice(0, 30);
  const pay = payments.data ?? [];
  const overdue = pay.filter((x) => !x.paid_at && x.due_at && x.due_at < today);

  const propById = new Map(all.map((p) => [p.id, p]));
  return NextResponse.json({
    staff: staff.data,
    today: {
      tasks: tasks.data,
      hot: hot.map((p) => ({ id: p.id, customerId: p.customer_id, ad: p.customer_name, phone: p.customer_phone, no: p.proposal_no, at: p.last_view_at })),
      follow: follow.map((p) => ({ id: p.id, customerId: p.customer_id, ad: p.customer_name, phone: p.customer_phone, no: p.proposal_no, note: (p.tracking as { note?: string }).note })),
      fresh,
      overdue: overdue.map((x) => ({ ...x, ad: propById.get(x.proposal_id)?.customer_name, customerId: propById.get(x.proposal_id)?.customer_id })),
    },
    kpi: {
      days,
      talep: (leads.count ?? 0) + (calcs.count ?? 0) + (meta.count ?? 0),
      musteri: (customers.data ?? []).filter((c) => c.created_at >= since).length,
      teklif: inPeriod.length,
      satis: won.length,
      kayip: lost.length,
      ciroUsd: usdWon.reduce((a, p) => a + Number(p.total ?? 0), 0),
      karUsd: usdWon.reduce((a, p) => a + profitOf(p), 0),
      kw: won.reduce((a, p) => a + Number(p.dc_kwp ?? 0), 0),
      kapanmaGun: closes.length ? closes.reduce((a, b) => a + b, 0) / closes.length : null,
      bekleyenTahsilat: pay.filter((x) => !x.paid_at && x.currency === "USD").reduce((a, x) => a + Number(x.amount), 0),
      alinanTahsilat: pay.filter((x) => x.paid_at && x.currency === "USD").reduce((a, x) => a + Number(x.amount), 0),
      gecikenTahsilat: overdue.filter((x) => x.currency === "USD").reduce((a, x) => a + Number(x.amount), 0),
    },
    channels: [...channels].map(([ad, v]) => ({ ad, ...v })).sort((a, b) => b.satis - a.satis || b.teklif - a.teklif || b.musteri - a.musteri),
    perStaff,
    reasons: Object.entries(reasons).map(([ad, adet]) => ({ ad, adet })).sort((a, b) => b.adet - a.adet),
    openProjects: open.filter((p) => WON_STAGES.includes(stageOf(p))).length,
  });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  const db = adminClient();
  switch (b?.action) {
    case "staffAdd": {
      const name = typeof b.full_name === "string" ? b.full_name.trim() : "";
      if (!name) return NextResponse.json({ error: "Ad soyad gerekli." }, { status: 400 });
      const { error } = await db.from("staff").insert({ full_name: name.slice(0, 120), title: typeof b.title === "string" ? b.title.slice(0, 80) : null, phone: typeof b.phone === "string" ? b.phone.slice(0, 30) : null, email: typeof b.email === "string" ? b.email.slice(0, 120) : null });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "staffActive": {
      const { error } = await db.from("staff").update({ active: Boolean(b.active) }).eq("id", b.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "taskDone": {
      const { error } = await db.from("customer_activities").update({ done_at: new Date().toISOString() }).eq("id", b.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case "planToPayments": {
      // Teklifteki ödeme planı tahsilat takvimine aktarılır; zaten varsa tekrarlanmaz.
      const { data: exists } = await db.from("project_payments").select("id").eq("proposal_id", b.proposalId).limit(1);
      if (exists?.length) return NextResponse.json({ error: "Bu teklifin tahsilat planı zaten oluşturulmuş." }, { status: 409 });
      const { data: row, error } = await db.from("proposals").select("total, currency:data->>priceCurrency, plan:data->paymentPlan").eq("id", b.proposalId).single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const plan = (row.plan ?? []) as { ad: string; pct: number }[];
      if (!plan.length) return NextResponse.json({ error: "Teklifte ödeme planı yok." }, { status: 400 });
      const { error: e2 } = await db.from("project_payments").insert(plan.filter((s) => s.pct > 0).map((s) => ({ proposal_id: b.proposalId, step: s.ad, amount: Math.round((Number(row.total ?? 0) * s.pct) / 100), currency: row.currency === "USD" ? "USD" : "TRY" })));
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      break;
    }
    case "paymentUpdate": {
      const patch: Record<string, unknown> = {};
      if ("paid_at" in b) patch.paid_at = b.paid_at || null;
      if ("due_at" in b) patch.due_at = b.due_at || null;
      if (Number.isFinite(b.amount)) patch.amount = b.amount;
      const { error } = await db.from("project_payments").update(patch).eq("id", b.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    default:
      return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
