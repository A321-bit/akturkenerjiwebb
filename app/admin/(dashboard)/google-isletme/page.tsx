"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, MessageSquareReply, Navigation, PhoneCall, Search, Send, Star, Trash2, MousePointerClick } from "lucide-react";
import { BarList, DailyArea, GOLD } from "@/components/admin/OverviewCharts";
import PlannedTab from "./Planned";

// Google İşletme Profili: performans, arama terimleri, yorumlar ve gönderiler.
// Yanıt ve gönderiler Google'da herkese açık yayınlanır; yalnızca butonla gönderilir.

type Location = { account: string; name: string; title: string; address?: string; phone?: string; website?: string; mapsUri?: string };
type Review = { name: string; author: string; photo?: string; stars: number; comment?: string; createTime: string; reply?: { comment: string; updateTime: string } };
type Post = { name: string; summary?: string; createTime: string; state?: string; searchUrl?: string; photo?: string; ctaUrl?: string };
type Row = { date: string; search: number; maps: number; calls: number; website: number; directions: number };
type Keyword = { keyword: string; value: number | null; threshold: number | null };
type Metric = "search" | "maps" | "calls" | "website" | "directions";

const TABS = ["Performans", "Yorumlar", "Gönderiler", "Planlı"] as const;
const num = (n: number) => n.toLocaleString("tr-TR");
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `Hata ${r.status}`);
  return d as T;
}

