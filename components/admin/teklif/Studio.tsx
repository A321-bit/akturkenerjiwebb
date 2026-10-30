"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Box, FilePlus2, FolderOpen, Grid3x3, Map as MapIcon, MousePointer2, PenLine, Plus, Printer, RotateCcw, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { ABONE_ADLARI, type AboneGrubu } from "@/lib/elektrik-tarife";
import { YON_ADI, autoFill, cellAt, cellFits, faceFrame, guessAzimuth, isFlat, pointInFace, polygonArea, toXY, type LatLon, type LayoutSettings, type PanelModel, type RoofFace, type XY } from "@/lib/teklif/geometry";
import { DEFAULT_TERMS, computeNumbers, newProposalNo, type BatteryChoice, type InverterChoice, type PriceLine, type Proposal, type QuoteOption } from "@/lib/teklif/proposal";
import { CATI_ADI, DEFAULT_SETTINGS, buildQuoteLines, pickRecipe, quoteChecks, recipeLines, salePrice, similarProduction, targetKwp, type QuoteSettings, type Recipe, type RoofKind } from "@/lib/teklif/pricing";
import { pickHybridSet, pickOnGridInverter, type Accessory } from "@/lib/teklif/autoselect";
import { suggestBattery } from "@/lib/teklif/simulate";
import { shadeLosses } from "@/lib/teklif/shading";
import CustomerPlace from "./CustomerPlace";
import PricingRules from "./PricingRules";
import StringDesign from "./StringDesign";
import ProposalDocument, { type Company } from "./ProposalDocument";
import EnergyFlow from "./EnergyFlow";
import LocateBar from "./LocateBar";
import type { Parcel } from "@/lib/teklif/locate";
import type { EditorMode } from "./SatelliteEditor";
import type { Roof3DHandle } from "./Roof3D";

// Teklif Stüdyosu: müşteri → çatı tasarımı (uydu + 3B) → sistem ve üretim → fiyat → PDF.

const SatelliteEditor = dynamic(() => import("./SatelliteEditor"), { ssr: false, loading: () => <div className="h-[560px] animate-pulse rounded-2xl bg-ink/5" /> });
const Roof3D = dynamic(() => import("./Roof3D"), { ssr: false });

type Product = { name: string; kw: number; price?: number; slug?: string; hybrid?: boolean; costUsd?: number; marginPct?: number };
type Props = {
  panels: (PanelModel & { slug?: string })[];
  inverters: Product[];
  batteries: Omit<BatteryChoice, "adet">[];
  accessories: Accessory[];
  recipes: Recipe[];
  hideCost?: boolean;
  canEditRules?: boolean;
  packages: { kw: number; price: number }[];
  company: Company;
  initialCalcId?: number;
  initialId?: number;
  initialCustomerId?: number;
};

const DRAFT_KEY = "aktrk_teklif_taslak";
const ANKARA: LatLon = [39.925, 32.837];
const TABS = ["Müşteri", "Çatı tasarımı", "Sistem ve üretim", "Fiyat ve koşullar", "Önizleme ve PDF", "Fiyat kuralları"] as const;
const tl = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} TL`;
const usd = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} $`;
const num = (n: number, d = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: d });
const uid = () => Math.random().toString(36).slice(2, 9);
// Türkiye numarası wa.me biçimine çevrilir.
const customerWa = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("90") ? d : d.startsWith("0") ? `9${d}` : `90${d}`;
};

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
    pricesIncludeVat: false,
    discountTl: 0,
    priceCurrency: "USD",
    priceMode: "malzeme",
    roofType: "kiremit",
    showLinePrices: false,
    showTl: false,
    hikeTable: DEFAULT_SETTINGS.hikeTable,
    reportType: "optimal",
    consumptionMode: "fatura",
    oversizePct: DEFAULT_SETTINGS.oversizePct,
    paymentPlan: DEFAULT_SETTINGS.paymentPlan,
    paymentTerms: DEFAULT_TERMS.payment,
    scopeNotes: DEFAULT_TERMS.scope,
    warrantyNotes: DEFAULT_TERMS.warranty,
  };
}

