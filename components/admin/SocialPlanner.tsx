"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Play, Trash2, XCircle } from "lucide-react";
import type { SocialPost } from "@/lib/social";

const TYPES = [
  { key: "urun", label: "Ürün / paket" },
  { key: "kategori", label: "Kategori" },
  { key: "referans", label: "Referans" },
  { key: "blog", label: "Blog yazısı" },
  { key: "hizmet", label: "Hizmet" },
] as const;
const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
type Slot = { weekday: number; hour: 10 | 19; type: (typeof TYPES)[number]["key"] };

const DEFAULT_SLOTS: Slot[] = [
  { weekday: 1, hour: 10, type: "urun" },
  { weekday: 3, hour: 10, type: "referans" },
  { weekday: 5, hour: 10, type: "urun" },
  { weekday: 6, hour: 19, type: "blog" },
];

const typeLabel = (t: string) => TYPES.find((x) => x.key === t)?.label ?? t;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const tomorrow = () => new Date(Date.now() + 86400000 + 3 * 3600000).toISOString().slice(0, 10);

const STATUS: Record<string, { label: string; cls: string }> = {
  bekliyor: { label: "bekliyor", cls: "bg-paper text-slate" },
  zamanlandi: { label: "Meta'da zamanlandı", cls: "bg-brand/10 text-brand" },
  paylasildi: { label: "paylaşıldı", cls: "bg-volt/15 text-ink" },
  yok: { label: "–", cls: "text-slate-soft" },
};