async function act(body: object) {
  const r = await fetch("/api/admin/gbp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `Hata ${r.status}`);
}

export default function GoogleIsletmePage() {
  const [status, setStatus] = useState<{ connected: boolean; locations?: Location[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locName, setLocName] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Performans");

  useEffect(() => {
    getJson<{ connected: boolean; locations?: Location[] }>("/api/admin/gbp?view=status")
      .then(setStatus)
      .catch((e) => setError(e.message));
  }, []);

  const locations = status?.locations;
  const loc = locations?.find((l) => l.name === locName) ?? locations?.[0] ?? null;

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Reklam Yönetimi</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Google İşletme</h1>

      {error && <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-[14px] text-red-700">{error}</p>}
      {!status && !error && <p className="mt-6 text-slate">Yükleniyor…</p>}

      {status && !status.connected && (
        <div className="mt-6 max-w-xl rounded-2xl border border-line bg-paper-raised p-6">
          <p className="font-semibold">Google hesabı henüz bağlı değil</p>
          <p className="mt-1 text-[14px] text-slate">İşletme profilinin yöneticisi olan Google hesabıyla izin verin. Google “doğrulanmamış uygulama” uyarısı gösterirse Gelişmiş → Devam et seçeneğini kullanın; bu uygulama size aittir.</p>
          {/* Yönlendirme için tam sayfa geçişi gerekir. */}
          <a href="/api/admin/gbp/connect" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2.5 text-[14px] font-semibold text-paper hover:bg-brand-deep">
            Google ile bağlan
          </a>
        </div>
      )}

      {status?.connected && locations?.length === 0 && <p className="mt-6 text-slate">Bu Google hesabında yönetilen işletme bulunamadı.</p>}

      {loc && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {locations!.length > 1 ? (
              <select value={loc.name} onChange={(e) => setLocName(e.target.value)} className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-[14px] font-semibold">
                {locations!.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.title}
                  </option>
                ))}
              </select>
            ) : (
              <p className="font-semibold">{loc.title}</p>
            )}
            {loc.address && <span className="flex items-center gap-1 text-[13px] text-slate"><MapPin size={14} /> {loc.address}</span>}
            {loc.mapsUri && (
              <a href={loc.mapsUri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline">
                Haritada gör <ExternalLink size={13} />
              </a>
            )}
          </div>

          <nav className="mt-4 flex gap-1 border-b border-line">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-3.5 py-2 text-[13.5px] font-semibold ${tab === t ? "border-brand text-ink" : "border-transparent text-slate hover:text-ink"}`}>
                {t}
              </button>
            ))}
          </nav>

          {/* İşletme değişince sekme verisi baştan yüklenir. */}
          <div key={loc.name} className="mt-5">
            {tab === "Performans" && <Performance loc={loc} />}
            {tab === "Yorumlar" && <Reviews loc={loc} />}
            {tab === "Gönderiler" && <Posts loc={loc} />}
            {tab === "Planlı" && <PlannedTab location={loc.name} />}
          </div>
        </>
      )}
    </div>
  );
}

const METRICS: { key: Metric; label: string; icon: React.ReactNode }[] = [
  { key: "search", label: "Arama görünümü", icon: <Search size={15} /> },
  { key: "maps", label: "Harita görünümü", icon: <MapPin size={15} /> },
  { key: "calls", label: "Arama (telefon)", icon: <PhoneCall size={15} /> },
  { key: "website", label: "Web sitesi tıklaması", icon: <MousePointerClick size={15} /> },
  { key: "directions", label: "Yol tarifi", icon: <Navigation size={15} /> },
];

function Performance({ loc }: { loc: Location }) {
  const [data, setData] = useState<{ rows: Row[]; days: number; keywords: Keyword[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("search");

  useEffect(() => {
    getJson<{ rows: Row[]; days: number; keywords: Keyword[] }>(`/api/admin/gbp?view=performance&location=${loc.name}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [loc.name]);

  const split = useMemo(() => {
    if (!data) return null;
    const cur = data.rows.slice(-data.days);
    const prev = data.rows.slice(0, -data.days);
    const sum = (rows: Row[], k: Metric) => rows.reduce((s, r) => s + r[k], 0);
    return { cur, totals: METRICS.map((m) => ({ ...m, value: sum(cur, m.key), prev: sum(prev, m.key) })) };
  }, [data]);

  if (error) return <p className="rounded-xl bg-red-500/10 p-4 text-[14px] text-red-700">{error}</p>;
  if (!data || !split) return <p className="text-slate">Yükleniyor…</p>;

  return (
    <div>
      <p className="text-[13px] text-slate">Son {data.days} gün, önceki {data.days} günle karşılaştırmalı. Google verileri birkaç gün gecikmeli gelir.</p>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {split.totals.map((t) => {
          const pct = t.prev > 0 ? Math.round(((t.value - t.prev) / t.prev) * 100) : null;
          return (
            <button key={t.key} onClick={() => setMetric(t.key)} className={`rounded-xl border bg-paper-raised p-3 text-left transition ${metric === t.key ? "border-brand ring-2 ring-brand/25" : "border-line hover:border-brand"}`}>
              <p className="flex items-center gap-1.5 text-[12px] text-slate">{t.icon} {t.label}</p>
              <p className="mt-1 font-mono-data text-2xl font-semibold">{num(t.value)}</p>
              <p className={`text-[12px] ${pct == null ? "text-slate" : pct >= 0 ? "text-volt" : "text-red-600"}`}>{pct == null ? `önceki ${num(t.prev)}` : `${pct >= 0 ? "+" : ""}%${pct} (önceki ${num(t.prev)})`}</p>
            </button>
          );
        })}
      </div>
      <section className="mt-5 rounded-2xl border border-line bg-paper-raised p-5">
        <h3 className="font-semibold">{METRICS.find((m) => m.key === metric)!.label}: günlük</h3>
        <div className="mt-3">
          <DailyArea data={split.cur.map((r) => ({ day: r.date, value: r[metric] }))} color={metric === "search" || metric === "maps" ? undefined : GOLD} unit={METRICS.find((m) => m.key === metric)!.label.toLocaleLowerCase("tr-TR")} />
        </div>
      </section>
      <section className="mt-5 rounded-2xl border border-line bg-paper-raised p-5">
        <h3 className="font-semibold">Müşteriler sizi hangi aramalarla buluyor?</h3>
        <p className="text-[12.5px] text-slate">Son üç ay. Google düşük hacimli aramaları tam sayı yerine eşik olarak verir (ör. 15&apos;ten az).</p>
        <div className="mt-3">
          <BarList rows={data.keywords.slice(0, 20).map((k) => ({ label: k.value == null ? `${k.keyword} (<${k.threshold ?? 15})` : k.keyword, value: k.value ?? k.threshold ?? 0 }))} empty="Bu dönem için arama terimi verisi yok." />
        </div>
      </section>
    </div>
  );
}

function Reviews({ loc }: { loc: Location }) {
  const [data, setData] = useState<{ average: number | null; total: number; reviews: Review[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open">("open");

  const load = useCallback(() => {
    getJson<{ average: number | null; total: number; reviews: Review[] }>(`/api/admin/gbp?view=reviews&account=${loc.account}&location=${loc.name}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [loc.account, loc.name]);
  useEffect(load, [load]);

  if (error) return <p className="rounded-xl bg-red-500/10 p-4 text-[14px] text-red-700">{error}</p>;
  if (!data) return <p className="text-slate">Yükleniyor…</p>;
  const open = data.reviews.filter((r) => !r.reply);
  const shown = filter === "open" ? open : data.reviews;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <p className="flex items-center gap-1.5 font-display text-2xl font-semibold"><Star size={20} className="fill-sun text-sun" /> {data.average?.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) ?? "—"}</p>
        <p className="text-[13.5px] text-slate">{num(data.total)} yorum · {open.length} yanıtsız (son {data.reviews.length} yorum içinde)</p>
        <div className="flex gap-1">
          {(["open", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold ${filter === f ? "border-ink bg-ink text-paper" : "border-line text-slate hover:border-ink"}`}>
              {f === "open" ? "Yanıt bekleyen" : "Tümü"}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 && <p className="mt-6 text-slate">{filter === "open" ? "Yanıt bekleyen yorum yok." : "Yorum yok."}</p>}
      <div className="mt-4 space-y-3">
        {shown.map((r) => (
          <ReviewCard key={r.name} r={r} onChange={load} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ r, onChange }: { r: Review; onChange: () => void }) {
  const [text, setText] = useState(r.reply?.comment ?? "");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(body: object) {
    setBusy(true);
    setErr(null);
    try {
      await act(body);
      setEditing(false);
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Hata");
    }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{r.author}</p>
        <p className="flex items-center gap-2 text-[12.5px] text-slate">
          <span className="flex" aria-label={`${r.stars} yıldız`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={14} className={i < r.stars ? "fill-sun text-sun" : "text-line"} />
            ))}
          </span>
          {fmtDate(r.createTime)}
        </p>
      </div>
      {r.comment ? <p className="mt-2 whitespace-pre-line text-[14px] text-ink">{r.comment}</p> : <p className="mt-2 text-[13px] italic text-slate">Yorum metni yok, yalnızca puan.</p>}

      {r.reply && !editing && (
        <div className="mt-3 rounded-xl bg-paper p-3 text-[13.5px]">
          <p className="text-[12px] font-semibold text-slate">Yanıtınız · {fmtDate(r.reply.updateTime)}</p>
          <p className="mt-1 whitespace-pre-line">{r.reply.comment}</p>
          <div className="mt-2 flex gap-3 text-[12.5px] font-semibold">
            <button onClick={() => setEditing(true)} className="text-brand hover:underline">Düzenle</button>
            <button disabled={busy} onClick={() => run({ action: "deleteReply", review: r.name })} className="text-slate hover:text-red-600">Yanıtı sil</button>
          </div>
        </div>
      )}

      {(!r.reply || editing) && (
        <div className="mt-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Yanıtınızı yazın (Google'da herkese açık görünür)" className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] outline-none focus:border-brand" />
          <div className="mt-1.5 flex items-center gap-3">
            <button disabled={busy || !text.trim()} onClick={() => run({ action: "reply", review: r.name, comment: text })} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[13px] font-semibold text-paper hover:bg-brand-deep disabled:opacity-40">
              <MessageSquareReply size={14} /> {busy ? "Gönderiliyor…" : "Yanıtı yayınla"}
            </button>
            {editing && <button onClick={() => setEditing(false)} className="text-[13px] text-slate">Vazgeç</button>}
          </div>
        </div>
      )}
      {err && <p className="mt-2 text-[13px] text-red-600">{err}</p>}
    </div>
  );
}

function Posts({ loc }: { loc: Location }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    getJson<{ posts: Post[] }>(`/api/admin/gbp?view=posts&account=${loc.account}&location=${loc.name}`)
      .then((d) => setPosts(d.posts))
      .catch((e) => setError(e.message));
  }, [loc.account, loc.name]);
  useEffect(load, [load]);

  async function publish() {
    setBusy(true);
    setMsg(null);
    try {
      await act({ action: "post", account: loc.account, location: loc.name, summary, url, photoUrl });
      setSummary("");
      setUrl("");
      setPhotoUrl("");
      setMsg("Gönderi Google'a iletildi. İncelemeden sonra yayınlanır.");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Hata");
    }
    setBusy(false);
  }

  async function remove(name: string) {
    if (!confirm("Bu gönderi Google'dan silinsin mi?")) return;
    try {
      await act({ action: "deletePost", post: name });
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Hata");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <section className="rounded-2xl border border-line bg-paper-raised p-5">
        <h3 className="font-semibold">Yeni gönderi</h3>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} maxLength={1500} placeholder="Gönderi metni" className="mt-3 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] outline-none focus:border-brand" />
        <p className="text-right text-[11.5px] text-slate">{summary.length} / 1500</p>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Bağlantı (isteğe bağlı), https://akturkenerji.com/..." className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] outline-none focus:border-brand" />
        <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Fotoğraf adresi (isteğe bağlı), https://..." className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] outline-none focus:border-brand" />
        <button disabled={busy || !summary.trim()} onClick={publish} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13.5px] font-semibold text-paper hover:bg-brand-deep disabled:opacity-40">
          <Send size={14} /> {busy ? "Gönderiliyor…" : "Google'da yayınla"}
        </button>
        {msg && <p className="mt-2 text-[13px] text-slate">{msg}</p>}
      </section>

      <section>
        <h3 className="font-semibold">Son gönderiler</h3>
        {error && <p className="mt-2 rounded-xl bg-red-500/10 p-4 text-[14px] text-red-700">{error}</p>}
        {!posts && !error && <p className="mt-2 text-slate">Yükleniyor…</p>}
        {posts?.length === 0 && <p className="mt-2 text-slate">Henüz gönderi yok.</p>}
        <div className="mt-3 space-y-3">
          {posts?.map((p) => (
            <div key={p.name} className="rounded-2xl border border-line bg-paper-raised p-4">
              <div className="flex justify-between gap-3 text-[12.5px] text-slate">
                <span>{fmtDate(p.createTime)}{p.state && p.state !== "LIVE" ? ` · ${p.state === "PROCESSING" ? "inceleniyor" : p.state === "REJECTED" ? "reddedildi" : p.state}` : ""}</span>
                <button onClick={() => remove(p.name)} className="hover:text-red-600" aria-label="Gönderiyi sil"><Trash2 size={15} /></button>
              </div>
              <p className="mt-1.5 line-clamp-5 whitespace-pre-line text-[14px]">{p.summary}</p>
              {p.searchUrl && (
                <a href={p.searchUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
                  Google&apos;da gör <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
