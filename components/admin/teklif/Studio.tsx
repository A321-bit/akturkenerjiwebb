"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Box, FilePlus2, FolderOpen, Grid3x3, Map as MapIcon, MousePointer2, PenLine, Plus, Printer, RotateCcw, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { ABONE_ADLARI, type AboneGrubu } from "@/lib/elektrik-tarife";
import { YON_ADI, autoFill, cellAt, cellFits, faceFrame, guessAzimuth, isFlat, pointInFace, polygonArea, toXY, type LatLon, type LayoutSettings, type PanelModel, type RoofFace, type XY } from "@/lib/teklif/geometry";
import { DEFAULT_TERMS, computeNumbers, newProposalNo, type InverterChoice, type PriceLine, type Proposal } from "@/lib/teklif/proposal";
import ProposalDocument, { type Company } from "./ProposalDocument";
import type { EditorMode } from "./SatelliteEditor";
import type { Roof3DHandle } from "./Roof3D";

// Teklif Stüdyosu: müşteri → çatı tasarımı (uydu + 3B) → sistem ve üretim → fiyat → PDF.

const SatelliteEditor = dynamic(() => import("./SatelliteEditor"), { ssr: false, loading: () => <div className="h-[560px] animate-pulse rounded-2xl bg-ink/5" /> });
const Roof3D = dynamic(() => import("./Roof3D"), { ssr: false });

type Product = { name: string; kw: number; price?: number; slug?: string };
type Props = {
  panels: (PanelModel & { slug?: string })[];
  inverters: Product[];
  packages: { kw: number; price: number }[];
  company: Company;
  initialCalcId?: number;
  initialId?: number;
};

