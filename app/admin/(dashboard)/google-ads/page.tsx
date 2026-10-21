"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Pencil, Pause, Play, Plus, Trash2, X } from "lucide-react";
import GoogleAdsReport from "@/components/admin/GoogleAdsReport";

// Admin "Google Ads" (hesap 334-276-8968): genel bakış, anahtar kelimeler, arama terimleri,
// negatifler, reklamlar ve uzantılar. Para harcatan/değiştiren her işlem onay sorar.

type Perf = { cost: number; clicks: number; impressions: number; conversions: number };
type Keyword = Perf & { id: string; campaignId: string; campaign: string; campaignStatus: string; adGroupId: string; adGroup: string; text: string; match: string; status: string; quality: number | null };
type Term = Perf & { term: string; status: string; campaignId: string; campaign: string; adGroupId: string; adGroup: string };
type Negative = { id: string; campaignId: string; campaign: string; text: string; match: string };
type Ad = { id: string; adId: string; adGroupId: string; campaignId: string; campaign: string; campaignStatus: string; adGroup: string; status: string; strength: string; approval: string; type: string; headlines: string[]; descriptions: string[]; url: string; path1: string; path2: string };
type Asset = { resource: string; level: string; campaign: string; campaignId: string; type: string; text: string; detail: string; url: string; image: string; status: string };
type Campaign = { id: string; name: string; status: string };

