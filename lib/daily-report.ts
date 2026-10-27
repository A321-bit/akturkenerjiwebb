import { Resend } from "resend";
import { adminClient } from "./data";
import { adsQuery } from "./google-ads";
import { adsReport } from "./meta-ads";
import { gaDay } from "./ga";

// Günlük rapor e-postası (her akşam 22:30 TR, Vercel Cron → /api/cron/daily-report).
// Günün tamamını tek e-postada toplar: site talepleri, Meta form başvuruları, takip
// bekleyenler, Google ve Meta reklamları, Google Analytics, site etkinlikleri, Search
// Console, sosyal medya, mağaza, iş başvuruları / potansiyel müşteriler ve güvenlik.
// Bir kaynak hata verirse o bölüm hata notuyla gelir, diğerleri yine gönderilir.

const TZ = "Europe/Istanbul";
const SITE = "https://akturkenerji.com";

const settle = async <T,>(p: Promise<T>): Promise<{ data: T | null; error: string | null }> => {
  try {
    return { data: await p, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
};

/** İstanbul saatine göre bugünün başlangıcı (UTC ISO) ve tarih etiketi. */
function today() {
  const now = new Date();
  const trDate = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now); // YYYY-MM-DD
  const start = new Date(`${trDate}T00:00:00+03:00`);
  const label = now.toLocaleDateString("tr-TR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric", weekday: "long" });
  return { trDate, start: start.toISOString(), weekAgo: new Date(start.getTime() - 6 * 86400000).toISOString(), label };
}