const DRAFT_KEY = "aktrk_teklif_taslak";
const ANKARA: LatLon = [39.925, 32.837];
const TABS = ["Müşteri", "Çatı tasarımı", "Sistem ve üretim", "Fiyat ve koşullar", "Önizleme ve PDF"] as const;
const tl = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} TL`;
const num = (n: number, d = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: d });
const uid = () => Math.random().toString(36).slice(2, 9);

function blank(panel: PanelModel): Proposal {
  return {
    proposalNo: newProposalNo(),
    status: "Taslak",
    createdAt: new Date().toISOString(),
    validDays: 15,
    customer: { name: "", phone: "", email: "", address: "", province: "" },
    abone: "mesken",
    monthlyBillTl: 0,
    site: { center: ANKARA, zoom: 18 },
    panel,
    faces: [],
    cells: [],
    setbackM: 0.4,
    gapM: 0.02,
    inverter: null,
    yields: {},
    lines: [],
    pricesIncludeVat: true,
    discountTl: 0,
    paymentTerms: DEFAULT_TERMS.payment,
    scopeNotes: DEFAULT_TERMS.scope,
    warrantyNotes: DEFAULT_TERMS.warranty,
  };
}

export default function Studio({ panels, inverters, packages, company, initialCalcId, initialId }: Props) {
  const defaultPanel = panels.find((p) => p.wp === 620) ?? panels[0] ?? { name: "620 Wp TOPCon panel", wp: 620, lengthM: 2.382, widthM: 1.134 };
  const [p, setP] = useState<Proposal>(() => blank(defaultPanel));
  const [tab, setTab] = useState(0);
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [mode, setMode] = useState<EditorMode>("sec");
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [list, setList] = useState<{ id: number; proposal_no: string; customer_name: string | null; total: number | null; updated_at: string }[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const r3d = useRef<Roof3DHandle>(null);
  const fetching = useRef(new Set<string>());

  const update = (patch: Partial<Proposal>) => setP((x) => ({ ...x, ...patch }));
  const layout: LayoutSettings = useMemo(() => ({ setbackM: p.setbackM, gapM: p.gapM, lat: p.site.center[0] }), [p.setbackM, p.gapM, p.site.center]);
  const frames = useMemo(() => p.faces.map((f) => faceFrame(f, p.site.center, p.panel, layout)), [p.faces, p.site.center, p.panel, layout]);
  // Izgarayı değiştiren ayarlardan (panel boyu, eğim, kaydırma) sonra artık sığmayan paneller sayılmaz.
  const cells = useMemo(() => {
    const byId = new Map(frames.map((f) => [f.face.id, f]));
    return p.cells.filter((c) => {
      const fr = byId.get(c.faceId);
      return fr && cellFits(fr, c.i, c.j, layout);
    });
  }, [p.cells, frames, layout]);
  const n = useMemo(() => computeNumbers({ ...p, cells }), [p, cells]);
  const sel = p.faces.find((f) => f.id === selected) ?? null;

  // Açılış: kayıtlı teklif, hesaplama talebinden ön doldurma ya da tarayıcıdaki taslak.
  useEffect(() => {
    (async () => {
      try {
        if (initialId) {
          const r = await fetch(`/api/admin/proposals/${initialId}`);
          if (r.ok) setP(await r.json());
        } else if (initialCalcId) {
          const r = await fetch("/api/admin/calculations");
          const rows = r.ok ? await r.json() : [];
          const c = rows.find((x: { id: number }) => x.id === initialCalcId);
          if (c) {
            const base = blank(defaultPanel);
            setP({
              ...base,
              calcId: c.id,
              customer: { ...base.customer, name: c.fullname ?? "", phone: c.phone ?? "", email: c.email ?? "", province: c.province ?? "" },
              abone: (c.inputs?.tariff as AboneGrubu) ?? "mesken",
              monthlyBillTl: Math.round(c.monthlyBillTl ?? 0),
              site: { center: c.lat && c.lng ? [c.lat, c.lng] : ANKARA, zoom: c.lat ? 20 : 18 },
            });
          }
        } else {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (raw) setP(JSON.parse(raw));
        }
      } catch {
        // açılamazsa boş teklifle devam
      }
      setLoaded(true);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- yalnız açılışta

  // Tarayıcıya otomatik taslak.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...p, images: undefined }));
    } catch {
      // depolama doluysa yok say
    }
  }, [p, loaded]);

  // Paneli olan her yüzey için PVGIS üretimi (yön/eğim değişince yeniden).
  useEffect(() => {
    for (const f of p.faces) {
      if (!p.cells.some((c) => c.faceId === f.id)) continue;
      const tilt = isFlat(f) ? f.mountTilt : f.pitch;
      const [lat, lon] = f.points[0];
      const sig = `${f.id}|${lat.toFixed(2)}|${lon.toFixed(2)}|${tilt}|${f.azimuth}`;
      if (fetching.current.has(sig)) continue;
      fetching.current.add(sig);
      fetch(`/api/hesaplama/pvgis?lat=${lat}&lon=${lon}&angle=${tilt}&aspect=${f.azimuth}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => setP((x) => ({ ...x, yields: { ...x.yields, [f.id]: d.monthly } })))
        .catch(() => fetching.current.delete(sig));
    }
  }, [p.faces, p.cells]);

  // --- Çatı yüzeyi işlemleri ---
  function addFace(points: LatLon[]) {
    const center = p.faces.length ? p.site.center : ([points.reduce((s, q) => s + q[0], 0) / points.length, points.reduce((s, q) => s + q[1], 0) / points.length] as LatLon);
    const face: RoofFace = {
      id: uid(),
      name: `Yüzey ${p.faces.length + 1}`,
      points,
      pitch: 25,
      azimuth: guessAzimuth(points, center),
      eaveHeight: 6,
      mountTilt: 20,
      orientation: "dikey",
      offsetU: 0,
      offsetV: 0,
    };
    setP((x) => ({ ...x, site: { ...x.site, center }, faces: [...x.faces, face] }));
    setSelected(face.id);
    setMode("sec");
  }
  const patchFace = (id: string, patch: Partial<RoofFace>) => setP((x) => ({ ...x, faces: x.faces.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  function fill(id: string) {
    const fr = frames.find((f) => f.face.id === id);
    if (!fr) return;
    setP((x) => ({ ...x, cells: [...x.cells.filter((c) => c.faceId !== id), ...autoFill(fr, layout)] }));
  }
  function clearFace(id: string) {
    setP((x) => ({ ...x, cells: x.cells.filter((c) => c.faceId !== id) }));
  }
  function removeFace(id: string) {
    setP((x) => ({ ...x, faces: x.faces.filter((f) => f.id !== id), cells: x.cells.filter((c) => c.faceId !== id) }));
    setSelected(null);
  }
  function togglePanel(pt: XY) {
    // Önce seçili yüzey, sonra tıklanan noktayı içeren yüzey.
    const fr = (selected && frames.find((f) => f.face.id === selected && pointInFace(f, pt))) || frames.find((f) => pointInFace(f, pt));
    if (!fr) return;
    setSelected(fr.face.id);
    const { i, j } = cellAt(fr, pt, layout);
    setP((x) => {
      const has = x.cells.some((c) => c.faceId === fr.face.id && c.i === i && c.j === j);
      if (has) return { ...x, cells: x.cells.filter((c) => !(c.faceId === fr.face.id && c.i === i && c.j === j)) };
      if (!cellFits(fr, i, j, layout)) return x;
      return { ...x, cells: [...x.cells, { faceId: fr.face.id, i, j }] };
    });
  }

  // --- Fiyat kalemleri ---
  function buildLines() {
    const lines: PriceLine[] = [{ id: uid(), ad: `${p.panel.name} (${p.panel.wp} Wp)`, adet: n.panelCount, birim: "adet", birimFiyat: p.panel.price ?? 0 }];
    if (p.inverter) lines.push({ id: uid(), ad: p.inverter.name, adet: p.inverter.adet, birim: "adet", birimFiyat: p.inverter.price ?? 0 });
    // Kalan kalem: mağaza anahtar teslim paketlerinin kW fiyatından ekipman düşülerek önerilir.
    const ac = Math.max(1, n.dcKwp / 1.1);
    const ref = [...packages].sort((a, b) => Math.abs(a.kw - ac) - Math.abs(b.kw - ac))[0];
    const turnkey = ref ? (ref.price / ref.kw) * ac : 0;
    const equipment = lines.reduce((s, l) => s + l.adet * l.birimFiyat, 0);
    lines.push({ id: uid(), ad: "Montaj konstrüksiyonu, DC/AC kablolama, koruma panosu, montaj ve işçilik, elektrik projesi ve kabul işlemleri", adet: 1, birim: "set", birimFiyat: Math.max(0, Math.round((turnkey - equipment) / 100) * 100) });
    update({ lines });
  }
  const patchLine = (id: string, patch: Partial<PriceLine>) => update({ lines: p.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  // --- Kaydet / aç / yazdır ---
  function captureImages() {
    const perspective = r3d.current?.snapshot("perspective") ?? undefined;
    const top = r3d.current?.snapshot("top") ?? undefined;
    if (perspective || top) update({ images: { perspective, top } });
  }
  async function save() {
    setMsg("Kaydediliyor…");
    const r = await fetch("/api/admin/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proposal: { ...p, cells }, dcKwp: n.dcKwp, total: n.total }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      update({ id: d.id });
      setMsg("Kaydedildi.");
    } else setMsg(/proposals/.test(d.error ?? "") ? "Veritabanında teklif tablosu henüz yok (supabase/proposals.sql çalıştırılmalı). Taslak bu tarayıcıda saklanıyor." : `Kaydedilemedi: ${d.error ?? r.status}`);
  }
  async function openList() {
    const r = await fetch("/api/admin/proposals");
    setList(r.ok ? await r.json() : []);
  }
  async function openProposal(id: number) {
    const r = await fetch(`/api/admin/proposals/${id}`);
    if (r.ok) {
      setP(await r.json());
      setList(null);
      setTab(1);
    }
  }
  function startNew() {
    if (!confirm("Yeni teklif başlatılsın mı? Kaydedilmemiş değişiklikler tarayıcı taslağından silinir.")) return;
    setP(blank(defaultPanel));
    setSelected(null);
    setTab(0);
  }
  function goTab(i: number) {
    if (i === 4) captureImages();
    setTab(i);
  }
  function print() {
    captureImages();
    setTimeout(() => window.print(), 300);
  }

  const panelCountOf = (id: string) => cells.filter((c) => c.faceId === id).length;
  const recommendedInv = inverters.filter((i) => i.kw >= n.dcKwp / 1.3 && i.kw <= n.dcKwp / 0.85);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Satış</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Teklif Stüdyosu</h1>
          <p className="text-[13px] text-slate">
            {p.proposalNo} · {p.customer.name || "müşteri girilmedi"} · {n.panelCount} panel · {num(n.dcKwp, 2)} kWp{n.total ? ` · ${tl(n.total)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn icon={<FilePlus2 size={15} />} onClick={startNew}>Yeni</Btn>
          <Btn icon={<FolderOpen size={15} />} onClick={openList}>Teklifler</Btn>
          <Btn icon={<Save size={15} />} onClick={save} primary>Kaydet</Btn>
          <Btn icon={<Printer size={15} />} onClick={() => { goTab(4); print(); }}>PDF</Btn>
        </div>
      </div>
      {msg && <p className="mt-2 text-[13px] text-slate" onClick={() => setMsg(null)}>{msg}</p>}

      {list && (
        <div className="mt-3 rounded-2xl border border-line bg-paper-raised p-4">
          <div className="flex items-center justify-between"><p className="font-semibold">Kayıtlı teklifler</p><button onClick={() => setList(null)} className="text-[13px] text-slate">Kapat</button></div>
          {list.length === 0 && <p className="mt-2 text-[13px] text-slate">Kayıtlı teklif yok (ya da teklif tablosu henüz oluşturulmadı).</p>}
          <div className="mt-2 divide-y divide-line">
            {list.map((x) => (
              <button key={x.id} onClick={() => openProposal(x.id)} className="flex w-full justify-between gap-3 py-2 text-left text-[13.5px] hover:text-brand">
                <span>{x.proposal_no} · {x.customer_name ?? "—"}</span>
                <span className="text-slate">{x.total ? tl(x.total) : ""} · {new Date(x.updated_at).toLocaleDateString("tr-TR")}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="mt-5 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => goTab(i)} className={`-mb-px border-b-2 px-3.5 py-2 text-[13.5px] font-semibold ${tab === i ? "border-brand text-ink" : "border-transparent text-slate hover:text-ink"}`}>
            {i + 1}. {t}
          </button>
        ))}
      </nav>

      {/* 1. Müşteri */}
      {tab === 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Ad soyad / firma" value={p.customer.name} onChange={(v) => update({ customer: { ...p.customer, name: v } })} />
          <Field label="Telefon" value={p.customer.phone} onChange={(v) => update({ customer: { ...p.customer, phone: v } })} />
          <Field label="E-posta" value={p.customer.email} onChange={(v) => update({ customer: { ...p.customer, email: v } })} />
          <Field label="İl" value={p.customer.province} onChange={(v) => update({ customer: { ...p.customer, province: v } })} />
          <Field label="Adres" value={p.customer.address} onChange={(v) => update({ customer: { ...p.customer, address: v } })} className="sm:col-span-2" />
          <label className="block">
            <span className="text-[12.5px] font-semibold text-slate">Abonelik</span>
            <select value={p.abone} onChange={(e) => update({ abone: e.target.value as AboneGrubu })} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2">
              {(Object.keys(ABONE_ADLARI) as AboneGrubu[]).map((k) => <option key={k} value={k}>{ABONE_ADLARI[k]}</option>)}
            </select>
          </label>
          <NumInput label="Ortalama aylık fatura (TL)" value={p.monthlyBillTl} onChange={(v) => update({ monthlyBillTl: v })} note="Tasarruf ve geri ödeme bu faturaya göre hesaplanır." />
          <div className="sm:col-span-2"><Btn icon={<PenLine size={15} />} onClick={() => goTab(1)} primary>Çatı tasarımına geç</Btn></div>
        </div>
      )}

      {/* 2. Çatı tasarımı: harita ve 3B sahne hep kurulu kalır (PDF görselleri için); başka sekmede ekran dışına alınır. */}
      {(
        <div className={tab === 1 ? "mt-5 grid gap-5 xl:grid-cols-[1fr_340px]" : "pointer-events-none fixed -left-[5000px] top-0 grid w-[1400px] grid-cols-[1fr_340px] gap-5"} aria-hidden={tab !== 1}>
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Seg on={view === "2d"} onClick={() => setView("2d")} icon={<MapIcon size={15} />}>Uydu (2B)</Seg>
              <Seg on={view === "3d"} onClick={() => setView("3d")} icon={<Box size={15} />}>3B görünüm</Seg>
              {view === "2d" && (
                <>
                  <span className="mx-2 h-5 w-px bg-line" />
                  <Seg on={mode === "sec"} onClick={() => setMode("sec")} icon={<MousePointer2 size={15} />}>Seç</Seg>
                  <Seg on={mode === "ciz"} onClick={() => setMode("ciz")} icon={<PenLine size={15} />}>Yüzey çiz</Seg>
                  <Seg on={mode === "panel"} onClick={() => setMode("panel")} icon={<Grid3x3 size={15} />}>Panel yerleştir</Seg>
                </>
              )}
            </div>
            {view === "2d" && (
              <SatelliteEditor
                center={p.site.center}
                zoom={p.site.zoom}
                frames={frames}
                cells={cells}
                layout={layout}
                selectedFaceId={selected}
                mode={mode}
                onView={(_c, zoom) => setP((x) => (x.site.zoom === zoom ? x : { ...x, site: { ...x.site, zoom } }))}
                onFaceDrawn={addFace}
                onSelectFace={setSelected}
                onPanelClick={togglePanel}
              />
            )}
            <div className={view === "3d" ? "" : "pointer-events-none fixed -left-[3000px] top-0 h-[560px] w-[1000px]"}>
              <Roof3D ref={r3d} center={p.site.center} frames={frames} cells={cells} layout={layout} lat={p.site.center[0]} />
            </div>
            {view === "3d" && <p className="mt-2 text-[12.5px] text-slate">Fareyle döndürün, tekerlekle yakınlaştırın, sağ tuşla kaydırın. Zemin: uydu görüntüsü (Esri).</p>}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-line bg-paper-raised p-4">
              <p className="text-[12.5px] font-semibold text-slate">Panel modeli</p>
              <select
                value={p.panel.slug ?? p.panel.name}
                onChange={(e) => {
                  const m = panels.find((x) => (x.slug ?? x.name) === e.target.value);
                  if (m) update({ panel: m });
                }}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-2 py-2 text-[13px]"
              >
                {panels.map((m) => <option key={m.slug ?? m.name} value={m.slug ?? m.name}>{m.name} · {m.wp} Wp{m.price ? ` · ${tl(m.price)}/adet` : ""}</option>)}
              </select>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <NumInput small label="Boy (m)" value={p.panel.lengthM} step={0.001} onChange={(v) => update({ panel: { ...p.panel, lengthM: v } })} />
                <NumInput small label="En (m)" value={p.panel.widthM} step={0.001} onChange={(v) => update({ panel: { ...p.panel, widthM: v } })} />
                <NumInput small label="Kenar boşluğu (m)" value={p.setbackM} step={0.05} onChange={(v) => update({ setbackM: v })} />
                <NumInput small label="Panel arası (m)" value={p.gapM} step={0.01} onChange={(v) => update({ gapM: v })} />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-paper-raised p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Çatı yüzeyleri</p>
                <button onClick={() => { setView("2d"); setMode("ciz"); }} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand"><Plus size={14} /> Yüzey çiz</button>
              </div>
              {p.faces.length === 0 && (
                <p className="mt-2 text-[13px] text-slate">Haritada adresi bulun, “Yüzey çiz” ile çatının bir yüzünün köşelerine tıklayın. Beşik çatıda iki yüzü ayrı ayrı çizin.</p>
              )}
              <div className="mt-2 space-y-1">
                {p.faces.map((f) => (
                  <button key={f.id} onClick={() => setSelected(f.id)} className={`flex w-full justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] ${f.id === selected ? "bg-sun/15 font-semibold" : "hover:bg-ink/5"}`}>
                    <span>{f.name} · {YON_ADI(f.azimuth)}</span>
                    <span className="text-slate">{panelCountOf(f.id)} panel</span>
                  </button>
                ))}
              </div>
            </div>

            {sel && (
              <div className="rounded-2xl border border-sun/50 bg-paper-raised p-4">
                <input value={sel.name} onChange={(e) => patchFace(sel.id, { name: e.target.value })} className="w-full rounded-lg border border-line bg-paper px-2 py-1.5 font-semibold" />
                <p className="mt-1 text-[12px] text-slate">
                  Alan {num(polygonArea(sel.points.map((q) => toXY(q, p.site.center))), 1)} m² (yatay) · {panelCountOf(sel.id)} panel · {num((panelCountOf(sel.id) * p.panel.wp) / 1000, 2)} kWp
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <NumInput small label="Eğim (°)" value={sel.pitch} onChange={(v) => patchFace(sel.id, { pitch: Math.max(0, Math.min(60, v)) })} note={isFlat(sel) ? "Düz çatı" : undefined} />
                  <NumInput small label="Saçak yüksekliği (m)" value={sel.eaveHeight} step={0.5} onChange={(v) => patchFace(sel.id, { eaveHeight: Math.max(0, v) })} note="Arazi için 0" />
                  <label className="col-span-2 block">
                    <span className="text-[11.5px] font-semibold text-slate">Panellerin baktığı yön: {YON_ADI(sel.azimuth)} ({sel.azimuth}°)</span>
                    <input type="range" min={-180} max={180} step={5} value={sel.azimuth} onChange={(e) => patchFace(sel.id, { azimuth: Number(e.target.value) })} className="w-full accent-brand" />
                    <div className="flex justify-between text-[10.5px] text-slate"><span>K</span><span>D</span><span>G</span><span>B</span><span>K</span></div>
                  </label>
                  <button onClick={() => patchFace(sel.id, { azimuth: ((sel.azimuth + 360) % 360) - 180 })} className="col-span-2 rounded-lg border border-line py-1.5 text-[12.5px] font-semibold hover:border-ink">
                    <RotateCcw size={13} className="mr-1 inline" /> Yönü ters çevir (karşı yüz)
                  </button>
                  {isFlat(sel) && <NumInput small label="Sehpa eğimi (°)" value={sel.mountTilt} onChange={(v) => patchFace(sel.id, { mountTilt: Math.max(0, Math.min(45, v)) })} />}
                  <label className="block">
                    <span className="text-[11.5px] font-semibold text-slate">Panel yönü</span>
                    <select value={sel.orientation} onChange={(e) => patchFace(sel.id, { orientation: e.target.value as RoofFace["orientation"] })} className="mt-0.5 w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px]">
                      <option value="dikey">Dikey</option>
                      <option value="yatay">Yatay</option>
                    </select>
                  </label>
                  <label className="col-span-2 block">
                    <span className="text-[11.5px] font-semibold text-slate">Izgarayı kaydır (saçak boyunca / eğim yönünde)</span>
                    <input type="range" min={0} max={2} step={0.05} value={sel.offsetU} onChange={(e) => patchFace(sel.id, { offsetU: Number(e.target.value) })} className="w-full accent-brand" />
                    <input type="range" min={0} max={2} step={0.05} value={sel.offsetV} onChange={(e) => patchFace(sel.id, { offsetV: Number(e.target.value) })} className="w-full accent-brand" />
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Btn icon={<Wand2 size={14} />} onClick={() => fill(sel.id)} primary>Otomatik doldur</Btn>
                  <Btn icon={<Grid3x3 size={14} />} onClick={() => { setView("2d"); setMode("panel"); }}>Elle yerleştir</Btn>
                  <Btn icon={<RotateCcw size={14} />} onClick={() => clearFace(sel.id)}>Panelleri temizle</Btn>
                  <Btn icon={<Trash2 size={14} />} onClick={() => removeFace(sel.id)}>Yüzeyi sil</Btn>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-ink p-4 text-paper">
              <p className="text-[12px] text-paper/70">Toplam</p>
              <p className="font-display text-2xl font-semibold">{n.panelCount} panel · {num(n.dcKwp, 2)} kWp</p>
              <p className="text-[12.5px] text-paper/70">{n.annualProduction ? `Yılda ~${num(n.annualProduction)} kWh` : "Üretim, panel eklenince hesaplanır"}</p>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Sistem ve üretim */}
      {tab === 2 && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <h3 className="font-semibold">İnvertör</h3>
            <p className="text-[12.5px] text-slate">Panel gücü {num(n.dcKwp, 2)} kWp. Uygun aralık: {num(n.dcKwp / 1.3, 1)}–{num(n.dcKwp / 0.85, 1)} kW AC (DC/AC 0,85–1,30).</p>
            <select
              value={p.inverter?.slug ?? ""}
              onChange={(e) => {
                const inv = inverters.find((x) => x.slug === e.target.value);
                update({ inverter: inv ? ({ ...inv, adet: p.inverter?.adet ?? 1 } as InverterChoice) : null });
              }}
              className="mt-3 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px]"
            >
              <option value="">İnvertör seçin</option>
              {recommendedInv.length > 0 && (
                <optgroup label="Önerilen (güce uygun)">
                  {recommendedInv.map((i) => <option key={`r${i.slug}`} value={i.slug}>{i.name}{i.price ? ` · ${tl(i.price)}` : ""}</option>)}
                </optgroup>
              )}
              <optgroup label="Tümü">
                {inverters.map((i) => <option key={i.slug} value={i.slug}>{i.name}{i.price ? ` · ${tl(i.price)}` : ""}</option>)}
              </optgroup>
            </select>
            {p.inverter && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <NumInput label="Adet" value={p.inverter.adet} onChange={(v) => update({ inverter: { ...p.inverter!, adet: Math.max(1, Math.round(v)) } })} />
                <div className={`rounded-lg p-3 text-[13px] ${n.dcAcRatio && (n.dcAcRatio > 1.3 || n.dcAcRatio < 0.85) ? "bg-red-500/10 text-red-700" : "bg-volt/10 text-ink"}`}>
                  DC/AC oranı <b>{n.dcAcRatio ? num(n.dcAcRatio, 2) : "—"}</b>
                  <br />
                  {n.dcAcRatio && n.dcAcRatio > 1.3 ? "İnvertör küçük kalıyor." : n.dcAcRatio && n.dcAcRatio < 0.85 ? "İnvertör gereğinden büyük." : "Uygun."}
                </div>
              </div>
            )}
            {p.abone === "mesken" && n.acKw > 25 && <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-[13px] text-red-700">Mesken aboneliklerinde AC güç en fazla 25 kW olabilir.</p>}
          </section>

          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <h3 className="font-semibold">Üretim ve tasarruf</h3>
            <dl className="mt-3 space-y-1.5 text-[13.5px]">
              <Row k="Yıllık üretim" v={`${num(n.annualProduction)} kWh`} />
              <Row k="Özgül üretim" v={`${num(n.specificYield)} kWh/kWp`} />
              <Row k="Yıllık tüketim" v={n.annualKwh ? `${num(n.annualKwh)} kWh` : "Fatura girilmedi"} />
              <Row k="Tüketimi karşılama" v={n.annualKwh ? `%${num(n.coveragePct)}` : "—"} />
              <Row k="Yıllık tasarruf" v={n.annualKwh ? tl(n.annualSavingTl) : "—"} />
            </dl>
            <table className="mt-4 w-full text-[12.5px]">
              <thead className="text-slate"><tr className="border-b border-line text-left"><th className="py-1 font-medium">Yüzey</th><th className="font-medium">Yön / eğim</th><th className="text-right font-medium">kWp</th><th className="text-right font-medium">kWh/yıl</th></tr></thead>
              <tbody>
                {n.byFace.map((f) => {
                  const face = p.faces.find((x) => x.id === f.faceId)!;
                  return (
                    <tr key={f.faceId} className="border-b border-line">
                      <td className="py-1">{f.name}</td>
                      <td>{YON_ADI(face.azimuth)} · {isFlat(face) ? `sehpa ${face.mountTilt}°` : `${face.pitch}°`}</td>
                      <td className="text-right">{num(f.kwp, 2)}</td>
                      <td className="text-right">{f.count && !p.yields[f.faceId] ? "…" : num(f.annualKwh)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* 4. Fiyat ve koşullar */}
      {tab === 3 && (
        <div className="mt-5 space-y-5">
          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Fiyat kalemleri</h3>
              <div className="flex gap-2">
                <Btn icon={<Sparkles size={14} />} onClick={buildLines}>Tasarımdan oluştur</Btn>
                <Btn icon={<Plus size={14} />} onClick={() => update({ lines: [...p.lines, { id: uid(), ad: "Yeni kalem", adet: 1, birim: "adet", birimFiyat: 0 }] })}>Kalem ekle</Btn>
              </div>
            </div>
            <p className="mt-1 text-[12.5px] text-slate">“Tasarımdan oluştur” panel ve invertörü mağaza fiyatıyla ekler; montaj kalemini mağazadaki anahtar teslim paket fiyatına göre önerir. Tüm tutarları kontrol edip düzenleyin.</p>
            <div className="mt-3 space-y-2">
              {p.lines.map((l) => (
                <div key={l.id} className="grid grid-cols-[1fr_70px_70px_120px_110px_32px] items-center gap-2 text-[13px]">
                  <input value={l.ad} onChange={(e) => patchLine(l.id, { ad: e.target.value })} className="rounded-lg border border-line bg-paper px-2 py-1.5" />
                  <input type="number" value={l.adet} onChange={(e) => patchLine(l.id, { adet: Number(e.target.value) })} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-right" />
                  <input value={l.birim} onChange={(e) => patchLine(l.id, { birim: e.target.value })} className="rounded-lg border border-line bg-paper px-2 py-1.5" />
                  <input type="number" value={l.birimFiyat} onChange={(e) => patchLine(l.id, { birimFiyat: Number(e.target.value) })} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-right" />
                  <span className="text-right font-mono-data">{tl(l.adet * l.birimFiyat)}</span>
                  <button onClick={() => update({ lines: p.lines.filter((x) => x.id !== l.id) })} className="text-slate hover:text-red-600" aria-label="Kalemi sil"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
              <div className="flex flex-wrap items-end gap-4">
                <NumInput label="İndirim (TL)" value={p.discountTl} onChange={(v) => update({ discountTl: Math.max(0, v) })} />
                <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={p.pricesIncludeVat} onChange={(e) => update({ pricesIncludeVat: e.target.checked })} /> Fiyatlar KDV dahil</label>
                <NumInput label="Geçerlilik (gün)" value={p.validDays} onChange={(v) => update({ validDays: Math.max(1, Math.round(v)) })} />
              </div>
              <div className="text-right">
                <p className="text-[12.5px] text-slate">Genel toplam (KDV dahil)</p>
                <p className="font-display text-2xl font-semibold">{tl(n.total)}</p>
                {n.paybackYears != null && <p className="text-[12.5px] text-slate">Geri ödeme {num(n.paybackYears, 1)} yıl</p>}
              </div>
            </div>
          </section>
          <section className="grid gap-4 lg:grid-cols-3">
            <Area label="Ödeme koşulları" value={p.paymentTerms} onChange={(v) => update({ paymentTerms: v })} />
            <Area label="Teklif kapsamı" value={p.scopeNotes} onChange={(v) => update({ scopeNotes: v })} />
            <Area label="Garanti" value={p.warrantyNotes} onChange={(v) => update({ warrantyNotes: v })} />
          </section>
          <label className="block max-w-xs">
            <span className="text-[12.5px] font-semibold text-slate">Teklif durumu</span>
            <select value={p.status} onChange={(e) => update({ status: e.target.value as Proposal["status"] })} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2">
              {["Taslak", "Gönderildi", "Kabul edildi", "Reddedildi"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
      )}

      {/* 5. Önizleme ve PDF */}
      {tab === 4 && (
        <div className="mt-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Btn icon={<Printer size={15} />} onClick={print} primary>PDF olarak kaydet / yazdır</Btn>
            <Btn icon={<Box size={15} />} onClick={captureImages}>3B görselleri yenile</Btn>
            <p className="text-[12.5px] text-slate">Yazdırma penceresinde hedef olarak “PDF olarak kaydet”i, kâğıt boyutu A4 ve “Arka plan grafikleri” seçeneğini işaretleyin.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl bg-ink/5 py-6">
            <ProposalDocument p={{ ...p, cells }} n={n} company={company} />
          </div>
        </div>
      )}
    </div>
  );
}

function Btn({ children, icon, onClick, primary }: { children: React.ReactNode; icon?: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold ${primary ? "bg-brand text-paper hover:bg-brand-deep" : "border border-line bg-paper-raised text-ink hover:border-ink"}`}>
      {icon}
      {children}
    </button>
  );
}

function Seg({ children, icon, on, onClick }: { children: React.ReactNode; icon: React.ReactNode; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${on ? "bg-ink text-paper" : "border border-line text-slate hover:text-ink"}`}>
      {icon}
      {children}
    </button>
  );
}

function Field({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[12.5px] font-semibold text-slate">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2 outline-none focus:border-brand" />
    </label>
  );
}

function NumInput({ label, value, onChange, step = 1, note, small }: { label: string; value: number; onChange: (v: number) => void; step?: number; note?: string; small?: boolean }) {
  return (
    <label className="block">
      <span className={`${small ? "text-[11.5px]" : "text-[12.5px]"} font-semibold text-slate`}>{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`mt-0.5 w-full rounded-lg border border-line bg-paper px-2 ${small ? "py-1.5 text-[13px]" : "py-2"} outline-none focus:border-brand`}
      />
      {note && <span className="text-[11px] text-slate">{note}</span>}
    </label>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-slate">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={6} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-[13px] outline-none focus:border-brand" />
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate">{k}</dt>
      <dd className="font-mono-data font-semibold">{v}</dd>
    </div>
  );
}
