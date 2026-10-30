import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-guard";
import { phoneKey } from "@/lib/crm";

// Müşteriler: liste ve arama, ekleme (aynı telefon ikinci kez eklenmez), taleplerden toplu aktarma.

const str = (v: unknown, max = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const phone = phoneKey(url.searchParams.get("phone"));
  const db = adminClient();
  let query = db.from("customers").select("id, created_at, full_name, company, phone, email, province, district, source, segment, assigned_to").order("created_at", { ascending: false }).limit(q || phone ? 30 : 300);
  if (phone) query = query.eq("phone_key", phone);
  else if (q) {
    const digits = q.replace(/\D/g, "");
    const safe = q.replace(/[,()%*]/g, " ");
    query = digits.length >= 4 ? query.ilike("phone_key", `%${digits.replace(/^0/, "")}%`) : query.or(`full_name.ilike.%${safe}%,company.ilike.%${safe}%,district.ilike.%${safe}%,province.ilike.%${safe}%`);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (data ?? []).map((c) => c.id);
  const { data: props } = ids.length ? await db.from("proposals").select("customer_id, stage:data->tracking->>stage, total, updated_at").in("customer_id", ids) : { data: [] };
  const { data: acts } = ids.length ? await db.from("customer_activities").select("customer_id, created_at").in("customer_id", ids).order("created_at", { ascending: false }) : { data: [] };
  const rows = (data ?? []).map((c) => {
    const own = (props ?? []).filter((p) => p.customer_id === c.id);
    return { ...c, proposals: own.length, stage: own.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0]?.stage ?? null, last_activity: (acts ?? []).find((a) => a.customer_id === c.id)?.created_at ?? null };
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  const db = adminClient();

  if (b?.action === "import") {
    // Web, hesaplama ve Meta talepleri tek müşteri listesine: telefon başına bir kayıt, en eski talebin kaynağıyla.
    const [leads, calcs, meta] = await Promise.all([
      db.from("leads").select("fullname, phone, email, province, source, utm_source, created_at").limit(5000),
      db.from("calculations").select("fullname, phone, email, province, district, address, type, created_at").limit(5000),
      db.from("meta_leads").select("full_name, phone, email, city, created_time").limit(5000),
    ]);
    type C = { full_name: string; phone: string; phone_key: string; email: string | null; province: string | null; district: string | null; address: string | null; source: string; created_at: string };
    const all: C[] = [];
    const add = (name: unknown, phone: unknown, email: unknown, province: unknown, district: unknown, address: unknown, source: string, at: unknown) => {
      const key = phoneKey(String(phone ?? ""));
      if (!key) return;
      all.push({ full_name: str(name) ?? "İsimsiz", phone: String(phone), phone_key: key, email: str(email), province: str(province), district: str(district), address: str(address, 400), source, created_at: String(at) });
    };
    for (const l of leads.data ?? []) add(l.fullname, l.phone, l.email, l.province, null, null, l.utm_source ? `${l.source ?? "web"} ${l.utm_source}` : (l.source ?? "web"), l.created_at);
    for (const c of calcs.data ?? []) add(c.fullname, c.phone, c.email, c.province, c.district, c.address, `calculator ${c.type}`, c.created_at);
    for (const m of meta.data ?? []) add(m.full_name, m.phone, m.email, m.city, null, null, "meta", m.created_time);
    all.sort((x, y) => x.created_at.localeCompare(y.created_at));
    const unique = [...new Map([...all].reverse().map((c) => [c.phone_key, c])).values()];
    const { data, error } = await db.from("customers").upsert(unique, { onConflict: "phone_key", ignoreDuplicates: true }).select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ added: data?.length ?? 0, scanned: all.length });
  }

  const name = str(b?.full_name);
  const key = phoneKey(b?.phone);
  if (!name) return NextResponse.json({ error: "Ad soyad gerekli." }, { status: 400 });
  if (!key) return NextResponse.json({ error: "Telefon numarası 10 hane olmalı." }, { status: 400 });
  const { data: existing } = await db.from("customers").select("id, full_name").eq("phone_key", key).maybeSingle();
  if (existing) return NextResponse.json({ error: `Bu numara ${existing.full_name} adına kayıtlı.`, existing }, { status: 409 });
  const { data, error } = await db
    .from("customers")
    .insert({ full_name: name, phone: str(b.phone, 30), phone_key: key, company: str(b.company), email: str(b.email), province: str(b.province), district: str(b.district), address: str(b.address, 400), source: str(b.source) ?? "elle", segment: str(b.segment), assigned_to: Number.isFinite(b.assigned_to) ? b.assigned_to : null, notes: str(b.notes, 2000) })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