export default function SocialPlanner({ posts }: { posts: SocialPost[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<{ ok: boolean; page?: string; instagram?: string | null; error?: string } | null>(null);
  const [start, setStart] = useState(tomorrow());
  const [months, setMonths] = useState(6);
  const [slots, setSlots] = useState<Slot[]>(DEFAULT_SLOTS);
  const [platforms, setPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    fetch("/api/admin/social/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ ok: false, error: "Bağlantı kontrol edilemedi." }));
  }, []);

  const pending = posts.filter((p) => !p.approved).length;
  const byMonth = useMemo(() => {
    const m = new Map<string, SocialPost[]>();
    for (const p of posts) {
      const k = new Date(p.scheduled_at).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    return [...m.entries()];
  }, [posts]);

  async function call(url: string, init?: RequestInit) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error ?? "İşlem yapılamadı.");
      router.refresh();
      return data;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createPlan() {
    if (replace && !confirm("Henüz Meta'ya gitmemiş gelecek gönderiler silinip plan yeniden oluşturulacak. Devam edilsin mi?")) return;
    const d = await call("/api/admin/social/plan", { method: "POST", body: JSON.stringify({ start, months, slots, platforms, replace }) });
    if (d) setMsg(`${d.created} gönderilik taslak plan oluşturuldu. Kontrol edip "Tümünü onayla" deyin.`);
  }

  const card = "rounded-2xl border border-line bg-paper-raised p-5";

  return (
    <div className="flex flex-col gap-5">
      <div className={`${card} flex flex-wrap items-center gap-3 text-[13.5px]`}>
        {status == null ? (
          <span className="text-slate">Meta bağlantısı kontrol ediliyor…</span>
        ) : status.ok ? (
          <span className="flex items-center gap-1.5 text-ink">
            <CheckCircle2 size={16} className="text-volt" /> Bağlı: Facebook <strong>{status.page}</strong>
            {status.instagram ? (
              <>
                {" "}· Instagram <strong>@{status.instagram}</strong>
              </>
            ) : (
              " · Instagram hesabı bağlı değil"
            )}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-red-600">
            <XCircle size={16} /> Meta bağlı değil: {status.error}
          </span>
        )}
        <span className="flex-1" />
        <button
          type="button"
          disabled={busy || !status?.ok}
          onClick={async () => {
            const d = await call("/api/admin/social/run", { method: "POST" });
            if (d) setMsg(`Facebook: ${d.facebook} gönderi, Instagram: ${d.instagram} gönderi.${d.errors?.length ? ` Hatalar: ${d.errors.join(" | ")}` : ""}`);
          }}
          className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 font-semibold hover:border-ink disabled:opacity-40"
        >
          <Play size={14} /> Şimdi çalıştır
        </button>
      </div>

      <section className={card}>
        <h2 className="font-display text-[17px] font-semibold">Plan oluştur</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-[13px]">
            <span className="font-medium">Başlangıç</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="admin-input" />
          </label>
          <label className="flex flex-col gap-1 text-[13px]">
            <span className="font-medium">Süre</span>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="admin-input">
              {[1, 2, 3, 6, 9, 12].map((m) => (
                <option key={m} value={m}>
                  {m} ay
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-[13px]">
            <span className="font-medium">Platformlar</span>
            <div className="flex gap-4 pt-2">
              {["facebook", "instagram"].map((p) => (
                <label key={p} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={platforms.includes(p)}
                    onChange={(e) => setPlatforms((x) => (e.target.checked ? [...x, p] : x.filter((y) => y !== p)))}
                  />
                  {p === "facebook" ? "Facebook" : "Instagram"}
                </label>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-[13px] font-medium">Haftalık paylaşım düzeni</p>
        <div className="mt-2 flex flex-col gap-2">
          {slots.map((s, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select value={s.weekday} onChange={(e) => setSlots((x) => x.map((y, j) => (j === i ? { ...y, weekday: Number(e.target.value) } : y)))} className="admin-input w-36">
                {DAYS.map((d, k) => (
                  <option key={d} value={k + 1}>
                    {d}
                  </option>
                ))}
              </select>
              <select value={s.hour} onChange={(e) => setSlots((x) => x.map((y, j) => (j === i ? { ...y, hour: Number(e.target.value) as 10 | 19 } : y)))} className="admin-input w-28">
                <option value={10}>10:00</option>
                <option value={19}>19:00</option>
              </select>
              <select value={s.type} onChange={(e) => setSlots((x) => x.map((y, j) => (j === i ? { ...y, type: e.target.value as Slot["type"] } : y)))} className="admin-input w-44">
                {TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => setSlots((x) => x.filter((_, j) => j !== i))} className="rounded px-2 text-red-600 hover:bg-red-50" aria-label="Sil">
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSlots((x) => [...x, { weekday: 2, hour: 10, type: "hizmet" }])}
            className="self-start rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium hover:bg-paper"
          >
            + Gün ekle
          </button>
        </div>
        <p className="mt-2 text-[12px] text-slate">
          Her tür kendi içinde sırayla döner (ör. bütün paketler bir kez paylaşılınca baştan başlar). Instagram saatleri 10:00 ve 19:00
          ile sınırlı; Facebook tam saatinde paylaşılır.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1.5 text-[13px]">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> Mevcut gönderilmemiş planı sil, yeniden kur
          </label>
          <button
            type="button"
            disabled={busy || !slots.length || !platforms.length}
            onClick={createPlan}
            className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-40"
          >
            Planı oluştur
          </button>
        </div>
      </section>

      {msg && <p className="rounded-xl bg-paper-raised px-4 py-3 text-[13.5px] text-volt">{msg}</p>}

      <section className={card}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-[17px] font-semibold">Plan ({posts.length} gönderi)</h2>
          {pending > 0 && <span className="rounded-full bg-sun/20 px-2.5 py-0.5 text-[12.5px] font-semibold">{pending} onay bekliyor</span>}
          <span className="flex-1" />
          {pending > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const d = await call("/api/admin/social/approve", { method: "POST" });
                if (d) setMsg(`${d.approved} gönderi onaylandı; otomatik paylaşım devrede.`);
              }}
              className="rounded-full bg-volt px-4 py-2 text-[13.5px] font-semibold text-ink disabled:opacity-40"
            >
              Tümünü onayla
            </button>
          )}
        </div>

        {posts.length === 0 && <p className="mt-3 text-[13.5px] text-slate">Henüz plan yok.</p>}
        {byMonth.map(([month, list]) => (
          <div key={month} className="mt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-slate">{month}</h3>
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
              {list.map((p) => (
                <li key={p.id} className="p-3">
                  <div className="flex flex-wrap items-center gap-3 text-[13.5px]">
                    <img
                      src={`/social/${p.source_type}/${encodeURIComponent(p.source_slug)}?f=sq`}
                      alt=""
                      width={48}
                      height={48}
                      loading="lazy"
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <span className="w-44 shrink-0 tabular-nums text-slate">{fmtDate(p.scheduled_at)}</span>
                    <span className="rounded-full bg-paper px-2 py-0.5 text-[12px]">{typeLabel(p.source_type)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(open === p.id ? null : p.id);
                        setDraft(p.caption);
                      }}
                      className="min-w-0 flex-1 truncate text-left font-medium text-ink hover:text-brand"
                    >
                      {p.title}
                    </button>
                    <span className={`rounded-full px-2 py-0.5 text-[12px] ${STATUS[p.fb_status]?.cls ?? "text-red-600"}`}>
                      FB: {p.fb_post_id && p.fb_status === "paylasildi" ? (
                        <a href={`https://www.facebook.com/${p.fb_post_id}`} target="_blank" rel="noreferrer" className="underline">
                          paylaşıldı
                        </a>
                      ) : (
                        STATUS[p.fb_status]?.label ?? p.fb_status
                      )}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[12px] ${STATUS[p.ig_status]?.cls ?? "text-red-600"}`}>
                      IG: {p.ig_permalink ? (
                        <a href={p.ig_permalink} target="_blank" rel="noreferrer" className="underline">
                          paylaşıldı
                        </a>
                      ) : (
                        STATUS[p.ig_status]?.label ?? p.ig_status
                      )}
                    </span>
                    {!p.approved && <span className="rounded-full bg-sun/20 px-2 py-0.5 text-[12px]">taslak</span>}
                    <button
                      type="button"
                      onClick={() => confirm("Gönderi silinsin mi?") && call(`/api/admin/social/posts/${p.id}`, { method: "DELETE" })}
                      className="text-slate hover:text-red-600"
                      aria-label="Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {p.error && <p className="mt-1.5 text-[12.5px] text-red-600">{p.error}</p>}
                  {open === p.id && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr]">
                      <img src={`/social/${p.source_type}/${encodeURIComponent(p.source_slug)}?f=sq&fiyat=1`} alt="" className="w-full rounded-lg" />
                      <div className="flex flex-col gap-2">
                        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={12} className="admin-input font-mono text-[12.5px]" />
                        {p.fb_status === "zamanlandi" && (
                          <p className="text-[12px] text-slate">Bu gönderi Facebook&apos;ta zamanlandı; metin değişikliği yalnızca Instagram&apos;a yansır.</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => call(`/api/admin/social/posts/${p.id}`, { method: "PATCH", body: JSON.stringify({ caption: draft }) })}
                            className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper disabled:opacity-40"
                          >
                            Metni kaydet
                          </button>
                          <a href={p.link} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:border-ink">
                            Sayfayı aç
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