const esc = (s: unknown) => String(s ?? "—").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const tl = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: n < 100 ? 2 : 0 })} TL`;
const n0 = (n: number) => Math.round(n).toLocaleString("tr-TR");
const time = (iso: string) => new Date(iso).toLocaleTimeString("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

type LeadRow = {
  fullname: string; phone: string; need_type: string; province: string | null; form_page: string | null; status: string; created_at: string;
  utm_source: string | null; ad_click_id: string | null; source: string;
};
const leadSource = (r: Pick<LeadRow, "utm_source" | "ad_click_id" | "source">) =>
  r.ad_click_id?.startsWith("gclid:") || /google/i.test(r.utm_source ?? "") ? "Google Ads"
  : r.ad_click_id?.startsWith("fbclid:") || /facebook|instagram|meta/i.test(r.utm_source ?? "") ? "Meta Ads"
  : r.source === "quick_quote" ? "Hızlı teklif" : "Organik / Doğrudan";

const CLICK_LABELS: Record<string, string> = {
  whatsapp_button: "WhatsApp butonu",
  whatsapp_cta_banner: "WhatsApp banner",
  call_button: "Hemen Ara butonu",
  quote_button_open: "Keşif Al butonu",
  quote_form_submit: "Hızlı teklif gönderimi",
  lead_form_submit: "Teklif formu gönderimi",
  store_whatsapp_product: "Mağaza ürün WhatsApp",
};

export async function buildDailyReport() {
  const { start, weekAgo, label, trDate } = today();
  const db = adminClient();
  const q = <T,>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) =>
    Promise.resolve(p).then((r) => {
      if (r.error) throw new Error(r.error.message);
      return (r.data ?? []) as T;
    });

  const [leads, leadsOpen, meta, metaOpen, events, social, socialTomorrow, reviews, jobs, potentials, logins, sessions, gsc, gAds, gAdsWeek, mAds, mAdsWeek, ga] =
    await Promise.all([
      settle(q<LeadRow[]>(db.from("leads").select("fullname, phone, need_type, province, form_page, status, created_at, utm_source, ad_click_id, source").gte("created_at", start).order("created_at"))),
      settle(q<{ fullname: string; phone: string; created_at: string }[]>(db.from("leads").select("fullname, phone, created_at").eq("status", "Yeni").lt("created_at", start).order("created_at"))),
      settle(q<{ full_name: string | null; phone: string | null; city: string | null; campaign_name: string | null; status: string | null; created_time: string }[]>(
        db.from("meta_leads").select("full_name, phone, city, campaign_name, status, created_time").gte("created_time", start).order("created_time"))),
      settle(q<{ status: string | null }[]>(db.from("meta_leads").select("status").gte("created_time", new Date(Date.now() - 30 * 86400000).toISOString()))),
      settle(q<{ type: string; label: string | null; path: string | null; city: string | null }[]>(db.from("analytics_events").select("type, label, path, city").gte("created_at", start).limit(20000))),
      settle(q<{ title: string; platforms: string[]; fb_status: string | null; ig_status: string | null; error: string | null; scheduled_at: string }[]>(
        db.from("social_posts").select("title, platforms, fb_status, ig_status, error, scheduled_at").gte("scheduled_at", start).lt("scheduled_at", new Date(new Date(start).getTime() + 86400000).toISOString()))),
      settle(q<{ title: string; scheduled_at: string }[]>(
        db.from("social_posts").select("title, scheduled_at").gte("scheduled_at", new Date(new Date(start).getTime() + 86400000).toISOString()).lt("scheduled_at", new Date(new Date(start).getTime() + 2 * 86400000).toISOString()).order("scheduled_at"))),
      settle(q<{ id: number }[]>(db.from("product_reviews").select("id").eq("approved", false))),
      settle(q<{ id: number }[]>(db.from("job_applications").select("id").gte("created_at", start))),
      settle(q<{ company_name: string; status: string }[]>(db.from("potential_customers").select("company_name, status").gte("created_at", start))),
      settle(q<{ success: boolean; ip: string; reason: string | null; at: string }[]>(db.from("admin_login_attempts").select("success, ip, reason, at").gte("at", start))),
      settle(q<{ id: string }[]>(db.from("admin_sessions").select("id").is("revoked_at", null).gt("expires_at", new Date().toISOString()))),
      settle(q<{ date: string; query: string; clicks: number; impressions: number; position: number }[]>(
        db.from("gsc_rows").select("date, query, clicks, impressions, position").gte("date", weekAgo.slice(0, 10)).limit(50000))),
      settle(adsQuery<Record<string, Record<string, string>>>(
        "SELECT campaign.name, campaign.status, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM campaign WHERE segments.date DURING TODAY AND campaign.status != 'REMOVED'")),
      settle(adsQuery<Record<string, Record<string, string>>>(
        "SELECT metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM customer WHERE segments.date DURING LAST_7_DAYS")),
      settle(adsReport("today", "akturk")),
      settle(adsReport("last_7d", "akturk")),
      settle(gaDay("today")),
    ]);

  // ── Hesaplamalar
  const leadRows = leads.data ?? [];
  const metaRows = meta.data ?? [];
  const ev = events.data ?? [];
  const pageviews = ev.filter((e) => e.type === "pageview").length;
  const clicks: Record<string, number> = {};
  for (const e of ev) if (e.type === "click" && e.label) clicks[e.label] = (clicks[e.label] ?? 0) + 1;
  const evPages: Record<string, number> = {};
  for (const e of ev) if (e.type === "pageview" && e.path) evPages[e.path] = (evPages[e.path] ?? 0) + 1;
  const wa = (clicks.whatsapp_button ?? 0) + (clicks.whatsapp_cta_banner ?? 0) + (clicks.store_whatsapp_product ?? 0);
  const calls = clicks.call_button ?? 0;

  const micro = (v?: string) => Number(v ?? 0) / 1e6;
  const gCamp = (gAds.data ?? []).map((r) => ({
    name: r.campaign?.name ?? "", status: r.campaign?.status ?? "", cost: micro(r.metrics?.costMicros), clicks: Number(r.metrics?.clicks ?? 0),
    impressions: Number(r.metrics?.impressions ?? 0), conversions: Number(r.metrics?.conversions ?? 0),
  })).filter((c) => c.cost > 0 || c.impressions > 0).sort((a, b) => b.cost - a.cost);
  const gTotal = gCamp.reduce((s, c) => ({ cost: s.cost + c.cost, clicks: s.clicks + c.clicks, impressions: s.impressions + c.impressions, conversions: s.conversions + c.conversions }),
    { cost: 0, clicks: 0, impressions: 0, conversions: 0 });
  const gWeek = (gAdsWeek.data ?? []).reduce((s, r) => ({ cost: s.cost + micro(r.metrics?.costMicros), clicks: s.clicks + Number(r.metrics?.clicks ?? 0), conversions: s.conversions + Number(r.metrics?.conversions ?? 0) }),
    { cost: 0, clicks: 0, conversions: 0 });
  const mT = mAds.data?.total;
  const mW = mAdsWeek.data?.total;
  const spend = gTotal.cost + (mT?.spend ?? 0);
  const contacts = leadRows.length + metaRows.length + wa + calls;

  const metaFunnel: Record<string, number> = {};
  for (const r of metaOpen.data ?? []) metaFunnel[r.status || "Yeni"] = (metaFunnel[r.status || "Yeni"] ?? 0) + 1;

  // Personel takibi: Meta formlarında aranıp işaretlenmeyen başvurular ve bugün yapılan işaretlemeler.
  const staff = await settle(Promise.all([
    q<{ full_name: string | null; phone: string | null; campaign_name: string | null; created_time: string }[]>(
      db.from("meta_leads").select("full_name, phone, campaign_name, created_time").or("status.is.null,status.eq.Yeni").order("created_time")),
    q<{ status: string | null }[]>(db.from("meta_leads").select("status").gte("status_changed_at", start)),
  ]));
  const waiting = staff.data?.[0] ?? [];
  const ageDays = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  const waitingOver1 = waiting.filter((r) => Date.now() - new Date(r.created_time).getTime() > 86400000).length;
  const waitingOver3 = waiting.filter((r) => ageDays(r.created_time) >= 3).length;
  const markedToday: Record<string, number> = {};
  for (const r of staff.data?.[1] ?? []) markedToday[r.status || "Yeni"] = (markedToday[r.status || "Yeni"] ?? 0) + 1;
  const markedTodayTotal = Object.values(markedToday).reduce((a, b) => a + b, 0);

  const gscRows = gsc.data ?? [];
  const gscDays: Record<string, { clicks: number; impressions: number }> = {};
  const gscQ: Record<string, { clicks: number; impressions: number; pos: number; n: number }> = {};
  for (const r of gscRows) {
    const d = (gscDays[r.date] ??= { clicks: 0, impressions: 0 });
    d.clicks += r.clicks;
    d.impressions += r.impressions;
    const qq = (gscQ[r.query] ??= { clicks: 0, impressions: 0, pos: 0, n: 0 });
    qq.clicks += r.clicks;
    qq.impressions += r.impressions;
    qq.pos += r.position * r.impressions;
    qq.n += r.impressions;
  }
  const gscWeek = Object.values(gscDays).reduce((s, d) => ({ clicks: s.clicks + d.clicks, impressions: s.impressions + d.impressions }), { clicks: 0, impressions: 0 });
  const topQueries = Object.entries(gscQ).sort((a, b) => b[1].clicks - a[1].clicks || b[1].impressions - a[1].impressions).slice(0, 12);

  const loginRows = logins.data ?? [];
  const errors = Object.entries({ leads, meta, events, social, gsc, "Google Ads": gAds, "Meta Ads": mAds, "Google Analytics": ga, logins })
    .filter(([, v]) => v.error).map(([k, v]) => `${k}: ${v.error}`);

  // ── HTML
  const card = (title: string, value: string, sub = "") =>
    `<td style="padding:6px;width:25%;vertical-align:top"><div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fff">
      <div style="font-size:12px;color:#6b7280">${title}</div><div style="font-size:22px;font-weight:700;color:#1c2430;margin-top:2px">${value}</div>
      ${sub ? `<div style="font-size:11.5px;color:#6b7280;margin-top:2px">${sub}</div>` : ""}</div></td>`;
  const h2 = (t: string) => `<h2 style="font-size:16px;margin:26px 0 8px;color:#1c2430;border-bottom:2px solid #2f80c4;padding-bottom:4px">${t}</h2>`;
  const table = (head: string[], rows: (string | number)[][], empty = "Kayıt yok.") =>
    rows.length === 0 ? `<p style="color:#6b7280;margin:4px 0">${empty}</p>` :
    `<table style="border-collapse:collapse;width:100%;font-size:13px"><tr>${head.map((h) => `<th style="text-align:left;padding:6px 8px;background:#f3f4f6;color:#374151;font-weight:600">${h}</th>`).join("")}</tr>
     ${rows.map((r) => `<tr>${r.map((c) => `<td style="padding:6px 8px;border-top:1px solid #eef0f3">${typeof c === "number" ? n0(c) : c}</td>`).join("")}</tr>`).join("")}</table>`;
  const errNote = (e: string | null) => (e ? `<p style="color:#b45309;font-size:12.5px">Veri alınamadı: ${esc(e)}</p>` : "");
  const pairsTable = (head: [string, string], arr: { label: string; value: number }[] | undefined) =>
    table([head[0], head[1]], (arr ?? []).map((p) => [esc(p.label || "(yok)"), p.value]));

  const ga4 = ga.data;
  const html = `<!doctype html><meta charset="utf-8"><div style="background:#f6f7f9;padding:18px 10px;font-family:Segoe UI,Arial,sans-serif;color:#1c2430">
  <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:16px;padding:22px 22px 28px;border:1px solid #e5e7eb">
  <div style="font-size:12px;color:#2f80c4;letter-spacing:.12em;text-transform:uppercase;font-weight:700">Aktürk Enerji · Günlük Rapor</div>
  <h1 style="font-size:22px;margin:4px 0 2px">${esc(label)}</h1>
  <div style="font-size:12.5px;color:#6b7280">Gün başından saat ${time(new Date().toISOString())}'e kadar. Reklam verileri bugünün anlık değerleridir; gece güncellenebilir.</div>

  ${h2("Özet")}
  <table style="width:100%;border-collapse:collapse"><tr>
    ${card("Gelen iletişim", n0(contacts), `form ${leadRows.length + metaRows.length} · WhatsApp ${wa} · telefon ${calls}`)}
    ${card("Reklam harcaması", tl(spend), `Google ${tl(gTotal.cost)} · Meta ${tl(mT?.spend ?? 0)}`)}
    ${card("İletişim başı maliyet", contacts ? tl(spend / contacts) : "—", "harcama ÷ tüm iletişim")}
    ${card("Site ziyaretçisi", n0(ga4?.totals.activeUsers ?? 0), `${n0(ga4?.totals.sessions ?? 0)} oturum · ${n0(pageviews)} sayfa (site)`)}
  </tr><tr>
    ${card("Site teklif formu", n0(leadRows.length))}
    ${card("Meta form başvurusu", n0(metaRows.length))}
    ${card("Google Ads tıklama", n0(gTotal.clicks), `${n0(gTotal.conversions)} dönüşüm`)}
    ${card("Meta bağlantı tıklaması", n0(mT?.linkClicks ?? 0), `${n0(mT?.leads ?? 0)} form sonucu`)}
  </tr></table>

  ${h2(`Site talepleri (${leadRows.length})`)}${errNote(leads.error)}
  ${table(["Saat", "Ad Soyad", "Telefon", "İhtiyaç", "İl", "Kaynak", "Sayfa"], leadRows.map((r) => [time(r.created_at), esc(r.fullname), `<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>`, esc(r.need_type), esc(r.province), leadSource(r), esc(r.form_page)]), "Bugün site formundan talep gelmedi.")}

  ${h2(`Meta form başvuruları (${metaRows.length})`)}${errNote(meta.error)}
  ${table(["Saat", "Ad Soyad", "Telefon", "Şehir", "Kampanya", "Durum"], metaRows.map((r) => [time(r.created_time), esc(r.full_name), `<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>`, esc(r.city), esc(r.campaign_name), esc(r.status || "Yeni")]), "Bugün Meta formundan başvuru gelmedi.")}
  <p style="font-size:12.5px;color:#374151">Son 30 gün form sonuçları: ${Object.entries(metaFunnel).map(([k, v]) => `${esc(k)} <b>${v}</b>`).join(" · ") || "—"}</p>

  ${h2("Personel takibi: Meta form aramaları")}${errNote(staff.error)}
  <table style="width:100%;border-collapse:collapse"><tr>
    ${card("Bugün işaretlenen", n0(markedTodayTotal), Object.entries(markedToday).map(([k, v]) => `${esc(k)} ${v}`).join(" · ") || "bugün işaretleme yok")}
    ${card("Aranmayı bekleyen", n0(waiting.length), `24 saati geçen ${waitingOver1} · 3 günü geçen ${waitingOver3}`)}
    ${card("Satış (son 30 gün)", n0(metaFunnel["Satış"] ?? 0), "\"Satış\" olarak işaretlenen")}
  </tr></table>
  ${table(["Başvuru", "Bekliyor", "Ad Soyad", "Telefon", "Kampanya"], waiting.slice(0, 15).map((r) => [new Date(r.created_time).toLocaleDateString("tr-TR", { timeZone: TZ }), ageDays(r.created_time) ? `<b style="color:${ageDays(r.created_time) >= 3 ? "#b91c1c" : "#b45309"}">${ageDays(r.created_time)} gün</b>` : "bugün", esc(r.full_name), `<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>`, esc(r.campaign_name)]), "Aranmayı bekleyen Meta başvurusu yok.")}
  ${waiting.length > 15 ? `<p style="font-size:12.5px;color:#374151">En eski 15 tanesi gösteriliyor; toplam <b>${waiting.length}</b> başvuru bekliyor.</p>` : ""}
  <p style="font-size:12px;color:#6b7280">Aranan her başvurunun sonucu (Ulaşılamadı, İlgisiz, Nitelikli, Keşif, Teklif, Satış) <a href="${SITE}/admin/meta-formlari">Meta Formları</a> ekranında işaretlenmeli; işaretlenen sonuç Meta'ya gider ve reklamlar satışa dönen kişilere benzeyenleri bulmayı öğrenir.</p>

  ${h2("Takip bekleyenler")}
  ${table(["Talep tarihi", "Ad Soyad", "Telefon"], (leadsOpen.data ?? []).map((r) => [new Date(r.created_at).toLocaleDateString("tr-TR", { timeZone: TZ }), esc(r.fullname), esc(r.phone)]), "Durumu \"Yeni\" kalmış eski talep yok.")}
  <p style="font-size:12.5px;color:#374151"><a href="${SITE}/admin/talepler">Talepler</a></p>

  ${h2("Google Ads (bugün)")}${errNote(gAds.error)}
  ${table(["Kampanya", "Harcama", "Tıklama", "Gösterim", "Dönüşüm"], gCamp.map((c) => [esc(c.name) + (c.status !== "ENABLED" ? " <span style='color:#9ca3af'>(durduruldu)</span>" : ""), tl(c.cost), c.clicks, c.impressions, c.conversions]), "Bugün harcama yok.")}
  <p style="font-size:12.5px;color:#374151">Son 7 gün: ${tl(gWeek.cost)} harcama · ${n0(gWeek.clicks)} tıklama · ${n0(gWeek.conversions)} dönüşüm${gWeek.conversions ? ` · dönüşüm başı ${tl(gWeek.cost / gWeek.conversions)}` : ""}</p>

  ${h2("Meta reklamları (bugün, Aktürk Enerji)")}${errNote(mAds.error)}
  ${table(["Kampanya", "Harcama", "Bağlantı tıklaması", "Sonuç (form)"], (mAds.data?.campaigns ?? []).filter((c) => c.spend > 0).map((c) => [esc(c.name), tl(c.spend), c.linkClicks, c.leads]), "Bugün Meta harcaması yok.")}
  <p style="font-size:12.5px;color:#374151">Son 7 gün: ${tl(mW?.spend ?? 0)} harcama · ${n0(mW?.linkClicks ?? 0)} tıklama · ${n0(mW?.leads ?? 0)} form${mW?.leads ? ` · form başı ${tl((mW?.spend ?? 0) / mW.leads)}` : ""}</p>

  ${h2("Site etkinlikleri (bugün)")}${errNote(events.error)}
  ${table(["Etkinlik", "Adet"], Object.entries(clicks).sort((a, b) => b[1] - a[1]).map(([k, v]) => [CLICK_LABELS[k] ?? esc(k), v]), "Buton tıklaması yok.")}
  <div style="height:8px"></div>
  ${table(["En çok görüntülenen sayfa", "Görüntüleme"], Object.entries(evPages).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => [esc(k), v]))}

  ${h2("Google Analytics (bugün)")}${errNote(ga.error)}
  ${ga4 ? `<p style="font-size:13px">Kullanıcı <b>${n0(ga4.totals.activeUsers)}</b> · Oturum <b>${n0(ga4.totals.sessions)}</b> · Sayfa görüntüleme <b>${n0(ga4.totals.screenPageViews)}</b> · Ort. oturum <b>${Math.round(ga4.totals.averageSessionDuration)} sn</b> · Önemli etkinlik <b>${n0(ga4.totals.keyEvents)}</b></p>
  <table style="width:100%;border-collapse:collapse"><tr><td style="vertical-align:top;width:50%;padding-right:6px">${pairsTable(["Kaynak / ortam", "Oturum"], ga4.sources)}</td>
  <td style="vertical-align:top;width:50%;padding-left:6px">${pairsTable(["Şehir", "Kullanıcı"], ga4.cities)}</td></tr>
  <tr><td style="vertical-align:top;padding:8px 6px 0 0">${pairsTable(["Cihaz", "Kullanıcı"], ga4.devices)}</td>
  <td style="vertical-align:top;padding:8px 0 0 6px">${pairsTable(["Etkinlik", "Adet"], ga4.events)}</td></tr></table>` : ""}

  ${h2("Google arama (Search Console, son 7 gün)")}${errNote(gsc.error)}
  <p style="font-size:13px">Tıklama <b>${n0(gscWeek.clicks)}</b> · Gösterim <b>${n0(gscWeek.impressions)}</b> · Günlük: ${Object.entries(gscDays).sort().map(([d, v]) => `${d.slice(5)} ${v.clicks}/${v.impressions}`).join(" · ")}</p>
  ${table(["Sorgu", "Tıklama", "Gösterim", "Ort. sıra"], topQueries.map(([k, v]) => [esc(k), v.clicks, v.impressions, v.n ? (v.pos / v.n).toFixed(1) : "—"]))}
  <p style="font-size:11.5px;color:#6b7280">Search Console verisi 1–2 gün gecikmeli gelir.</p>

  ${h2("Sosyal medya")}${errNote(social.error)}
  ${table(["Saat", "Gönderi", "Facebook", "Instagram"], (social.data ?? []).map((p) => [time(p.scheduled_at), esc(p.title), esc(p.fb_status), esc(p.ig_status) + (p.error ? ` <span style="color:#b91c1c">${esc(p.error)}</span>` : "")]), "Bugün planlı gönderi yoktu.")}
  <p style="font-size:12.5px;color:#374151">Yarın planlı: ${(socialTomorrow.data ?? []).map((p) => `${time(p.scheduled_at)} ${esc(p.title)}`).join(" · ") || "—"}</p>

  ${h2("Mağaza ve diğer")}
  <p style="font-size:13px">Onay bekleyen ürün yorumu: <b>${reviews.data?.length ?? "—"}</b> · Yeni iş başvurusu: <b>${jobs.data?.length ?? "—"}</b> · Yeni potansiyel müşteri: <b>${potentials.data?.length ?? "—"}</b></p>

  ${h2("Güvenlik")}
  <p style="font-size:13px">Bugün admin girişi: <b>${loginRows.filter((l) => l.success).length}</b> başarılı · <b>${loginRows.filter((l) => !l.success).length}</b> başarısız · Açık oturum: <b>${sessions.data?.length ?? "—"}</b></p>
  ${loginRows.filter((l) => !l.success).length ? table(["Saat", "IP", "Neden"], loginRows.filter((l) => !l.success).map((l) => [time(l.at), esc(l.ip), esc(l.reason)])) : ""}

  ${errors.length ? `${h2("Alınamayan veriler")}<ul style="font-size:12.5px;color:#b45309">${errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
  <p style="font-size:12px;color:#6b7280;margin-top:26px">Detaylar: <a href="${SITE}/admin/reklam-ozeti">Reklam Özeti</a> · <a href="${SITE}/admin/analytics">Google Analytics</a> · <a href="${SITE}/admin/seo">SEO</a> · <a href="${SITE}/admin">Admin</a></p>
  </div></div>`;

  const subject = `Günlük Rapor · ${trDate.split("-").reverse().join(".")} · ${contacts} iletişim · ${tl(spend)} reklam`;
  return { subject, html, summary: { contacts, spend, leads: leadRows.length, metaLeads: metaRows.length, wa, calls, errors } };
}

export async function sendDailyReport(to?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY tanımlı değil.");
  const r = await buildDailyReport();
  const { error } = await new Resend(apiKey).emails.send({
    from: "Aktürk Enerji Rapor <onboarding@resend.dev>",
    to: to || process.env.REPORT_EMAIL || process.env.LEAD_NOTIFY_EMAIL || "info@akturkenerji.com.tr",
    subject: r.subject,
    html: r.html,
  });
  if (error) throw new Error(error.message);
  return r.summary;
}