const TABS = [
  { key: "genel", label: "Genel Bakış" },
  { key: "kelimeler", label: "Anahtar Kelimeler" },
  { key: "terimler", label: "Arama Terimleri" },
  { key: "negatifler", label: "Negatif Kelimeler" },
  { key: "reklamlar", label: "Reklamlar" },
  { key: "uzantilar", label: "Uzantılar" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const MATCH: Record<string, string> = { EXACT: "Tam", PHRASE: "Öbek", BROAD: "Geniş" };
const STRENGTH: Record<string, string> = { EXCELLENT: "Mükemmel", GOOD: "İyi", AVERAGE: "Orta", POOR: "Zayıf", PENDING: "Hesaplanıyor" };
const FIELD: Record<string, string> = {
  SITELINK: "Site bağlantısı",
  CALLOUT: "Açıklama metni",
  STRUCTURED_SNIPPET: "Snippet",
  CALL: "Arama",
  IMAGE: "Görsel",
  AD_IMAGE: "Görsel",
  BUSINESS_NAME: "İşletme adı",
  BUSINESS_LOGO: "Logo",
  LOGO: "Logo",
};
/** Önerilen negatif kelimeler (google-ads-anahtar-kelimeler.xlsx ile aynı liste). */
const SUGGESTED_NEGATIVES = [
  "su ısıtıcı", "su ısıtma", "sıcak su", "basınçlı", "petek", "termosifon", "kollektör",
  "lamba", "aydınlatma", "sokak lambası", "şarj cihazı", "şarj kontrol", "powerbank", "pil",
  "mini", "küçük", "taşınabilir", "portatif", "seyyar", "katlanabilir", "esnek", "yapışkanlı", "balkon",
  "watt", "12 volt", "24 volt", "220 volt", "karavan", "kamp", "tekne", "çadır",
  "ikinci el", "2. el", "sahibinden", "letgo",
  "nedir", "nasıl yapılır", "nasıl çalışır", "pdf", "ödev", "tez", "yönetmeliği",
  "iş ilanı", "iş ilanları", "maaş", "staj", "eleman", "kariyer",
  "hibe", "jeneratör", "güneş ocağı", "oyuncak", "hesap makinesi",
  "cw enerji", "tünelsan", "eraslan", "entegre solar", "kalyon", "pekintaş", "anker", "ecoflow", "arçelik", "lexron",
  "lisanssız elektrik üretimi", "jel akü",
];

const tl = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: n < 100 ? 2 : 0 })} TL`;
const fmt = (n: number) => Math.round(n).toLocaleString("tr-TR");
const card = "rounded-2xl border border-line bg-paper-raised p-5";
const btn = "inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[12px] font-semibold hover:border-ink disabled:opacity-40";

function useList<T>(liste: string, days: number, enabled: boolean) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      fetch(`/api/admin/google-ads/yonet?liste=${liste}&gun=${days}`, { cache: "no-store" })
        .then(async (r) => {
          const b = await r.json();
          if (!r.ok) throw new Error(b.error ?? `Hata ${r.status}`);
          setData(b);
          setError("");
        })
        .catch((e) => setError(e.message)),
    [liste, days],
  );
  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);
  return { data, error, reload: load };
}

export default function GoogleAdsPage() {
  const [tab, setTab] = useState<Tab>("genel");
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const kw = useList<Keyword>("kelimeler", days, tab === "kelimeler");
  const terms = useList<Term>("terimler", days, tab === "terimler");
  const negs = useList<Negative>("negatifler", days, tab === "negatifler" || tab === "terimler");
  const ads = useList<Ad>("reklamlar", days, tab === "reklamlar");
  const assets = useList<Asset>("uzantilar", days, tab === "uzantilar");

  useEffect(() => {
    fetch("/api/admin/google-ads?gun=30", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => setCampaigns((b.campaigns ?? []).map((c: Campaign) => ({ id: c.id, name: c.name, status: c.status }))))
      .catch(() => {});
  }, []);

  async function act(body: object, done: string, after?: () => unknown) {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/admin/google-ads/yonet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "İşlem yapılamadı.");
      setMsg(done);
      await after?.();
      return true;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono-data text-[11px] uppercase tracking-[0.16em] text-brand">Reklamlar</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Google Ads</h1>
          <p className="mt-1 text-[13.5px] text-slate">Hesap 334-276-8968, canlı veri. Değişiklikler doğrudan Google Ads&apos;e gider.</p>
        </div>
        {tab !== "genel" && (
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="admin-input w-40">
            {[7, 14, 30, 90, 365].map((d) => (
              <option key={d} value={d}>
                Son {d} gün
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${tab === t.key ? "bg-ink text-paper" : "border border-line text-slate hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <p className="rounded-xl bg-paper-raised px-4 py-3 text-[13.5px] text-volt">{msg}</p>}

      {tab === "genel" && <GoogleAdsReport />}
      {tab === "kelimeler" && <Keywords list={kw} busy={busy} act={act} />}
      {tab === "terimler" && <Terms list={terms} negatives={negs.data ?? []} busy={busy} act={act} afterNeg={negs.reload} />}
      {tab === "negatifler" && <Negatives list={negs} campaigns={campaigns} busy={busy} act={act} />}
      {tab === "reklamlar" && <Ads list={ads} busy={busy} act={act} />}
      {tab === "uzantilar" && <Assets list={assets} campaigns={campaigns} busy={busy} act={act} />}
    </div>
  );
}

type Act = (body: object, done: string, after?: () => unknown) => Promise<boolean>;
type List<T> = { data: T[] | null; error: string; reload: () => Promise<unknown> };

function State<T>({ list, empty }: { list: List<T>; empty: string }) {
  if (list.error) return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13.5px] text-red-700">{list.error}</p>;
  if (!list.data) return <p className="text-[13.5px] text-slate">Yükleniyor…</p>;
  if (list.data.length === 0) return <p className="text-[13.5px] text-slate">{empty}</p>;
  return null;
}

function Keywords({ list, busy, act }: { list: List<Keyword>; busy: boolean; act: Act }) {
  const [campaign, setCampaign] = useState("aktif");
  const [q, setQ] = useState("");
  const [adGroup, setAdGroup] = useState("");
  const [texts, setTexts] = useState("");
  const [match, setMatch] = useState("PHRASE");
  const all = list.data ?? [];
  const campaigns = [...new Map(all.map((k) => [k.campaignId, { id: k.campaignId, name: k.campaign, status: k.campaignStatus }])).values()];
  const adGroups = [...new Map(all.map((k) => [k.adGroupId, `${k.campaign} › ${k.adGroup}`])).entries()];
  const shown = all.filter(
    (k) => (campaign === "aktif" ? k.campaignStatus === "ENABLED" : campaign === "tumu" || k.campaignId === campaign) && (!q || k.text.includes(q.toLocaleLowerCase("tr-TR"))),
  );
  const total = shown.reduce((s, k) => ({ cost: s.cost + k.cost, conv: s.conv + k.conversions }), { cost: 0, conv: 0 });

  return (
    <div className="flex flex-col gap-4">
      <section className={card}>
        <p className="text-[14px] font-semibold">Anahtar kelime ekle</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
          <select value={adGroup} onChange={(e) => setAdGroup(e.target.value)} className="admin-input">
            <option value="">Reklam grubu seçin…</option>
            {adGroups.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select value={match} onChange={(e) => setMatch(e.target.value)} className="admin-input">
            <option value="PHRASE">Öbek eşleme</option>
            <option value="EXACT">Tam eşleme</option>
            <option value="BROAD">Geniş eşleme</option>
          </select>
        </div>
        <textarea value={texts} onChange={(e) => setTexts(e.target.value)} rows={4} placeholder="Her satıra bir anahtar kelime" className="admin-input mt-3 w-full text-[13px]" />
        <button
          type="button"
          disabled={busy || !adGroup || !texts.trim()}
          onClick={() => {
            const t = texts.split("\n").map((x) => x.trim()).filter(Boolean);
            if (!confirm(`${t.length} anahtar kelime ${MATCH[match]} eşlemeyle eklensin mi?`)) return;
            act({ action: "kelime-ekle", adGroupId: adGroup, texts: t, match }, `${t.length} anahtar kelime eklendi.`, () => {
              setTexts("");
              return list.reload();
            });
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper disabled:opacity-40"
        >
          <Plus size={14} /> Ekle
        </button>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-center gap-2">
          <select value={campaign} onChange={(e) => setCampaign(e.target.value)} className="admin-input w-auto max-w-full">
            <option value="aktif">Aktif kampanyalar</option>
            <option value="tumu">Tüm kampanyalar</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.status === "PAUSED" ? "(durdu)" : ""}
              </option>
            ))}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara…" className="admin-input w-40" />
          <span className="ml-auto text-[12.5px] text-slate">
            {shown.length} kelime · {tl(total.cost)} · {fmt(total.conv)} dönüşüm
          </span>
        </div>
        <State list={list} empty="Anahtar kelime yok." />
        {shown.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead className="text-[12px] text-slate">
                <tr>
                  <th className="py-2 pr-3">Anahtar kelime</th>
                  <th className="pr-3">Eşleme</th>
                  <th className="pr-3 text-right">KP</th>
                  <th className="pr-3 text-right">Gösterim</th>
                  <th className="pr-3 text-right">Tık</th>
                  <th className="pr-3 text-right">Harcama</th>
                  <th className="pr-3 text-right">Dönüşüm</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((k) => (
                  <tr key={k.id} className={k.status === "PAUSED" ? "opacity-50" : ""}>
                    <td className="max-w-[320px] py-2 pr-3">
                      <p className="truncate font-medium">{k.text}</p>
                      <p className="truncate text-[11.5px] text-slate-soft">
                        {k.campaign} › {k.adGroup}
                      </p>
                    </td>
                    <td className="pr-3">{MATCH[k.match] ?? k.match}</td>
                    <td className="pr-3 text-right tabular-nums">{k.quality ?? "–"}</td>
                    <td className="pr-3 text-right tabular-nums">{fmt(k.impressions)}</td>
                    <td className="pr-3 text-right tabular-nums">{fmt(k.clicks)}</td>
                    <td className={`pr-3 text-right tabular-nums ${k.cost > 50 && !k.conversions ? "text-red-600" : ""}`}>{tl(k.cost)}</td>
                    <td className="pr-3 text-right font-semibold tabular-nums">{fmt(k.conversions)}</td>
                    <td className="whitespace-nowrap text-right">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          const next = k.status === "ENABLED" ? "PAUSED" : "ENABLED";
                          act({ action: "kelime-durum", id: k.id, status: next }, next === "PAUSED" ? `"${k.text}" durduruldu.` : `"${k.text}" açıldı.`, list.reload);
                        }}
                        className={btn}
                      >
                        {k.status === "ENABLED" ? <Pause size={12} /> : <Play size={12} />}
                      </button>{" "}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => confirm(`"${k.text}" silinsin mi?`) && act({ action: "kelime-sil", id: k.id }, `"${k.text}" silindi.`, list.reload)}
                        className={`${btn} hover:text-red-600`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Terms({ list, negatives, busy, act, afterNeg }: { list: List<Term>; negatives: Negative[]; busy: boolean; act: Act; afterNeg: () => Promise<unknown> }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [onlyWaste, setOnlyWaste] = useState(false);
  const negSet = useMemo(() => new Set(negatives.map((n) => `${n.campaignId}|${n.text}`)), [negatives]);
  const rows = (list.data ?? []).filter((t) => !onlyWaste || (t.cost > 0 && !t.conversions));
  const key = (t: Term) => `${t.campaignId}|${t.term}`;
  const toggle = (k: string) => setSel((s) => (s.has(k) ? new Set([...s].filter((x) => x !== k)) : new Set([...s, k])));

  async function negateSelected(match: string) {
    const picked = rows.filter((t) => sel.has(key(t)));
    const byCampaign = new Map<string, string[]>();
    for (const t of picked) byCampaign.set(t.campaignId, [...(byCampaign.get(t.campaignId) ?? []), t.term]);
    if (!confirm(`${picked.length} terim ilgili kampanyalarda ${MATCH[match]} eşlemeli negatif yapılsın mı?`)) return;
    for (const [c, texts] of byCampaign) {
      const ok = await act({ action: "negatif-ekle", campaignIds: [c], texts, match }, `${picked.length} terim negatif yapıldı.`);
      if (!ok) return;
    }
    setSel(new Set());
    await Promise.all([list.reload(), afterNeg()]);
  }

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-[13px]">
          <input type="checkbox" checked={onlyWaste} onChange={(e) => setOnlyWaste(e.target.checked)} /> Sadece para harcayıp dönüşüm getirmeyenler
        </label>
        <span className="flex-1" />
        <button type="button" disabled={busy || sel.size === 0} onClick={() => negateSelected("EXACT")} className={btn}>
          <Ban size={12} /> Seçilenleri negatif yap (tam)
        </button>
        <button type="button" disabled={busy || sel.size === 0} onClick={() => negateSelected("PHRASE")} className={btn}>
          <Ban size={12} /> Negatif yap (öbek)
        </button>
      </div>
      <p className="mt-2 text-[12px] text-slate">İnsanların reklamımızı gördüğü gerçek aramalar. Alakasızları işaretleyip negatif yapın; iyi olanları anahtar kelime olarak ekleyin.</p>
      <State list={list} empty="Bu dönemde arama terimi yok." />
      {rows.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="text-[12px] text-slate">
              <tr>
                <th className="py-2 pr-2" />
                <th className="pr-3">Arama terimi</th>
                <th className="pr-3">Durum</th>
                <th className="pr-3 text-right">Tık</th>
                <th className="pr-3 text-right">Harcama</th>
                <th className="pr-3 text-right">Dönüşüm</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((t) => {
                const negated = t.status === "EXCLUDED" || negSet.has(`${t.campaignId}|${t.term}`);
                return (
                  <tr key={`${key(t)}|${t.adGroupId}`}>
                    <td className="py-2 pr-2">
                      <input type="checkbox" disabled={negated} checked={sel.has(key(t))} onChange={() => toggle(key(t))} />
                    </td>
                    <td className="max-w-[320px] pr-3">
                      <p className="truncate font-medium">{t.term}</p>
                      <p className="truncate text-[11.5px] text-slate-soft">
                        {t.campaign} › {t.adGroup}
                      </p>
                    </td>
                    <td className="pr-3 text-[12px]">{negated ? <span className="text-red-600">Negatif</span> : t.status === "ADDED" ? <span className="text-volt">Anahtar kelime</span> : "–"}</td>
                    <td className="pr-3 text-right tabular-nums">{fmt(t.clicks)}</td>
                    <td className={`pr-3 text-right tabular-nums ${t.cost > 0 && !t.conversions ? "text-red-600" : ""}`}>{tl(t.cost)}</td>
                    <td className="pr-3 text-right font-semibold tabular-nums">{fmt(t.conversions)}</td>
                    <td className="text-right">
                      {t.status !== "ADDED" && !negated && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            confirm(`"${t.term}" anahtar kelime (tam eşleme) olarak "${t.adGroup}" grubuna eklensin mi?`) &&
                            act({ action: "kelime-ekle", adGroupId: t.adGroupId, texts: [t.term], match: "EXACT" }, `"${t.term}" anahtar kelime olarak eklendi.`, list.reload)
                          }
                          className={btn}
                        >
                          <Plus size={12} /> Kelime yap
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Negatives({ list, campaigns, busy, act }: { list: List<Negative>; campaigns: Campaign[]; busy: boolean; act: Act }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [texts, setTexts] = useState("");
  const [match, setMatch] = useState("PHRASE");
  const groups = useMemo(() => {
    const m = new Map<string, Negative[]>();
    for (const n of list.data ?? []) m.set(n.campaign, [...(m.get(n.campaign) ?? []), n]);
    return [...m];
  }, [list.data]);

  return (
    <div className="flex flex-col gap-4">
      <section className={card}>
        <p className="text-[14px] font-semibold">Negatif kelime ekle</p>
        <p className="mt-1 text-[12.5px] text-slate">Bu kelimeleri içeren aramalarda reklam çıkmaz. Öbek eşleme: kelime aramanın herhangi bir yerinde geçerse engellenir.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {campaigns.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-[13px]">
              <input
                type="checkbox"
                checked={picked.has(c.id)}
                onChange={(e) => setPicked((s) => (e.target.checked ? new Set([...s, c.id]) : new Set([...s].filter((x) => x !== c.id))))}
              />
              <span className="max-w-[260px] truncate">{c.name}</span>
              {c.status === "PAUSED" && <span className="text-[11px] text-slate-soft">(durdu)</span>}
            </label>
          ))}
        </div>
        <textarea value={texts} onChange={(e) => setTexts(e.target.value)} rows={5} placeholder="Her satıra bir kelime" className="admin-input mt-3 w-full text-[13px]" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={match} onChange={(e) => setMatch(e.target.value)} className="admin-input w-40">
            <option value="PHRASE">Öbek eşleme</option>
            <option value="EXACT">Tam eşleme</option>
            <option value="BROAD">Geniş eşleme</option>
          </select>
          <button type="button" onClick={() => setTexts(SUGGESTED_NEGATIVES.join("\n"))} className={btn}>
            Önerilen listeyi doldur ({SUGGESTED_NEGATIVES.length})
          </button>
          <button
            type="button"
            disabled={busy || picked.size === 0 || !texts.trim()}
            onClick={() => {
              const t = [...new Set(texts.split("\n").map((x) => x.trim()).filter(Boolean))];
              if (!confirm(`${t.length} negatif kelime ${picked.size} kampanyaya eklensin mi?`)) return;
              act({ action: "negatif-ekle", campaignIds: [...picked], texts: t, match }, `${t.length} negatif kelime eklendi.`, () => {
                setTexts("");
                return list.reload();
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper disabled:opacity-40"
          >
            <Plus size={14} /> Ekle
          </button>
        </div>
      </section>

      <section className={card}>
        <p className="text-[14px] font-semibold">Mevcut negatif kelimeler</p>
        <State list={list} empty="Hiç negatif kelime yok; bu yüzden alakasız aramalara da para gidiyor." />
        {groups.map(([camp, items]) => (
          <div key={camp} className="mt-4">
            <p className="text-[12.5px] font-semibold text-slate">{camp}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {items.map((n) => (
                <span key={n.id} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[12.5px]">
                  {n.text} <span className="text-[10.5px] text-slate-soft">{MATCH[n.match]}</span>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label="Kaldır"
                    onClick={() => act({ action: "negatif-sil", id: n.id }, `"${n.text}" kaldırıldı.`, list.reload)}
                    className="text-slate-soft hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

const APPROVAL: Record<string, string> = { APPROVED: "Onaylı", APPROVED_LIMITED: "Sınırlı onay", DISAPPROVED: "Reddedildi", UNDER_REVIEW: "İnceleniyor", UNKNOWN: "İncelenmedi" };

type Draft = { headlines: string[]; descriptions: string[]; finalUrl: string; path1: string; path2: string };
const pad = (xs: string[], n: number) => [...xs, ...Array(Math.max(0, n - xs.length)).fill("")].slice(0, n);

/** Duyarlı arama reklamı düzenleyici: 15 başlık (≤30), 4 açıklama (≤90), adres ve görünen yol. */
function RsaEditor({ initial, busy, onSave, onCancel, saveLabel }: { initial: Draft; busy: boolean; onSave: (d: Draft) => void; onCancel: () => void; saveLabel: string }) {
  const [d, setD] = useState<Draft>({ ...initial, headlines: pad(initial.headlines, 15), descriptions: pad(initial.descriptions, 4) });
  const set = (k: "headlines" | "descriptions", i: number, v: string) => setD((x) => ({ ...x, [k]: x[k].map((y, j) => (j === i ? v : y)) }));
  const filledH = d.headlines.filter((x) => x.trim()).length;
  const filledD = d.descriptions.filter((x) => x.trim()).length;
  const bad = d.headlines.some((x) => x.length > 30) || d.descriptions.some((x) => x.length > 90) || d.path1.length > 15 || d.path2.length > 15;
  const counter = (n: number, max: number) => <span className={`w-12 shrink-0 text-right text-[11px] tabular-nums ${n > max ? "font-bold text-red-600" : "text-slate-soft"}`}>{n}/{max}</span>;

  return (
    <div className="mt-3 rounded-xl border border-line bg-paper p-4">
      <p className="text-[13px] font-semibold">Başlıklar ({filledH}/15, en az 3)</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {d.headlines.map((h, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input value={h} onChange={(e) => set("headlines", i, e.target.value)} placeholder={`Başlık ${i + 1}`} className="admin-input flex-1 text-[13px]" />
            {counter(h.length, 30)}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] font-semibold">Açıklamalar ({filledD}/4, en az 2)</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {d.descriptions.map((h, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input value={h} onChange={(e) => set("descriptions", i, e.target.value)} placeholder={`Açıklama ${i + 1}`} className="admin-input flex-1 text-[13px]" />
            {counter(h.length, 90)}
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_160px_160px]">
        <label className="flex flex-col gap-1 text-[12px]">
          <span className="font-semibold">Gideceği sayfa</span>
          <input value={d.finalUrl} onChange={(e) => setD((x) => ({ ...x, finalUrl: e.target.value }))} className="admin-input text-[13px]" />
        </label>
        <label className="flex flex-col gap-1 text-[12px]">
          <span className="font-semibold">Görünen yol 1</span>
          <input value={d.path1} onChange={(e) => setD((x) => ({ ...x, path1: e.target.value }))} className="admin-input text-[13px]" />
        </label>
        <label className="flex flex-col gap-1 text-[12px]">
          <span className="font-semibold">Görünen yol 2</span>
          <input value={d.path2} onChange={(e) => setD((x) => ({ ...x, path2: e.target.value }))} className="admin-input text-[13px]" />
        </label>
      </div>
      <p className="mt-2 text-[12px] text-slate">
        Önizleme: <span className="text-brand">{d.headlines.filter((x) => x.trim()).slice(0, 3).join(" | ")}</span> · akturkenerji.com/{[d.path1, d.path2].filter(Boolean).join("/")}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy || bad || filledH < 3 || filledD < 2}
          onClick={() => onSave({ ...d, headlines: d.headlines.filter((x) => x.trim()), descriptions: d.descriptions.filter((x) => x.trim()) })}
          className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper disabled:opacity-40"
        >
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel} className={btn}>
          <X size={12} /> Vazgeç
        </button>
      </div>
    </div>
  );
}

function Ads({ list, busy, act }: { list: List<Ad>; busy: boolean; act: Act }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [newIn, setNewIn] = useState<string>("");
  const [campaign, setCampaign] = useState("tumu");
  const all = list.data ?? [];
  const campaigns = [...new Map(all.map((a) => [a.campaignId, `${a.campaign}${a.campaignStatus === "PAUSED" ? " (durdu)" : ""}`])).entries()];
  const adGroups = [...new Map(all.map((a) => [a.adGroupId, a])).values()];
  const shown = all.filter((a) => campaign === "tumu" || a.campaignId === campaign);
  const draftOf = (a: Ad): Draft => ({ headlines: a.headlines, descriptions: a.descriptions, finalUrl: a.url, path1: a.path1, path2: a.path2 });
  const template = adGroups.find((a) => a.adGroupId === newIn);

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center gap-2">
        <select value={campaign} onChange={(e) => setCampaign(e.target.value)} className="admin-input w-auto max-w-full">
          <option value="tumu">Tüm kampanyalar</option>
          {campaigns.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <span className="flex-1" />
        <select value={newIn} onChange={(e) => setNewIn(e.target.value)} className="admin-input w-auto max-w-full">
          <option value="">+ Yeni reklam: reklam grubu seçin…</option>
          {adGroups.map((a) => (
            <option key={a.adGroupId} value={a.adGroupId}>
              {a.campaign} › {a.adGroup}
            </option>
          ))}
        </select>
      </div>
      {template && (
        <div className="mt-3">
          <p className="text-[13px] font-semibold">
            Yeni reklam: {template.campaign} › {template.adGroup} <span className="font-normal text-slate">(mevcut reklamdan kopyalandı, değiştirip kaydedin)</span>
          </p>
          <RsaEditor
            initial={draftOf(template)}
            busy={busy}
            saveLabel="Reklamı oluştur"
            onCancel={() => setNewIn("")}
            onSave={(d) =>
              confirm("Yeni reklam oluşturulsun mu? Google incelemesinden sonra yayına girer.") &&
              act({ action: "reklam-ekle", adGroupId: template.adGroupId, rsa: d }, "Yeni reklam oluşturuldu.", () => {
                setNewIn("");
                return list.reload();
              })
            }
          />
        </div>
      )}
      <State list={list} empty="Reklam yok." />
      <ul className="mt-2 flex flex-col divide-y divide-line">
        {shown.map((a) => (
          <li key={a.id} className={`py-4 ${a.status === "PAUSED" && editing !== a.id ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
              <span className="font-semibold">
                {a.campaign} › {a.adGroup}
              </span>
              <span className="rounded-full bg-paper px-2 py-0.5">{a.status === "ENABLED" ? "Aktif" : "Durdu"}</span>
              {a.strength && <span className="rounded-full bg-paper px-2 py-0.5">Güç: {STRENGTH[a.strength] ?? a.strength}</span>}
              {a.approval && <span className={`rounded-full px-2 py-0.5 ${a.approval === "DISAPPROVED" ? "bg-red-50 text-red-700" : "bg-paper"}`}>{APPROVAL[a.approval] ?? a.approval}</span>}
              <span className="flex-1" />
              {a.type === "RESPONSIVE_SEARCH_AD" && (
                <button type="button" disabled={busy} onClick={() => setEditing(editing === a.id ? null : a.id)} className={btn}>
                  <Pencil size={12} /> Düzenle
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const next = a.status === "ENABLED" ? "PAUSED" : "ENABLED";
                  act({ action: "reklam-durum", id: a.id, status: next }, next === "PAUSED" ? "Reklam durduruldu." : "Reklam açıldı.", list.reload);
                }}
                className={btn}
              >
                {a.status === "ENABLED" ? (
                  <>
                    <Pause size={12} /> Durdur
                  </>
                ) : (
                  <>
                    <Play size={12} /> Aç
                  </>
                )}
              </button>
            </div>
            {editing === a.id ? (
              <RsaEditor
                initial={draftOf(a)}
                busy={busy}
                saveLabel="Değişiklikleri kaydet"
                onCancel={() => setEditing(null)}
                onSave={(d) =>
                  confirm("Reklam güncellensin mi? Google yeniden inceler; inceleme bitene kadar eski hâli yayında kalabilir.") &&
                  act({ action: "reklam-duzenle", adId: a.adId, rsa: d }, "Reklam güncellendi.", () => {
                    setEditing(null);
                    return list.reload();
                  })
                }
              />
            ) : (
              <>
                {a.headlines.length > 0 && <p className="mt-2 text-[13.5px] text-brand">{a.headlines.join(" | ")}</p>}
                {a.descriptions.length > 0 && <p className="mt-1 text-[13px] text-slate">{a.descriptions.join(" · ")}</p>}
                {a.url && (
                  <p className="mt-1 truncate text-[12px] text-slate-soft">
                    {a.url} {a.path1 ? `· /${[a.path1, a.path2].filter(Boolean).join("/")}` : ""}
                  </p>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Assets({ list, campaigns, busy, act }: { list: List<Asset>; campaigns: Campaign[]; busy: boolean; act: Act }) {
  const [campaign, setCampaign] = useState("");
  const [kind, setKind] = useState<"SITELINK" | "CALLOUT">("SITELINK");
  const [f, setF] = useState({ text: "", d1: "", d2: "", url: "https://akturkenerji.com/" });
  const groups = useMemo(() => {
    const m = new Map<string, Asset[]>();
    for (const a of list.data ?? []) {
      const k = a.level === "Hesap" ? "Tüm hesap" : a.campaign;
      m.set(k, [...(m.get(k) ?? []), a]);
    }
    return [...m];
  }, [list.data]);
  const max = kind === "SITELINK" ? 25 : 25;

  return (
    <div className="flex flex-col gap-4">
      <section className={card}>
        <p className="text-[14px] font-semibold">Uzantı ekle</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_200px]">
          <select value={campaign} onChange={(e) => setCampaign(e.target.value)} className="admin-input">
            <option value="">Kampanya seçin…</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.status === "PAUSED" ? "(durdu)" : ""}
              </option>
            ))}
          </select>
          <select value={kind} onChange={(e) => setKind(e.target.value as "SITELINK" | "CALLOUT")} className="admin-input">
            <option value="SITELINK">Site bağlantısı</option>
            <option value="CALLOUT">Açıklama metni</option>
          </select>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder={kind === "SITELINK" ? "Bağlantı metni (≤25)" : "Açıklama metni (≤25)"} className="admin-input text-[13px]" />
          <span className={`self-center text-[11px] ${f.text.length > max ? "font-bold text-red-600" : "text-slate-soft"}`}>
            {f.text.length}/{max}
          </span>
          {kind === "SITELINK" && (
            <>
              <input value={f.d1} onChange={(e) => setF({ ...f, d1: e.target.value })} placeholder="Açıklama satırı 1 (≤35)" className="admin-input text-[13px]" />
              <input value={f.d2} onChange={(e) => setF({ ...f, d2: e.target.value })} placeholder="Açıklama satırı 2 (≤35)" className="admin-input text-[13px]" />
              <input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://akturkenerji.com/…" className="admin-input text-[13px] sm:col-span-2" />
            </>
          )}
        </div>
        <button
          type="button"
          disabled={busy || !campaign || !f.text.trim() || f.text.length > max}
          onClick={() =>
            act(
              kind === "SITELINK" ? { action: "sitelink-ekle", campaignId: campaign, ...f } : { action: "callout-ekle", campaignId: campaign, text: f.text },
              "Uzantı eklendi.",
              () => {
                setF({ text: "", d1: "", d2: "", url: "https://akturkenerji.com/" });
                return list.reload();
              },
            )
          }
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper disabled:opacity-40"
        >
          <Plus size={14} /> Ekle
        </button>
        <p className="mt-2 text-[12px] text-slate">Bir uzantının metnini değiştirmek için eskisini kaldırıp yenisini ekleyin.</p>
      </section>

      <section className={card}>
        <State list={list} empty="Uzantı yok." />
        {groups.map(([g, items]) => (
          <div key={g} className="mb-4">
            <p className="text-[12.5px] font-semibold text-slate">{g}</p>
            <ul className="mt-2 divide-y divide-line">
              {items.map((a) => (
                <li key={a.resource} className="flex items-start gap-3 py-2 text-[13px]">
                  <span className="w-28 shrink-0 text-[12px] text-slate">{FIELD[a.type] ?? a.type}</span>
                  {a.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- Google Ads görsel önizlemesi
                    <img src={a.image} alt="" className="h-12 w-auto max-w-[96px] shrink-0 rounded object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{a.text}</p>
                    {a.detail && <p className="text-[12px] text-slate">{a.detail}</p>}
                    {a.url && <p className="truncate text-[11.5px] text-slate-soft">{a.url}</p>}
                  </div>
                  {a.type !== "CALL" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => confirm(`"${a.text}" kaldırılsın mı?`) && act({ action: "uzanti-kaldir", resource: a.resource }, `"${a.text}" kaldırıldı.`, list.reload)}
                      className={`${btn} hover:text-red-600`}
                    >
                      <Trash2 size={12} />
                    </button>
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