export default function Studio({ panels, inverters, batteries, accessories, recipes, hideCost, canEditRules, company, initialCalcId, initialId, initialCustomerId }: Props) {
  const defaultPanel = panels.find((p) => p.wp === 620) ?? panels[0] ?? { name: "620 Wp TOPCon panel", wp: 620, lengthM: 2.382, widthM: 1.134 };
  const [p, setP] = useState<Proposal>(() => blank(defaultPanel));
  const [tab, setTab] = useState(0);
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [mode, setMode] = useState<EditorMode>("sec");
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ center: LatLon; zoom: number; key: number } | null>(null);
  const [list, setList] = useState<{ id: number; proposal_no: string; customer_name: string | null; total: number | null; updated_at: string; views: number | null; last_view_at: string | null }[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<QuoteSettings>(DEFAULT_SETTINGS);
  const [kurMsg, setKurMsg] = useState<string | null>(null);
  const [batteryChoice, setBatteryMode] = useState(false);
  const [phoneOwner, setPhoneOwner] = useState<{ id: number; full_name: string } | null>(null);
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
  const shadeLoss = useMemo(() => shadeLosses(frames, cells, layout, p.obstacles ?? [], p.site.center, p.site.center[0]), [frames, cells, layout, p.obstacles, p.site.center]);
  const n = useMemo(() => computeNumbers({ ...p, cells, shadeLoss }), [p, cells, shadeLoss]);
  const [drawKind, setDrawKind] = useState<"yuzey" | "engel">("yuzey");
  const [videoPct, setVideoPct] = useState<number | null>(null);
  const sel = p.faces.find((f) => f.id === selected) ?? null;

  // Fiyat kuralları ve günün kuru (kayıtlı kur varsa korunur).
  useEffect(() => {
    fetch("/api/admin/quote-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSettings({ ...DEFAULT_SETTINGS, ...d }))
      .catch(() => {});
  }, []);
  async function fetchKur() {
    setKurMsg("Kur alınıyor…");
    const r = await fetch("/api/admin/store/usd-rate");
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      update({ usdTry: d.rate, usdDate: d.date });
      setKurMsg(`TCMB ${d.date}: ${d.rate}`);
    } else setKurMsg(d.error ?? "Kur alınamadı.");
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kur yoksa açılışta bir kez alınır
    if (loaded && p.priceCurrency === "USD" && !p.usdTry) fetchKur();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız açılışta
  }, [loaded]);

  // Açılış: kayıtlı teklif, hesaplama talebinden ön doldurma ya da tarayıcıdaki taslak.
  useEffect(() => {
    (async () => {
      try {
        if (initialId) {
          const r = await fetch(`/api/admin/proposals/${initialId}`);
          if (r.ok) setP(await r.json());
        } else if (initialCustomerId) {
          // Müşteri kartından yeni teklif: bilgiler karttan gelir.
          const r = await fetch(`/api/admin/customers/${initialCustomerId}`);
          if (r.ok) {
            const { customer: c } = await r.json();
            const base = blank(defaultPanel);
            setP({ ...base, customer: { name: c.full_name ?? "", phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", province: c.province ?? "", district: c.district ?? "", mahalle: c.mahalle ?? "", ada: c.ada ?? "", parsel: c.parsel ?? "" } });
          }
        } else if (initialCalcId) {
          const r = await fetch("/api/admin/calculations");
          const rows = r.ok ? await r.json() : [];
          const c = rows.find((x: { id: number }) => x.id === initialCalcId);
          if (c) {
            const base = blank(defaultPanel);
            // Müşteri çatısını çizdiyse ilk yüzey olarak gelir.
            const drawn = c.inputs?.roofPolygon as LatLon[] | undefined;
            const center: LatLon = c.lat && c.lng ? [c.lat, c.lng] : ANKARA;
            const faces: RoofFace[] = drawn?.length
              ? [{ id: uid(), name: "Müşterinin çizdiği çatı", points: drawn, pitch: 25, azimuth: guessAzimuth(drawn, center), eaveHeight: 6, mountTilt: 20, orientation: "dikey", offsetU: 0, offsetV: 0 }]
              : [];
            setP({
              ...base,
              faces,
              calcId: c.id,
              customer: { ...base.customer, name: c.fullname ?? "", phone: c.phone ?? "", email: c.email ?? "", province: c.province ?? "" },
              abone: (c.inputs?.tariff as AboneGrubu) ?? "mesken",
              monthlyBillTl: Math.round(c.monthlyBillTl ?? 0),
              evKm: c.inputs?.evMonthlyKwh ? Math.round((c.inputs.evMonthlyKwh * 12 * 100) / 18) : undefined,
              site: { center, zoom: c.lat ? 20 : 18 },
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
    if (drawKind === "engel") {
      setP((x) => ({ ...x, obstacles: [...(x.obstacles ?? []), { id: uid(), name: `Engel ${(x.obstacles?.length ?? 0) + 1}`, points, height: 8 }] }));
      setDrawKind("yuzey");
      setMode("sec");
      return;
    }
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
  // Çatı bulma: henüz yüzey çizilmediyse tasarım merkezi de yeni konuma alınır (3B uydu zemini için).
  function locate(center: LatLon, zoom: number) {
    setFocus({ center, zoom, key: Date.now() });
    setP((x) => (x.faces.length ? x : { ...x, site: { ...x.site, center, zoom } }));
  }
  function foundParcel(c: Parcel | null) {
    setP((x) => ({
      ...x,
      parcelRing: c?.ring ?? null,
      customer: c ? { ...x.customer, province: x.customer.province || c.il, mahalle: c.mahalle, ada: c.ada, parsel: c.parsel } : x.customer,
    }));
  }
  const patchFace = (id: string, patch: Partial<RoofFace>) => setP((x) => ({ ...x, faces: x.faces.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  function fill(id: string) {
    const fr = frames.find((f) => f.face.id === id);
    if (!fr) return;
    setP((x) => {
      const others = x.cells.filter((c) => c.faceId !== id);
      // Maksimum raporda çatı tamamen dolar; optimalde hedef sözleşme gücü, yoksa yıllık tüketim.
      const byUse = n.annualKwh > 0 ? n.annualKwh / (n.specificYield || 1450) : 0;
      const target = x.reportType === "maksimum" ? 0 : targetKwp(x.contractKw ?? 0, x.oversizePct ?? settings.oversizePct) || byUse;
      const room = target > 0 ? Math.max(0, Math.ceil((target * 1000) / x.panel.wp) - others.length) : Infinity;
      return { ...x, cells: [...others, ...autoFill(fr, layout).slice(0, room)] };
    });
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
  // Güce göre ürün seçimi: bataryasızda on grid invertör, bataryalıda hibrit invertör + uyumlu batarya.
  function autoPick() {
    const contract = p.contractKw ?? 0;
    if (batteryMode) {
      const wanted = p.batteryKwh || (n.annualKwh ? suggestBattery(n.monthlyKwh, p.abone) : 0);
      const set = pickHybridSet(inverters, batteries, accessories, n.dcKwp, contract, wanted);
      if (!set) {
        setMsg("Bu güç için hazır hibrit eşleşmesi yok; invertör ve bataryayı elle seçin.");
        return { inverter: p.inverter, battery: p.battery };
      }
      setMsg(null);
      return set;
    }
    const inverter = pickOnGridInverter(inverters, n.dcKwp, contract);
    if (!inverter) setMsg("Uygun invertör bulunamadı; elle seçin.");
    return { inverter: inverter ?? p.inverter, battery: null };
  }
  function applyAutoPick() {
    const { inverter, battery } = autoPick();
    update({ inverter, battery, batteryKwh: battery ? battery.kwh * battery.adet : 0 });
  }
  function buildLines() {
    // Off grid ve sulama: seçili paket, yoksa panel sayısına en yakın paketin reçetesi.
    if ((p.systemType ?? "ongrid") !== "ongrid") {
      const kind = p.systemType as Recipe["kind"];
      const r = recipes.find((x) => x.slug === p.recipeSlug && x.kind === kind) ?? pickRecipe(recipes, kind, n.panelCount);
      if (!r) return setMsg("Bu tip için reçetesi olan paket bulunamadı.");
      update({ recipeSlug: r.slug, recipeName: r.name, lines: recipeLines(r, settings.defaultMarginPct, uid), inverter: null, battery: null, batteryKwh: 0, priceCurrency: "USD", priceMode: p.priceMode ?? "malzeme", pricesIncludeVat: p.priceCurrency === "USD" ? p.pricesIncludeVat : false, paymentPlan: p.paymentPlan ?? settings.paymentPlan, hikeTable: p.hikeTable ?? settings.hikeTable });
      if (!p.usdTry) fetchKur();
      return;
    }
    // Ürün seçilmemişse sistem kendisi atar; elle seçilen ürün korunur.
    const picked = p.inverter ? { inverter: p.inverter, battery: p.battery ?? null } : autoPick();
    update({
      inverter: picked.inverter,
      battery: picked.battery,
      batteryKwh: picked.battery ? picked.battery.kwh * picked.battery.adet : 0,
      // Maliyetler teklifte eski kalmış olabilir; güncel mağaza verisi esas alınır.
      lines: buildQuoteLines({
        kwp: n.dcKwp,
        panelCount: n.panelCount,
        roof: p.roofType ?? "kiremit",
        panel: panels.find((x) => x.slug && x.slug === p.panel.slug) ?? p.panel,
        inverter: picked.inverter ? { ...picked.inverter, ...inverters.find((x) => x.slug === picked.inverter!.slug), adet: picked.inverter.adet } : null,
        battery: picked.battery ? { ...picked.battery, ...batteries.find((x) => x.slug === picked.battery!.slug), adet: picked.battery.adet } : null,
        settings,
        uid,
      }),
      priceCurrency: "USD",
      paymentPlan: p.paymentPlan ?? settings.paymentPlan,
      hikeTable: p.hikeTable ?? settings.hikeTable,
      extraInverters: [],
      priceMode: p.priceMode ?? "malzeme",
      pricesIncludeVat: p.priceCurrency === "USD" ? p.pricesIncludeVat : false,
    });
    if (!p.usdTry) fetchKur();
  }
  const patchLine = (id: string, patch: Partial<PriceLine>) => update({ lines: p.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  // Ürün seçimi ve fiyat kalemi birlikte güncellenir; teklif belgesi ikisinden de okur.
  const productLine = (l: PriceLine, it: { name: string; costUsd?: number; marginPct?: number }, adet: number): PriceLine => {
    const marjPct = it.marginPct ?? settings.defaultMarginPct;
    return { ...l, ad: it.name, adet, maliyetUsd: it.costUsd ?? 0, marjPct, birimFiyat: salePrice(it.costUsd ?? 0, marjPct) };
  };
  function setInverter(slug: string) {
    const inv = inverters.find((x) => x.slug === slug);
    const adet = p.inverter?.adet ?? 1;
    update({
      inverter: inv ? ({ ...inv, adet } as InverterChoice) : null,
      lines: inv ? p.lines.map((l) => (l.kind === "inverter" ? productLine(l, inv, adet) : l)) : p.lines,
    });
  }
  function addExtraInverter() {
    const inv = invOptions[0];
    if (!inv) return;
    const id = uid();
    const marjPct = inv.marginPct ?? settings.defaultMarginPct;
    update({
      extraInverters: [...(p.extraInverters ?? []), { ...inv, id, adet: 1 }],
      lines: [...p.lines, { id, ad: inv.name, adet: 1, birim: "adet", maliyetUsd: inv.costUsd ?? 0, marjPct, birimFiyat: salePrice(inv.costUsd ?? 0, marjPct), kind: "inverter2" }],
    });
  }
  function setExtraInverter(id: string, slug: string) {
    const inv = inverters.find((x) => x.slug === slug);
    if (!inv) return;
    update({
      extraInverters: (p.extraInverters ?? []).map((x) => (x.id === id ? { ...inv, id, adet: x.adet } : x)),
      lines: p.lines.map((l) => (l.id === id ? productLine(l, inv, l.adet) : l)),
    });
  }
  function setBattery(slug: string) {
    const b = batteries.find((x) => x.slug === slug);
    const adet = p.battery?.adet ?? 1;
    update({
      // Başka batarya seçilince önceki setin BMS'i geçerli olmayabilir; kalem olarak listede kalır, kontrol edilir.
      battery: b ? { ...b, adet, extras: p.battery?.extras } : null,
      batteryKwh: b ? b.kwh * adet : 0,
      lines: b ? p.lines.map((l) => (l.kind === "battery" ? productLine(l, b, adet) : l)) : p.lines,
    });
  }
  // Kalemdeki adet, sistem seçimiyle aynı kalır (kWp, DC/AC ve batarya hesabı için).
  function setLineQty(l: PriceLine, adet: number) {
    update({
      lines: p.lines.map((x) => (x.id === l.id ? { ...x, adet } : x)),
      ...(l.kind === "inverter" && p.inverter ? { inverter: { ...p.inverter, adet: Math.max(1, Math.round(adet)) } } : {}),
      ...(l.kind === "inverter2" ? { extraInverters: (p.extraInverters ?? []).map((x) => (x.id === l.id ? { ...x, adet: Math.max(1, Math.round(adet)) } : x)) } : {}),
      ...(l.kind === "battery" && p.battery ? { battery: { ...p.battery, adet: Math.max(1, Math.round(adet)) }, batteryKwh: p.battery.kwh * Math.max(1, Math.round(adet)) } : {}),
    });
  }
  // Karşılaştırma: ekonomik (en uygun panel ve invertör), önerilen (ekrandaki hâl), bataryalı (hibrit set).
  function buildOptions(): QuoteOption[] {
    const base: Proposal = { ...p, cells, shadeLoss };
    const summary = (key: string, ad: string, x: Proposal): QuoteOption => {
      const m = computeNumbers(x);
      return { key, ad, panel: x.panel.name, inverter: x.inverter ? `${x.inverter.adet} × ${x.inverter.name}` : "", battery: x.battery?.name, batteryKwh: x.battery ? x.battery.kwh * x.battery.adet : undefined, kwp: m.dcKwp, total: m.total, annualKwh: m.annualProduction, savingTl: m.annualSavingTl, paybackYears: m.paybackYears };
    };
    const variant = (over: Pick<Proposal, "panel" | "inverter" | "battery">): Proposal => ({
      ...base,
      ...over,
      priceMode: "malzeme",
      extraInverters: [],
      batteryKwh: over.battery ? over.battery.kwh * over.battery.adet : 0,
      lines: buildQuoteLines({ kwp: (cells.length * over.panel.wp) / 1000, panelCount: cells.length, roof: p.roofType ?? "kiremit", panel: over.panel, inverter: over.inverter, battery: over.battery, settings, uid }),
    });
    const out: QuoteOption[] = [];
    const cheapPanel = [...panels].filter((x) => x.costUsd && x.wp >= p.panel.wp - 10).sort((a, b) => a.costUsd! - b.costUsd!)[0] ?? p.panel;
    const sameKw = p.inverter ? inverters.filter((i) => !i.hybrid && i.costUsd && i.kw === p.inverter!.kw).sort((a, b) => a.costUsd! - b.costUsd!)[0] : undefined;
    const ecoInv = sameKw ? { ...sameKw, adet: p.inverter!.adet } : pickOnGridInverter(inverters, n.dcKwp, p.contractKw ?? 0);
    out.push(summary("ekonomik", "Ekonomik", variant({ panel: cheapPanel, inverter: ecoInv, battery: null })));
    out.push(summary("onerilen", "Önerilen", base));
    const set = pickHybridSet(inverters, batteries, accessories, n.dcKwp, p.contractKw ?? 0, n.annualKwh ? suggestBattery(n.monthlyKwh, p.abone) : 0);
    if (set) out.push(summary("bataryali", "Bataryalı", variant({ panel: p.panel, inverter: set.inverter, battery: set.battery })));
    return out;
  }
  // Son onay: ekrandaki hâliyle görseller alınır, kaydedilir ve teklif belgesi açılır.
  async function createProposal() {
    const images = captureImages();
    // Müşteri linki ilk oluşturmada üretilir, sonraki güncellemelerde aynı kalır.
    const shareToken = p.shareToken ?? crypto.randomUUID().replace(/-/g, "");
    await save({ shareToken, images: images ?? p.images, options: p.optionMode === "uc" ? buildOptions() : undefined, realRef: similarProduction(settings.realProduction, n.dcKwp) });
    setTab(4);
  }

  // --- Kaydet / aç / yazdır ---
  function captureImages() {
    const perspective = r3d.current?.snapshot("perspective") ?? undefined;
    const top = r3d.current?.snapshot("top") ?? undefined;
    const images = perspective || top ? { perspective, top } : undefined;
    if (images) update({ images });
    return images;
  }
  async function save(extra?: Partial<Proposal>) {
    setMsg("Kaydediliyor…");
    const r = await fetch("/api/admin/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proposal: { ...p, ...extra, cells, shadeLoss }, dcKwp: n.dcKwp, total: n.total }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      update({ ...extra, id: d.id });
      setMsg("Kaydedildi.");
    } else setMsg(/proposals/.test(d.error ?? "") ? "Veritabanında teklif tablosu henüz yok (supabase/proposals.sql çalıştırılmalı). Taslak bu tarayıcıda saklanıyor." : `Kaydedilemedi: ${d.error ?? r.status}`);
    return r.ok;
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
  // Müşteri videosu tarayıcıda üretilir ve bilgisayara kaydedilir; personel WhatsApp'tan gönderir.
  async function makeVideo() {
    setVideoPct(0);
    const res = await r3d.current?.record({
      title: p.customer.name ? `Sayın ${p.customer.name}` : "Güneş enerjisi sisteminiz",
      lines: [`${num(n.dcKwp, 2)} kWp · ${n.panelCount} panel`, n.annualProduction ? `Yılda yaklaşık ${num(n.annualProduction)} kWh` : ""].filter(Boolean),
      footer: `${company.phone} · ${company.web}`,
      onProgress: setVideoPct,
    });
    setVideoPct(null);
    if (!res) return setMsg("Bu tarayıcı video üretmeyi desteklemiyor.");
    const url = URL.createObjectURL(res.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.proposalNo}-tasarim.${res.ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    setMsg(res.ext === "webm" ? "Video kaydedildi (WebM). WhatsApp için MP4 üreten güncel Chrome önerilir." : "Video kaydedildi.");
  }
  async function checkPhone() {
    if (p.customer.phone.replace(/\D/g, "").length < 10) return setPhoneOwner(null);
    const r = await fetch(`/api/admin/customers?phone=${encodeURIComponent(p.customer.phone)}`);
    const d = r.ok ? await r.json() : [];
    setPhoneOwner(d[0] ?? null);
  }
  function goTab(i: number) {
    if (i === 4) captureImages();
    // Son onay ekranı ilk açılışta tasarımdan dolu gelir; sonrasında elle yapılanlar korunur.
    if (i === 3 && !p.lines.length && n.panelCount > 0) buildLines();
    setTab(i);
  }
  function print() {
    captureImages();
    setTimeout(() => window.print(), 300);
  }

  const checks = quoteChecks({ ...p, cells }, n, hideCost ? -Infinity : settings.minMarginPct);
  const errorCount = checks.filter((c) => c.level === "hata").length;
  const costTotal = p.lines.reduce((a, l) => a + l.adet * (l.maliyetUsd ?? 0), 0);
  const netSale = Math.max(0, n.subtotal - p.discountTl);
  const marginPct = costTotal > 0 ? ((netSale - costTotal) / costTotal) * 100 : 0;
  const lineCols = hideCost ? "1fr 70px 60px 90px 90px 28px" : "1fr 70px 60px 90px 70px 90px 90px 28px";
  const panelCountOf = (id: string) => cells.filter((c) => c.faceId === id).length;
  const withBattery = Boolean(p.battery);
  const batteryMode = batteryChoice || withBattery;
  const invOptions = inverters.filter((i) => (batteryMode ? i.hybrid : !i.hybrid));
  const recommendedInv = invOptions.filter((i) => i.kw >= n.dcKwp / 1.3 && i.kw <= n.dcKwp / 0.85);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Satış</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Teklif Stüdyosu</h1>
          <p className="text-[13px] text-slate">
            {p.proposalNo} · {p.customer.name || "müşteri girilmedi"} · {n.panelCount} panel · {num(n.dcKwp, 2)} kWp{n.total ? ` · ${p.priceCurrency === "USD" ? usd(n.total) : tl(n.total)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn icon={<FilePlus2 size={15} />} onClick={startNew}>Yeni</Btn>
          <Btn icon={<FolderOpen size={15} />} onClick={openList}>Teklifler</Btn>
          <Btn icon={<Save size={15} />} onClick={() => save()} primary>Kaydet</Btn>
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
                <span className="text-slate">{x.views ? <b className="text-volt">{x.views} kez açıldı · </b> : null}{new Date(x.updated_at).toLocaleDateString("tr-TR")}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="mt-5 flex flex-wrap gap-1 border-b border-line">
        {TABS.filter((t) => canEditRules || t !== "Fiyat kuralları").map((t, i) => (
          <button key={t} onClick={() => goTab(i)} className={`-mb-px border-b-2 px-3.5 py-2 text-[13.5px] font-semibold ${tab === i ? "border-brand text-ink" : "border-transparent text-slate hover:text-ink"}`}>
            {i + 1}. {t}
          </button>
        ))}
      </nav>

      {/* 1. Müşteri */}
      {tab === 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Ad soyad *" value={p.customer.name} onChange={(v) => update({ customer: { ...p.customer, name: v } })} />
          <div>
            <Field label="Telefon *" value={p.customer.phone} onChange={(v) => update({ customer: { ...p.customer, phone: v } })} onBlur={checkPhone} />
            {phoneOwner && <p className="mt-1 text-[12.5px]">Bu numara kayıtlı: <a href={`/admin/musteriler/${phoneOwner.id}`} className="font-semibold text-brand underline">{phoneOwner.full_name}</a>. Teklif bu müşterinin kartına eklenir.</p>}
          </div>
          <Field label="E-posta" value={p.customer.email} onChange={(v) => update({ customer: { ...p.customer, email: v } })} />
          <CustomerPlace province={p.customer.province} district={p.customer.district ?? ""} onChange={(x) => update({ customer: { ...p.customer, ...x } })} />
          <Field label="Adres" value={p.customer.address} onChange={(v) => update({ customer: { ...p.customer, address: v } })} className="sm:col-span-2" />
          <Field label="Mahalle" value={p.customer.mahalle ?? ""} onChange={(v) => update({ customer: { ...p.customer, mahalle: v } })} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ada" value={p.customer.ada ?? ""} onChange={(v) => update({ customer: { ...p.customer, ada: v } })} />
            <Field label="Parsel" value={p.customer.parsel ?? ""} onChange={(v) => update({ customer: { ...p.customer, parsel: v } })} />
          </div>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-slate">Abonelik</span>
            <select value={p.abone} onChange={(e) => update({ abone: e.target.value as AboneGrubu })} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2">
              {(Object.keys(ABONE_ADLARI) as AboneGrubu[]).map((k) => <option key={k} value={k}>{ABONE_ADLARI[k]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-slate">Tüketim bilgisi</span>
            <select value={p.consumptionMode ?? "fatura"} onChange={(e) => update({ consumptionMode: e.target.value as Proposal["consumptionMode"] })} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2">
              <option value="fatura">Aylık fatura tutarı</option>
              <option value="gunluk">Günlük tüketim (kWh)</option>
            </select>
          </label>
          {(p.consumptionMode ?? "fatura") === "fatura" ? (
            <NumInput label="Ortalama aylık fatura (TL)" value={p.monthlyBillTl} onChange={(v) => update({ monthlyBillTl: v })} note="Tasarruf ve geri ödeme buna göre hesaplanır." />
          ) : (
            <NumInput label="Günlük tüketim (kWh)" value={p.dailyKwh ?? 0} onChange={(v) => update({ dailyKwh: Math.max(0, v) })} note={n.monthlyBillTl ? `Tahmini aylık fatura ${tl(n.monthlyBillTl)}` : undefined} />
          )}
          <NumInput label="Elektrikli araç (yıllık km)" value={p.evKm ?? 0} step={1000} onChange={(v) => update({ evKm: Math.max(0, v) })} note="Şarjı faturada yoksa girin; tüketime eklenir. 18 kWh/100 km varsayılır." />
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[12.5px] font-semibold text-slate">Gerilim</span>
              <select value={p.voltage ?? "ag"} onChange={(e) => update({ voltage: e.target.value as Proposal["voltage"] })} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2">
                <option value="ag">Alçak gerilim</option>
                <option value="og">Orta gerilim</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[12.5px] font-semibold text-slate">Terim</span>
              <select value={p.term ?? "tek"} onChange={(e) => update({ term: e.target.value as Proposal["term"] })} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2">
                <option value="tek">Tek terimli</option>
                <option value="cift">Çift terimli</option>
              </select>
            </label>
          </div>
          <NumInput label="Elle birim fiyat (kuruş/kWh, KDV hariç)" value={p.unitKr ?? 0} onChange={(v) => update({ unitKr: Math.max(0, v) })} note="Boş bırakılırsa EPDK tarifesi kullanılır. Perakende + dağıtım toplamı." />
          <label className="block">
            <span className="text-[12.5px] font-semibold text-slate">Rapor tipi</span>
            <select value={p.reportType ?? "optimal"} onChange={(e) => update({ reportType: e.target.value as Proposal["reportType"] })} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2">
              <option value="optimal">Optimal güç (tüketime göre)</option>
              <option value="maksimum">Maksimum güç (çatının tamamı)</option>
            </select>
          </label>
          <NumInput label="Sözleşme gücü (kW)" value={p.contractKw ?? 0} step={0.5} onChange={(v) => update({ contractKw: Math.max(0, v) })} note="Faturadan. Otomatik doldurma hedef güçte durur." />
          <NumInput label="Trafo gücü (kVA, varsa)" value={p.trafoKva ?? 0} onChange={(v) => update({ trafoKva: Math.max(0, v), contractKw: v > 0 ? (v * (p.trafoPct ?? 100)) / 100 : p.contractKw })} note="Trafonun yüzdesine göre sözleşme gücünü doldurur." />
          <NumInput label="Trafo kullanım yüzdesi" value={p.trafoPct ?? 100} onChange={(v) => update({ trafoPct: v, contractKw: p.trafoKva ? (p.trafoKva * v) / 100 : p.contractKw })} />
          <div className="grid grid-cols-2 gap-4">
            <NumInput label="PV fazlası (%)" value={p.oversizePct ?? settings.oversizePct} onChange={(v) => update({ oversizePct: v })} note={p.contractKw ? `Hedef ${num(targetKwp(p.contractKw, p.oversizePct ?? settings.oversizePct), 1)} kWp` : undefined} />
            <label className="block">
              <span className="text-[12.5px] font-semibold text-slate">Çatı tipi</span>
              <select value={p.roofType ?? "kiremit"} onChange={(e) => update({ roofType: e.target.value as RoofKind })} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2">
                {(Object.keys(CATI_ADI) as RoofKind[]).map((k) => <option key={k} value={k}>{CATI_ADI[k]}</option>)}
              </select>
            </label>
          </div>
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
                  <Seg on={mode === "ciz" && drawKind === "yuzey"} onClick={() => { setDrawKind("yuzey"); setMode("ciz"); }} icon={<PenLine size={15} />}>Yüzey çiz</Seg>
                  <Seg on={mode === "ciz" && drawKind === "engel"} onClick={() => { setDrawKind("engel"); setMode("ciz"); }} icon={<Box size={15} />}>Engel çiz</Seg>
                  <Seg on={mode === "panel"} onClick={() => setMode("panel")} icon={<Grid3x3 size={15} />}>Panel yerleştir</Seg>
                </>
              )}
            </div>
            {view === "2d" && <LocateBar onFocus={locate} onParcel={foundParcel} />}
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
                focus={focus}
                parcelRing={p.parcelRing}
                obstacles={p.obstacles}
              />
            )}
            <div className={view === "3d" ? "" : "pointer-events-none fixed -left-[3000px] top-0 h-[560px] w-[1000px]"}>
              <Roof3D ref={r3d} center={p.site.center} frames={frames} cells={cells} layout={layout} lat={p.site.center[0]} obstacles={p.obstacles} />
            </div>
            {view === "3d" && <p className="mt-2 text-[12.5px] text-slate">Fareyle döndürün, tekerlekle yakınlaştırın, sağ tuşla kaydırın. Çatı ve zemin gerçek uydu görüntüsüdür; yükseklikler girilen değerlerdir.</p>}
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

            {(p.obstacles?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-line bg-paper-raised p-4">
                <p className="font-semibold">Gölge yapan engeller</p>
                <div className="mt-2 space-y-1.5">
                  {p.obstacles!.map((o) => (
                    <div key={o.id} className="grid grid-cols-[1fr_72px_22px] items-center gap-2 text-[13px]">
                      <input value={o.name} onChange={(e) => update({ obstacles: p.obstacles!.map((q) => (q.id === o.id ? { ...q, name: e.target.value } : q)) })} className="min-w-0 rounded-lg border border-line bg-paper px-2 py-1" />
                      <input type="number" value={o.height} onChange={(e) => update({ obstacles: p.obstacles!.map((q) => (q.id === o.id ? { ...q, height: Number(e.target.value) } : q)) })} aria-label="Yükseklik (m)" className="rounded-lg border border-line bg-paper px-2 py-1 text-right" />
                      <button onClick={() => update({ obstacles: p.obstacles!.filter((q) => q.id !== o.id) })} className="text-slate hover:text-red-600" aria-label="Engeli sil"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-slate">Yükseklik zeminden metredir. Yıllık gölge kaybı: <b>%{num(n.shadePct, 1)}</b></p>
              </div>
            )}

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
          <section className="rounded-2xl border border-line bg-paper-raised p-5 lg:col-span-2">
            <div className="flex flex-wrap items-end gap-4">
              <label className="block">
                <span className="text-[12.5px] font-semibold text-slate">Sistem tipi</span>
                <select value={p.systemType ?? "ongrid"} onChange={(e) => update({ systemType: e.target.value as Proposal["systemType"], recipeSlug: undefined, recipeName: undefined, lines: [], inverter: null, battery: null, batteryKwh: 0 })} className="mt-1 block rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px]">
                  <option value="ongrid">Şebeke bağlantılı</option>
                  <option value="offgrid">Off grid (şebekesiz)</option>
                  <option value="sulama">Tarımsal sulama</option>
                </select>
              </label>
              {(p.systemType ?? "ongrid") !== "ongrid" && (
                <>
                  <label className="block min-w-[260px] flex-1">
                    <span className="text-[12.5px] font-semibold text-slate">Paket</span>
                    <select
                      value={p.recipeSlug ?? ""}
                      onChange={(e) => {
                        const r = recipes.find((x) => x.slug === e.target.value);
                        update(r ? { recipeSlug: r.slug, recipeName: r.name, lines: recipeLines(r, settings.defaultMarginPct, uid) } : { recipeSlug: undefined, recipeName: undefined });
                      }}
                      className="mt-1 block w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px]"
                    >
                      <option value="">Otomatik: panel sayısına en yakın</option>
                      {recipes.filter((r) => r.kind === p.systemType).map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                    </select>
                  </label>
                  <NumInput label="Mevcut yıllık enerji gideri (TL)" value={p.currentEnergyCostTl ?? 0} onChange={(v) => update({ currentEnergyCostTl: Math.max(0, v) })} note="Mazot, jeneratör vb.; geri ödeme buna göre." />
                </>
              )}
              {p.systemType === "sulama" && (
                <>
                  <NumInput label="Kuyu derinliği (m)" value={p.sulama?.kuyuM ?? 0} onChange={(v) => update({ sulama: { ...p.sulama, kuyuM: v } })} />
                  <label className="block">
                    <span className="text-[12.5px] font-semibold text-slate">Sulama tipi</span>
                    <select value={p.sulama?.tip ?? ""} onChange={(e) => update({ sulama: { ...p.sulama, tip: e.target.value } })} className="mt-1 block rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px]">
                      <option value="">Seçin</option>
                      <option>Yüzey sulama</option>
                      <option>Yağmurlama sulama</option>
                      <option>Damlama sulama</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 pb-2 text-[13px]"><input type="checkbox" checked={Boolean(p.sulama?.pompaDahil)} onChange={(e) => update({ sulama: { ...p.sulama, pompaDahil: e.target.checked } })} /> Pompa teklife dahil</label>
                </>
              )}
            </div>
          </section>
          <div className="lg:col-span-2 lg:order-last">
            <EnergyFlow p={{ ...p, cells }} n={n} onBattery={(v) => update({ batteryKwh: v })} />
          </div>
          {(p.systemType ?? "ongrid") === "ongrid" && <div className="lg:col-span-2">
            <StringDesign
              panelKey={p.panel.slug ?? p.panel.name}
              panelName={p.panel.name}
              inverterKey={p.inverter?.slug}
              inverterName={p.inverter?.name}
              adet={p.inverter?.adet ?? 1}
              faces={n.byFace.map((f) => ({ name: f.name, panels: f.count }))}
              settings={settings}
              onSettings={setSettings}
            />
          </div>}
          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <div className="mb-3 inline-flex rounded-lg border border-line bg-paper p-1 text-[13px] font-semibold">
              <button onClick={() => { setBatteryMode(false); update({ battery: null, batteryKwh: 0, inverter: null }); }} className={`rounded-md px-3 py-1.5 ${!batteryMode ? "bg-ink text-paper" : "text-slate"}`}>Bataryasız</button>
              <button onClick={() => { setBatteryMode(true); update({ inverter: null }); }} className={`rounded-md px-3 py-1.5 ${batteryMode ? "bg-ink text-paper" : "text-slate"}`}>Bataryalı</button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{batteryMode ? "Hibrit invertör" : "İnvertör"}</h3>
              <Btn icon={<Wand2 size={14} />} onClick={applyAutoPick} primary>Otomatik seç</Btn>
            </div>
            <p className="text-[12.5px] text-slate">Panel gücü {num(n.dcKwp, 2)} kWp. Uygun aralık: {num(n.dcKwp / 1.3, 1)}–{num(n.dcKwp / 0.85, 1)} kW AC (DC/AC 0,85–1,30).</p>
            <select
              value={p.inverter?.slug ?? ""}
              onChange={(e) => setInverter(e.target.value)}
              className="mt-3 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px]"
            >
              <option value="">İnvertör seçin</option>
              {recommendedInv.length > 0 && (
                <optgroup label="Önerilen (güce uygun)">
                  {recommendedInv.map((i) => <option key={`r${i.slug}`} value={i.slug}>{i.name}{i.price ? ` · ${tl(i.price)}` : ""}</option>)}
                </optgroup>
              )}
              <optgroup label="Tümü">
                {invOptions.map((i) => <option key={i.slug} value={i.slug}>{i.name}{i.price ? ` · ${tl(i.price)}` : ""}</option>)}
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
            {batteryMode && (
              <div className="mt-4 border-t border-line pt-4">
                <h3 className="font-semibold">Batarya</h3>
                <select
                  value={p.battery?.slug ?? ""}
                  onChange={(e) => setBattery(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px]"
                >
                  <option value="">Batarya seçin</option>
                  {batteries.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                </select>
                {p.battery && (
                  <div className="mt-3 max-w-[140px]">
                    <NumInput label="Adet" value={p.battery.adet} onChange={(v) => { const adet = Math.max(1, Math.round(v)); update({ battery: { ...p.battery!, adet }, batteryKwh: p.battery!.kwh * adet }); }} />
                  </div>
                )}
                {withBattery && !p.inverter?.slug && <p className="mt-2 text-[12.5px] text-red-600">Bataryayla uyumlu bir hibrit invertör seçin.</p>}
              </div>
            )}
            {p.abone === "mesken" && n.acKw > 25 && <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-[13px] text-red-700">Mesken aboneliklerinde AC güç en fazla 25 kW olabilir.</p>}
          </section>

          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <h3 className="font-semibold">Üretim ve tasarruf</h3>
            <dl className="mt-3 space-y-1.5 text-[13.5px]">
              <Row k="Yıllık üretim" v={`${num(n.annualProduction)} kWh`} />
              <Row k="Özgül üretim" v={`${num(n.specificYield)} kWh/kWp`} />
              {n.shadePct > 0.05 && <Row k="Gölge kaybı" v={`%${num(n.shadePct, 1)}`} />}
              {(() => {
                const ref = similarProduction(settings.realProduction, n.dcKwp);
                return ref ? <Row k={`Benzer ${ref.count} kurulumun gerçek ortalaması`} v={`${num(ref.specific)} kWh/kWp`} /> : null;
              })()}
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
          {p.priceCurrency !== "USD" && (
            <p className="rounded-xl bg-sun/15 p-3 text-[13px]">Bu eski bir teklif, tutarları TL. “Tasarımdan oluştur” dersen USD fiyatlamaya geçer.</p>
          )}
          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">Fiyat nasıl hesaplansın?</h3>
              <div className="inline-flex rounded-lg border border-line bg-paper p-1 text-[13px] font-semibold">
                {([["malzeme", "Malzeme + kâr"], ["kwp", "kWp başına"], ["manuel", "Elle toplam"]] as const).map(([k, label]) => (
                  <button key={k} onClick={() => update({ priceMode: k })} className={`rounded-md px-3 py-1.5 ${(p.priceMode ?? "malzeme") === k ? "bg-ink text-paper" : "text-slate"}`}>{label}</button>
                ))}
              </div>
            </div>
            {p.priceMode === "kwp" && <div className="mt-3 max-w-[220px]"><NumInput label="kWp başına tutar (USD, KDV hariç)" value={p.kwpUsd ?? 0} onChange={(v) => update({ kwpUsd: v })} note={`${num(n.dcKwp, 2)} kWp × ${num(p.kwpUsd ?? 0)} $`} /></div>}
            {p.priceMode === "manuel" && <div className="mt-3 max-w-[220px]"><NumInput label="Toplam tutar (USD, KDV hariç)" value={p.manualUsd ?? 0} onChange={(v) => update({ manualUsd: v })} /></div>}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
              <h3 className="font-semibold">Malzeme listesi</h3>
              <div className="flex gap-2">
                <Btn icon={<Sparkles size={14} />} onClick={() => (!p.lines.length || confirm("Liste tasarımdan yeniden oluşturulacak; elle yaptığınız değişiklikler silinir. Devam edilsin mi?")) && buildLines()} primary>Tasarımdan oluştur</Btn>
                <Btn icon={<Plus size={14} />} onClick={addExtraInverter}>İnvertör ekle</Btn>
                <Btn icon={<Plus size={14} />} onClick={() => update({ lines: [...p.lines, { id: uid(), ad: "Yeni kalem", adet: 1, birim: "adet", birimFiyat: 0, maliyetUsd: 0, marjPct: settings.defaultMarginPct }] })}>Kalem ekle</Btn>
              </div>
            </div>
            <p className="mt-1 text-[12.5px] text-slate">Panel, invertör ve batarya mağaza maliyetinden; konstrüksiyon çatı tipine, diğer kalemler kW aralığına göre “Fiyat kuralları” sekmesinden gelir. Her satır değiştirilebilir.</p>
            {p.lines.some((l) => l.kind === "panel" && l.adet !== n.panelCount) && <p className="mt-2 rounded-lg bg-sun/15 p-2.5 text-[12.5px]">Listedeki panel adedi tasarımdakinden farklı (tasarımda {n.panelCount} panel). Bilerek değiştirmediyseniz düzeltin.</p>}
            {p.lines.some((l) => !l.birimFiyat) && <p className="mt-2 rounded-lg bg-red-500/10 p-2.5 text-[12.5px] text-red-700">{p.lines.filter((l) => !l.birimFiyat).length} kalemin fiyatı yok. “Fiyat kuralları” sekmesinden girin ya da satırda düzeltin.</p>}
            <div className="mt-3 overflow-x-auto">
              <div className="min-w-[820px] space-y-2">
                <div style={{ gridTemplateColumns: lineCols }} className="grid gap-2 text-[11.5px] font-semibold text-slate">
                  <span>Kalem</span><span className="text-right">Miktar</span><span>Birim</span>{!hideCost && <><span className="text-right">Maliyet $</span><span className="text-right">Kâr %</span></>}<span className="text-right">Birim $</span><span className="text-right">Tutar $</span><span />
                </div>
                {p.lines.map((l) => (
                  <div key={l.id} style={{ gridTemplateColumns: lineCols }} className="grid items-center gap-2 text-[13px]">
                    {l.kind === "inverter" ? (
                      <select value={p.inverter?.slug ?? ""} onChange={(e) => setInverter(e.target.value)} aria-label="İnvertör" className="min-w-0 rounded-lg border border-brand/50 bg-paper px-2 py-1.5">
                        {invOptions.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
                      </select>
                    ) : l.kind === "inverter2" ? (
                      <select value={p.extraInverters?.find((x) => x.id === l.id)?.slug ?? ""} onChange={(e) => setExtraInverter(l.id, e.target.value)} aria-label="Ek invertör" className="min-w-0 rounded-lg border border-brand/50 bg-paper px-2 py-1.5">
                        {invOptions.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
                      </select>
                    ) : l.kind === "battery" ? (
                      <select value={p.battery?.slug ?? ""} onChange={(e) => setBattery(e.target.value)} aria-label="Batarya" className="min-w-0 rounded-lg border border-brand/50 bg-paper px-2 py-1.5">
                        {batteries.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                      </select>
                    ) : (
                      <input value={l.ad} onChange={(e) => patchLine(l.id, { ad: e.target.value })} className="rounded-lg border border-line bg-paper px-2 py-1.5" />
                    )}
                    <input type="number" value={l.adet} onChange={(e) => setLineQty(l, Number(e.target.value))} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-right" />
                    <input value={l.birim} onChange={(e) => patchLine(l.id, { birim: e.target.value })} className="rounded-lg border border-line bg-paper px-2 py-1.5" />
                    {!hideCost && <input type="number" value={Math.round((l.maliyetUsd ?? 0) * 100) / 100} onChange={(e) => { const c = Number(e.target.value); patchLine(l.id, { maliyetUsd: c, birimFiyat: salePrice(c, l.marjPct ?? 0) }); }} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-right" />}
                    {!hideCost && <input type="number" value={l.marjPct ?? 0} onChange={(e) => { const m = Number(e.target.value); patchLine(l.id, { marjPct: m, birimFiyat: salePrice(l.maliyetUsd ?? 0, m) }); }} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-right" />}
                    <input type="number" value={Math.round(l.birimFiyat * 100) / 100} onChange={(e) => patchLine(l.id, { birimFiyat: Number(e.target.value) })} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-right" />
                    <span className="text-right font-mono-data">{num(l.adet * l.birimFiyat)}</span>
                    <button onClick={() => update({ lines: p.lines.filter((x) => x.id !== l.id), ...(l.kind === "inverter2" ? { extraInverters: (p.extraInverters ?? []).filter((x) => x.id !== l.id) } : {}) })} className="text-slate hover:text-red-600" aria-label="Kalemi sil"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
              <div className="flex flex-wrap items-end gap-4">
                <NumInput label="İndirim (USD)" value={p.discountTl} onChange={(v) => update({ discountTl: Math.max(0, v) })} />
                <NumInput label="Geçerlilik (gün)" value={p.validDays} onChange={(v) => update({ validDays: Math.max(1, Math.round(v)) })} />
                <div>
                  <NumInput label="USD/TL kuru" value={p.usdTry ?? 0} step={0.01} onChange={(v) => update({ usdTry: v })} />
                  <button onClick={fetchKur} className="mt-1 text-[12px] font-semibold text-brand hover:underline">TCMB’den al</button>
                  {kurMsg && <span className="ml-2 text-[11.5px] text-slate">{kurMsg}</span>}
                </div>
                <div className="space-y-1.5 text-[13px]">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={p.pricesIncludeVat} onChange={(e) => update({ pricesIncludeVat: e.target.checked })} /> Fiyatlar KDV dahil</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(p.showTl)} onChange={(e) => update({ showTl: e.target.checked })} /> Teklifte TL fiyat göster</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(p.showLinePrices)} onChange={(e) => update({ showLinePrices: e.target.checked })} /> Teklifte kalem fiyatlarını göster</label>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[12.5px] text-slate">Genel toplam (KDV dahil)</p>
                <p className="font-display text-2xl font-semibold">{p.priceCurrency === "USD" ? usd(n.total) : tl(n.total)}</p>
                {p.priceCurrency === "USD" && <p className="text-[12.5px] text-slate">{p.usdTry ? tl(n.totalTl) : "Kur girilmedi"}</p>}
                {n.paybackYears != null && <p className="text-[12.5px] text-slate">Geri ödeme {num(n.paybackYears, 1)} yıl{n.paybackFlatYears != null ? ` · zamsız ${num(n.paybackFlatYears, 1)} yıl` : ""}</p>}
                {costTotal > 0 && !hideCost && <p className={`mt-1 text-[13px] font-semibold ${marginPct < settings.minMarginPct ? "text-red-600" : "text-volt"}`}>Kâr {usd(netSale - costTotal)} · %{num(marginPct)}</p>}
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-paper-raised p-5">
              <h3 className="font-semibold">Ödeme planı</h3>
              <div className="mt-3 space-y-2">
                {(p.paymentPlan ?? settings.paymentPlan).map((st) => {
                  const plan = p.paymentPlan ?? settings.paymentPlan;
                  const patch = (x: Partial<typeof st>) => update({ paymentPlan: plan.map((q) => (q.id === st.id ? { ...q, ...x } : q)) });
                  return (
                    <div key={st.id} className="grid grid-cols-[1fr_64px_90px_24px] items-center gap-2 text-[13px]">
                      <input value={st.ad} onChange={(e) => patch({ ad: e.target.value })} className="rounded-lg border border-line bg-paper px-2 py-1.5" />
                      <input type="number" value={st.pct} onChange={(e) => patch({ pct: Number(e.target.value) })} aria-label="Yüzde" className="rounded-lg border border-line bg-paper px-2 py-1.5 text-right" />
                      <input value={st.sure} onChange={(e) => patch({ sure: e.target.value })} aria-label="Süre" className="rounded-lg border border-line bg-paper px-2 py-1.5" />
                      <button onClick={() => update({ paymentPlan: plan.filter((q) => q.id !== st.id) })} className="text-slate hover:text-red-600" aria-label="Adımı sil"><Trash2 size={14} /></button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[12.5px]">
                <button onClick={() => update({ paymentPlan: [...(p.paymentPlan ?? settings.paymentPlan), { id: uid(), ad: "Yeni adım", pct: 0, sure: "" }] })} className="font-semibold text-brand hover:underline">+ Adım ekle</button>
                {(() => { const t = (p.paymentPlan ?? settings.paymentPlan).reduce((a, b) => a + b.pct, 0); return <span className={t === 100 ? "text-slate" : "font-semibold text-red-600"}>Toplam %{t}</span>; })()}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-paper-raised p-5">
              <h3 className="font-semibold">Elektrik zammı senaryosu</h3>
              <p className="mt-1 text-[12px] text-slate">Bugüne göre artış (%). 10. yıldan sonra sabit kabul edilir; varsayım belgede yazılır.</p>
              <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-9">
                {(p.hikeTable ?? settings.hikeTable).map((v, i) => (
                  <label key={i} className="block">
                    <span className="text-[10.5px] text-slate">{i + 2}. yıl</span>
                    <input type="number" value={v} onChange={(e) => update({ hikeTable: (p.hikeTable ?? settings.hikeTable).map((x, j) => (j === i ? Number(e.target.value) : x)) })} className="w-full rounded-lg border border-line bg-paper px-1.5 py-1 text-[12.5px]" />
                  </label>
                ))}
              </div>
              <label className="mt-4 block max-w-xs">
                <span className="text-[12.5px] font-semibold text-slate">Teklif durumu</span>
                <select value={p.status} onChange={(e) => update({ status: e.target.value as Proposal["status"] })} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2">
                  {["Taslak", "Gönderildi", "Kabul edildi", "Reddedildi"].map((st) => <option key={st}>{st}</option>)}
                </select>
              </label>
            </div>
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <Area label="Teklif kapsamı" value={p.scopeNotes} onChange={(v) => update({ scopeNotes: v })} />
            <Area label="Garanti" value={p.warrantyNotes} onChange={(v) => update({ warrantyNotes: v })} />
          </section>
          <section className="rounded-2xl border border-line bg-paper-raised p-5">
            <h3 className="font-semibold">Rapor seçenekleri</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="text-[12.5px] font-semibold text-slate">Teklif biçimi</span>
                <select value={p.optionMode ?? "tek"} onChange={(e) => update({ optionMode: e.target.value as Proposal["optionMode"] })} className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px]">
                  <option value="tek">Tek seçenek</option>
                  <option value="uc">Karşılaştırmalı (ekonomik, önerilen, bataryalı)</option>
                </select>
              </label>
              <NumInput label="Fazla enerji satış bedeli (kuruş/kWh)" value={p.saleKr ?? 0} onChange={(v) => update({ saleKr: Math.max(0, v) })} note="Boşsa fazla üretim gelir sayılmaz." />
              <div className="space-y-1.5 pt-5 text-[13px]">
                <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(p.shortReport)} onChange={(e) => update({ shortReport: e.target.checked })} /> Kısa rapor (tasarruf sayfası çıkmaz)</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(p.callLetter)} onChange={(e) => update({ callLetter: e.target.checked })} /> Çağrı mektubu süreci dahil</label>
              </div>
              <label className="block md:col-span-2 lg:col-span-3">
                <span className="text-[12.5px] font-semibold text-slate">Özel sayfa (isteğe bağlı): başlık ve metin belgeye eklenir</span>
                <input value={p.customPageTitle ?? ""} onChange={(e) => update({ customPageTitle: e.target.value })} placeholder="Başlık" className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px]" />
                <textarea value={p.customPageText ?? ""} onChange={(e) => update({ customPageText: e.target.value })} rows={3} placeholder="Metin" className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px]" />
              </label>
            </div>
          </section>
          {checks.length > 0 && (
            <section className="rounded-2xl border border-line bg-paper-raised p-4">
              <h3 className="font-semibold">Kontrol listesi</h3>
              <ul className="mt-2 space-y-1 text-[13px]">
                {checks.map((c) => (
                  <li key={c.text} className={c.level === "hata" ? "font-semibold text-red-600" : "text-ink"}>{c.level === "hata" ? "Hata: " : "Uyarı: "}{c.text}</li>
                ))}
              </ul>
            </section>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink p-4 text-paper">
            <p className="text-[13.5px]">Son kontrol: teklif, bu ekrandaki ürün, adet, maliyet ve fiyatlarla oluşturulur.</p>
            <button onClick={() => (errorCount === 0 || confirm(`${errorCount} hata var. Yine de teklif oluşturulsun mu?`)) && createProposal()} className="rounded-lg bg-sun px-5 py-2.5 text-[14px] font-semibold text-ink">Teklif oluştur</button>
          </div>
        </div>
      )}

      {/* 6. Fiyat kuralları */}
      {tab === 5 && <PricingRules settings={settings} onChange={setSettings} />}

      {/* 5. Önizleme ve PDF */}
      {tab === 4 && (
        <div className="mt-5">
          {p.id && p.shareToken ? (
            <div className="mb-4 rounded-2xl border border-volt/40 bg-paper-raised p-4">
              <p className="font-semibold">Müşteri linki</p>
              <p className="mt-1 break-all font-mono-data text-[13px]">{`${location.origin}/teklif/${p.shareToken}`}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Btn onClick={() => navigator.clipboard.writeText(`${location.origin}/teklif/${p.shareToken}`).then(() => setMsg("Bağlantı kopyalandı."))}>Kopyala</Btn>
                <a href={`https://wa.me/${customerWa(p.customer.phone)}?text=${encodeURIComponent(`Sayın ${p.customer.name}, güneş enerjisi teklifinizi hazırladık. Çatınızın üç boyutlu tasarımını ve teklif detaylarını buradan inceleyebilirsiniz:\n${location.origin}/teklif/${p.shareToken}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg bg-volt px-3 py-2 text-[13px] font-semibold text-paper">WhatsApp ile gönder</a>
                {p.customer.email && <a href={`mailto:${p.customer.email}?subject=${encodeURIComponent(`Güneş enerjisi teklifiniz ${p.proposalNo}`)}&body=${encodeURIComponent(`Sayın ${p.customer.name},\n\nGüneş enerjisi teklifinizi hazırladık. Çatınızın üç boyutlu tasarımını ve teklif detaylarını buradan inceleyebilirsiniz:\n${location.origin}/teklif/${p.shareToken}\n\n${company.name}\n${company.phone}`)}`} className="inline-flex items-center rounded-lg border border-line px-3 py-2 text-[13px] font-semibold hover:border-ink">E-posta ile gönder</a>}
                <a href={`/teklif/${p.shareToken}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-brand hover:underline">Müşteri gözüyle aç</a>
              </div>
              <p className="mt-2 text-[12px] text-slate">Müşteri açınca e-posta bildirimi gelir ve “Teklifler” listesinde sayı görünür. Kendi oturumunuzla açmanız sayılmaz. Teklifi değiştirip kaydederseniz bağlantı aynı kalır, müşteri güncel hâlini görür.</p>
            </div>
          ) : (
            <p className="mb-4 rounded-xl bg-sun/15 p-3 text-[13px]">Müşteri linki için 4. adımda “Teklif oluştur”a basın.</p>
          )}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Btn icon={<Printer size={15} />} onClick={print} primary>PDF olarak kaydet / yazdır</Btn>
            <Btn icon={<Box size={15} />} onClick={captureImages}>3B görselleri yenile</Btn>
            <Btn icon={<Box size={15} />} onClick={makeVideo}>{videoPct != null ? `Video hazırlanıyor %${videoPct}` : "Müşteri videosu oluştur"}</Btn>
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

function Field({ label, value, onChange, onBlur, className = "" }: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[12.5px] font-semibold text-slate">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className="mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2 outline-none focus:border-brand" />
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
