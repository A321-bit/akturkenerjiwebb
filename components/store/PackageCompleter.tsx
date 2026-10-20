"use client";

import { useMemo, useState } from "react";
import { Cable, Minus, MessageCircle, PackagePlus, Plus, Plug, SunMedium, Wrench } from "lucide-react";
import { whatsappLink } from "@/lib/data";
import { formatTL } from "@/lib/store";
import { mc4Count, pickCable, pickSets, suggestedPanels, type PcData } from "@/lib/package-complete";
import TrackedContactLink from "@/components/TrackedContactLink";

type Roof = "kiremit" | "trapez" | "kenet" | "zemin" | "yok";
type Line = { label: string; price: number };

const ROOFS: { key: Roof; label: string }[] = [
  { key: "kiremit", label: "Kiremit çatı" },
  { key: "trapez", label: "Trapez / sandviç çatı" },
  { key: "kenet", label: "Kenetli metal çatı" },
  { key: "zemin", label: "Zemin (arazi)" },
  { key: "yok", label: "Montaj istemiyorum" },
];

// Inverter + batarya paketinin ürün sayfasında: panel, montaj seti, solar kablo ve
// MC4 konnektörü paketle birlikte önerir; toplamı ve kalem kalem listeyi WhatsApp
// sipariş mesajına yazar. Kurallar lib/package-complete.ts'te.
export default function PackageCompleter({
  baseName,
  basePrice,
  inverterKw,
  url,
  data,
  whatsappNumber,
}: {
  baseName: string;
  basePrice?: number;
  inverterKw: number;
  url: string;
  data: PcData;
  whatsappNumber: string;
}) {
  const [panelKey, setPanelKey] = useState(data.defaultPanel);
  const panel = data.panels.find((p) => p.key === panelKey) ?? data.panels[0];
  const [count, setCount] = useState(() => suggestedPanels(inverterKw, panel?.watt ?? 620));
  const [roof, setRoof] = useState<Roof>("kiremit");
  const [use, setUse] = useState({ panel: true, montaj: true, kablo: true, mc4: true });

  function choosePanel(key: string) {
    const next = data.panels.find((p) => p.key === key);
    setPanelKey(key);
    if (next) setCount(suggestedPanels(inverterKw, next.watt));
  }

  const lines = useMemo(() => {
    const out: { key: keyof typeof use; items: Line[] }[] = [];
    if (panel) out.push({ key: "panel", items: [{ label: `${count} × ${panel.label}`, price: count * panel.price }] });

    const montaj: Line[] = [];
    if (roof === "zemin" && data.zemin) montaj.push({ label: `${count} × ${data.zemin.name} (panel başına)`, price: count * data.zemin.price });
    const set = roof === "kiremit" ? data.kiremitSet : roof === "trapez" ? data.trapezSet : roof === "kenet" ? data.kenetSet : undefined;
    if (set) for (const s of pickSets(count, set.options)) montaj.push({ label: `${s.count > 1 ? `${s.count} × ` : ""}${set.name} (${s.label})`, price: s.count * s.price });
    if (montaj.length) out.push({ key: "montaj", items: montaj });

    const kablo: Line[] = [];
    for (const c of [data.cableRed, data.cableBlack]) {
      const o = c && pickCable(count, c.options);
      if (c && o) kablo.push({ label: `${c.name} – ${o.label}`, price: o.price });
    }
    if (kablo.length) out.push({ key: "kablo", items: kablo });

    if (data.mc4) {
      const n = mc4Count(count);
      out.push({ key: "mc4", items: [{ label: `${n} × ${data.mc4.name}`, price: n * data.mc4.price }] });
    }
    return out;
  }, [panel, count, roof, data]);

  const extras = lines.filter((l) => use[l.key]).flatMap((l) => l.items);
  const extrasTotal = extras.reduce((s, l) => s + l.price, 0);
  const total = (basePrice ?? 0) + extrasTotal;
  const kwp = panel ? ((count * panel.watt) / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : "";

  const message = [
    "Merhaba, aşağıdaki paketi sipariş etmek istiyorum:",
    "",
    `• *${baseName}*${basePrice != null ? ` – ${formatTL(basePrice)}` : ""}`,
    ...extras.map((l) => `• ${l.label} – ${formatTL(l.price)}`),
    "",
    basePrice != null ? `*Toplam: ${formatTL(total)}* (KDV dahil, kurulum hariç)` : "Toplam fiyatı öğrenmek istiyorum.",
    "",
    `Ürün: ${url}`,
  ].join("\n");

  const icon = { panel: SunMedium, montaj: Wrench, kablo: Cable, mc4: Plug } as const;
  const title = { panel: "Güneş paneli", montaj: "Montaj", kablo: "Solar kablo", mc4: "Konnektör" } as const;

  return (
    <section id="paketi-tamamla" className="rounded-2xl border border-line bg-paper-raised p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <PackagePlus size={22} />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Paketi Tamamla</h2>
          <p className="text-[13.5px] text-slate">Panel, montaj ve kabloyu paketinize ekleyin; toplam fiyatı hemen görün.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4">
          {data.panels.length > 0 && (
            <div>
              <p className="text-[13px] font-semibold text-slate">Panel</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {data.panels.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => choosePanel(p.key)}
                    aria-pressed={p.key === panelKey}
                    className={`rounded-full border px-4 py-2 text-[13.5px] font-semibold ${p.key === panelKey ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-line">
                  <button type="button" aria-label="Panel azalt" onClick={() => setCount((c) => Math.max(1, c - 1))} className="flex h-10 w-10 items-center justify-center hover:text-brand">
                    <Minus size={16} />
                  </button>
                  <span className="min-w-[3ch] text-center text-[15px] font-bold tabular-nums">{count}</span>
                  <button type="button" aria-label="Panel artır" onClick={() => setCount((c) => Math.min(300, c + 1))} className="flex h-10 w-10 items-center justify-center hover:text-brand">
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-[13.5px] text-slate">
                  adet · toplam <strong className="text-ink">{kwp} kWp</strong>
                </span>
              </div>
              <p className="mt-1.5 text-[12.5px] text-slate-soft">
                Önerilen adet inverter gücüne göre hesaplandı. Paneller tek başına satılmaz, yalnızca bu paketle birlikte eklenir.
              </p>
            </div>
          )}

          <div>
            <p className="text-[13px] font-semibold text-slate">Çatı / kurulum yeri</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Çatı tipi">
              {ROOFS.filter((r) => r.key === "yok" || { kiremit: data.kiremitSet, trapez: data.trapezSet, kenet: data.kenetSet, zemin: data.zemin }[r.key]).map((r) => (
                <button
                  key={r.key}
                  type="button"
                  role="radio"
                  aria-checked={roof === r.key}
                  onClick={() => setRoof(r.key)}
                  className={`rounded-full border px-4 py-2 text-[13.5px] font-semibold ${roof === r.key ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[12.5px] text-slate-soft">Setler panellerin tek sıra dizilimine göre hesaplanır; farklı dizilim için bize yazın.</p>
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-line bg-paper p-4">
          <div className="flex justify-between gap-3 border-b border-line pb-3 text-[14px]">
            <span className="font-semibold text-ink">{baseName}</span>
            <span className="shrink-0 font-semibold tabular-nums">{basePrice != null ? formatTL(basePrice) : "—"}</span>
          </div>
          <ul className="flex flex-col gap-3 py-3">
            {lines.map((l) => {
              const Icon = icon[l.key];
              return (
                <li key={l.key}>
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate">
                    <input type="checkbox" checked={use[l.key]} onChange={(e) => setUse((u) => ({ ...u, [l.key]: e.target.checked }))} className="h-4 w-4 accent-[#0b1420]" />
                    <Icon size={15} /> {title[l.key]}
                  </label>
                  {l.items.map((it) => (
                    <div key={it.label} className={`mt-1 flex justify-between gap-3 pl-6 text-[13.5px] ${use[l.key] ? "text-ink" : "text-slate-soft line-through"}`}>
                      <span>{it.label}</span>
                      <span className="shrink-0 tabular-nums">{formatTL(it.price)}</span>
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>
          <div className="mt-auto border-t border-line pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] font-semibold text-slate">Toplam</span>
              <span className="font-display text-[1.6rem] font-bold tabular-nums text-ink">{basePrice != null ? formatTL(total) : "Sorun"}</span>
            </div>
            <p className="text-right text-[12px] text-slate">KDV dahil · kurulum hariç</p>
            <TrackedContactLink
              method="whatsapp"
              label="store_whatsapp_package_complete"
              href={whatsappLink(whatsappNumber, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-[15px] font-bold text-white transition-transform hover:scale-[1.02]"
            >
              <MessageCircle size={18} fill="currentColor" />
              Bu Paketi WhatsApp&apos;tan Sipariş Et
            </TrackedContactLink>
          </div>
        </div>
      </div>
    </section>
  );
}
