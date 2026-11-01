"use client";

import { useEffect, useRef, useState } from "react";
import type { DivIcon, LatLng, LayerGroup, Map as LeafletMap, Marker, Polygon, Rectangle } from "leaflet";
import "leaflet/dist/leaflet.css";
import { cellFootprint, polygonArea, sameBlock, selfIntersects, toLatLon, toXY, type BlockOptions, type FaceFrame, type LatLon, type LayoutSettings, type Obstacle, type PanelCell, type XY } from "@/lib/teklif/geometry";
import { ESRI, getImagery } from "@/lib/teklif/imagery";

// Uydu üzerinde çatı yüzeyi çizme ve panel yerleştirme.
// Görüntü: Google Map Tiles (anahtar varsa), yoksa Esri World Imagery (lib/teklif/imagery.ts).

export type EditorMode = "sec" | "ciz" | "panel";
type PanelTool = "tek" | "diz" | "tasi" | "dizi" | "alan";

const PANEL_TOOLS: { id: PanelTool; ad: string; ipucu: string }[] = [
  { id: "tek", ad: "Ekle / kaldır", ipucu: "Panele tıklayınca kaldırılır, boş yere tıklayınca panel eklenir. Yüzey dışına da eklenebilir." },
  { id: "diz", ad: "Buradan diz", ipucu: "Dizinin başlayacağı köşeye tıklayın. Sütun ve sıra boşsa yüzey sınırına kadar gider; ikisi de doluysa sınırı geçebilir." },
  { id: "tasi", ad: "Panel taşı", ipucu: "Paneli tutup istediğiniz yere sürükleyin." },
  { id: "dizi", ad: "Dizi taşı", ipucu: "Bir paneli tutup sürükleyin, aynı dizideki paneller birlikte gider." },
  { id: "alan", ad: "Alanla kaldır", ipucu: "Haritada bir alan çizin, içindeki paneller kaldırılır." },
];

type Props = {
  center: LatLon;
  zoom: number;
  frames: FaceFrame[];
  cells: PanelCell[];
  layout: LayoutSettings;
  selectedFaceId: string | null;
  mode: EditorMode;
  onView: (center: LatLon, zoom: number) => void;
  onFaceDrawn: (points: LatLon[]) => void;
  onSelectFace: (id: string | null) => void;
  /** Seçili yüzey ya da engelin köşeleri değişti; whole: tüm şekil taşındı, paneller de birlikte gider. */
  onShapeEdit: (id: string, points: LatLon[], whole: boolean) => void;
  onPanelRemove: (cells: PanelCell[]) => void;
  onPanelMove: (cells: PanelCell[], delta: XY) => void;
  onBlockStart: (p: XY, o: BlockOptions) => void;
  onUndo: () => void;
  canUndo: boolean;
  /** Panel modunda tıklanan nokta (tasarım merkezine göre metre). */
  onPanelClick: (p: XY) => void;
  /** Harita bu konuma götürülür (adres, koordinat, parsel araması). */
  focus?: { center: LatLon; zoom: number; key: number } | null;
  /** Parsel sınırı (turuncu çizgi); tıklamaları engellemez. */
  parcelRing?: LatLon[] | null;
  obstacles?: Obstacle[];
};

function handleIcon(lib: typeof import("leaflet"), kind: "kose" | "orta" | "tasi"): DivIcon {
  // Dış kutu parmakla tutmaya yetecek kadar büyük, görünen nokta ortasında.
  const dot = {
    kose: "width:14px;height:14px;border-radius:3px;background:#fff;border:2.5px solid #f5b301",
    orta: "width:10px;height:10px;border-radius:50%;background:#f5b301cc;border:1.5px solid #fff",
    tasi: "width:24px;height:24px;border-radius:50%;background:#f5b301;border:2px solid #fff;color:#14213d;font-size:15px;line-height:20px;text-align:center",
  }[kind];
  return lib.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center"><div style="${dot};box-shadow:0 1px 4px #0009">${kind === "tasi" ? "✥" : ""}</div></div>`,
  });
}

export default function SatelliteEditor(props: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const draftLayer = useRef<LayerGroup | null>(null);
  const parcelLayer = useRef<LayerGroup | null>(null);
  const handleLayer = useRef<LayerGroup | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);
  const propsRef = useRef(props);
  const [draft, setDraft] = useState<LatLon[]>([]);
  const draftRef = useRef<LatLon[]>([]);
  const [ready, setReady] = useState(false);
  const [rebuild, setRebuild] = useState(0);
  const [warn, setWarn] = useState<string | null>(null);
  const [tool, setTool] = useState<PanelTool>("tek");
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const [right, setRight] = useState(true);
  const [up, setUp] = useState(true);
  const toolRef = useRef({ tool, cols, rows, right, up });
  const moving = useRef<{ start: LatLng; items: { poly: Polygon; pts: LatLon[] }[]; cells: PanelCell[] } | null>(null);
  const box2 = useRef<{ start: LatLng; rect: Rectangle } | null>(null);

  useEffect(() => {
    propsRef.current = props;
    toolRef.current = { tool, cols, rows, right, up };
  });
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    let alive = true;
    const docEvents = new AbortController();
    (async () => {
      const lib = (await import("leaflet")).default;
      if (!alive || !box.current || map.current) return;
      L.current = lib;
      const m = lib.map(box.current, { zoomControl: true, maxZoom: 22, doubleClickZoom: false, keyboard: false }).setView(propsRef.current.center, propsRef.current.zoom);
      // Google karoları art arda hata verirse (kota, ödeme vb.) Esri'ye geçilir.
      const im = await getImagery();
      if (!alive) return;
      const base = lib.tileLayer(im.template, { maxZoom: 22, maxNativeZoom: im.maxNativeZoom, attribution: im.attribution }).addTo(m);
      let errors = 0;
      base.on("tileerror", () => {
        if (im.source === "google" && ++errors === 4) base.setUrl(ESRI.template);
      });
      layer.current = lib.layerGroup().addTo(m);
      draftLayer.current = lib.layerGroup().addTo(m);
      parcelLayer.current = lib.layerGroup().addTo(m);
      handleLayer.current = lib.layerGroup().addTo(m);
      m.on("moveend", () => {
        const c = m.getCenter();
        propsRef.current.onView([c.lat, c.lng], m.getZoom());
      });
      m.on("click", (e) => {
        const p = propsRef.current;
        const ll: LatLon = [e.latlng.lat, e.latlng.lng];
        const t = toolRef.current;
        if (p.mode === "ciz") setDraft((d) => [...d, ll]);
        else if (p.mode === "panel") {
          if (t.tool === "tek") p.onPanelClick(toXY(ll, p.center));
          else if (t.tool === "diz") p.onBlockStart(toXY(ll, p.center), { cols: t.cols, rows: t.rows, right: t.right, up: t.up });
        } else p.onSelectFace(null);
      });
      // Panel taşıma ve alanla kaldırma.
      m.on("mousedown", (e) => {
        if (propsRef.current.mode !== "panel" || toolRef.current.tool !== "alan") return;
        box2.current = { start: e.latlng, rect: lib.rectangle(lib.latLngBounds(e.latlng, e.latlng), { color: "#e5484d", weight: 2, fillOpacity: 0.15, interactive: false }).addTo(m) };
      });
      m.on("mousemove", (e) => {
        const mv = moving.current;
        if (mv) {
          const dLat = e.latlng.lat - mv.start.lat;
          const dLng = e.latlng.lng - mv.start.lng;
          mv.items.forEach((it) => it.poly.setLatLngs(it.pts.map((q) => [q[0] + dLat, q[1] + dLng] as LatLon)));
        }
        if (box2.current) box2.current.rect.setBounds(lib.latLngBounds(box2.current.start, e.latlng));
      });
      const release = (e?: { latlng?: LatLng }) => {
        const p = propsRef.current;
        const mv = moving.current;
        if (mv) {
          moving.current = null;
          m.dragging.enable();
          const end = e?.latlng;
          const delta = end ? toXY([end.lat, end.lng], [mv.start.lat, mv.start.lng]) : { x: 0, n: 0 };
          if (Math.hypot(delta.x, delta.n) > 0.02) p.onPanelMove(mv.cells, delta);
          else setRebuild((n) => n + 1);
        }
        if (box2.current) {
          const bounds = box2.current.rect.getBounds();
          box2.current.rect.remove();
          box2.current = null;
          const byId = new Map(p.frames.map((f) => [f.face.id, f]));
          const hit = p.cells.filter((c) => {
            const fr = byId.get(c.faceId);
            if (!fr) return false;
            const q = cellFootprint(fr, c, p.layout).map((x) => toLatLon(x, p.center));
            return bounds.contains([q.reduce((a, x) => a + x[0], 0) / 4, q.reduce((a, x) => a + x[1], 0) / 4]);
          });
          if (hit.length) p.onPanelRemove(hit);
        }
      };
      m.on("mouseup", release);
      document.addEventListener("mouseup", () => {
        if (moving.current || box2.current) setTimeout(() => release(), 0);
      }, { signal: docEvents.signal });
      m.on("dblclick", () => {
        if (propsRef.current.mode === "ciz") finish();
      });
      map.current = m;
      setReady(true);
    })();
    return () => {
      alive = false;
      docEvents.abort();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  function finish() {
    const pts = draftRef.current;
    if (pts.length >= 3) propsRef.current.onFaceDrawn(pts);
    setDraft([]);
  }

  // Yüzeyler ve paneller her değişiklikte yeniden çizilir (yüzlerce poligon için yeterince hızlı).
  useEffect(() => {
    const lib = L.current;
    const g = layer.current;
    if (!ready || !lib || !g) return;
    g.clearLayers();
    const { frames, cells, layout, selectedFaceId, mode, center } = props;
    for (const fr of frames) {
      const sel = fr.face.id === selectedFaceId;
      const poly = lib.polygon(fr.face.points, {
        color: sel ? "#f5b301" : "#ffffff",
        weight: sel ? 3 : 2,
        dashArray: sel ? undefined : "6 4",
        fillColor: sel ? "#f5b301" : "#ffffff",
        fillOpacity: sel ? 0.12 : 0.06,
        interactive: mode === "sec",
      });
      poly.on("click", (e) => {
        lib.DomEvent.stopPropagation(e);
        props.onSelectFace(fr.face.id);
      });
      poly.bindTooltip(fr.face.name, { direction: "center", className: "!bg-ink/80 !text-paper !border-0 !text-[11px]" });
      g.addLayer(poly);
    }
    for (const o of props.obstacles ?? []) {
      const poly = lib.polygon(o.points, { color: "#e5484d", weight: 2, fillColor: "#e5484d", fillOpacity: 0.3, interactive: mode === "sec" });
      poly.on("click", (e) => {
        lib.DomEvent.stopPropagation(e);
        props.onSelectFace(o.id);
      });
      poly.bindTooltip(`${o.name} · ${o.height} m`, { permanent: true, direction: "center", className: "!bg-red-700/80 !text-paper !border-0 !text-[10.5px]" });
      g.addLayer(poly);
    }
    const byId = new Map(frames.map((f) => [f.face.id, f]));
    const m = map.current;
    const clickable = mode === "panel" && (tool === "tek" || tool === "tasi" || tool === "dizi");
    if (m && !moving.current && !(mode === "panel" && tool === "alan")) m.dragging.enable();
    const drawn: { cell: PanelCell; poly: Polygon; pts: LatLon[] }[] = [];
    for (const c of cells) {
      const fr = byId.get(c.faceId);
      if (!fr) continue;
      const pts = cellFootprint(fr, c, layout).map((p) => toLatLon(p, center));
      const poly = lib.polygon(pts, { color: "#9fb6d6", weight: 0.8, fillColor: "#132a4f", fillOpacity: 0.92, interactive: clickable });
      if (clickable && tool === "tek") {
        poly.on("mouseover", () => poly.setStyle({ fillColor: "#b42318" }));
        poly.on("mouseout", () => poly.setStyle({ fillColor: "#132a4f" }));
        poly.on("click", (e) => {
          lib.DomEvent.stopPropagation(e);
          propsRef.current.onPanelRemove([c]);
        });
      }
      if (clickable && tool !== "tek") {
        // Harita sürüklemesi panelin üstündeyken kapanır, yoksa basınca harita kayar.
        poly.on("mouseover", () => m?.dragging.disable());
        poly.on("mouseout", () => {
          if (!moving.current) m?.dragging.enable();
        });
        poly.on("mousedown", (e) => {
          lib.DomEvent.stopPropagation(e);
          const group = tool === "dizi" ? drawn.filter((d) => sameBlock(d.cell, c)) : drawn.filter((d) => d.cell === c);
          group.forEach((d) => d.poly.setStyle({ fillColor: "#1d4ed8" }));
          moving.current = { start: e.latlng, items: group.map((d) => ({ poly: d.poly, pts: d.pts })), cells: group.map((d) => d.cell) };
        });
        poly.on("click", (e) => lib.DomEvent.stopPropagation(e));
      }
      drawn.push({ cell: c, poly, pts });
      g.addLayer(poly);
    }
  }, [props, ready, tool, rebuild]);

  // Alanla kaldırırken harita kaymaz.
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    if (props.mode === "panel" && tool === "alan") m.dragging.disable();
    else m.dragging.enable();
  }, [props.mode, tool, ready]);

  // Seçili şeklin tutma noktaları. Üst bileşen her yenilendiğinde değil, yalnız köşeler değişince kurulur; yoksa sürükleme kopar.
  const editPoints = props.mode === "sec" ? (props.frames.find((f) => f.face.id === props.selectedFaceId)?.face.points ?? props.obstacles?.find((o) => o.id === props.selectedFaceId)?.points ?? null) : null;
  const editId = props.selectedFaceId;
  useEffect(() => {
    const lib = L.current;
    const g = handleLayer.current;
    if (!ready || !lib || !g) return;
    g.clearLayers();
    if (!editPoints || !editId) return;
    const original = JSON.stringify(editPoints);
    let pts = editPoints.map((q) => [q[0], q[1]] as LatLon);
    const outline = lib.polygon(pts, { color: "#f5b301", weight: 3, fill: false, interactive: false });
    g.addLayer(outline);

    const commit = (whole = false) => {
      if (JSON.stringify(pts) === original) return setRebuild((n) => n + 1);
      if (selfIntersects(pts)) {
        setWarn("Kenarlar birbirini kesiyor; son hareket geri alındı.");
        return setRebuild((n) => n + 1);
      }
      setWarn(null);
      propsRef.current.onShapeEdit(editId, pts, whole);
    };
    const others: Marker[] = [];
    const hideOthers = (self: Marker) => others.forEach((m) => m !== self && m.setOpacity(0));
    // Sürüklerken komşu kenarların boyu ve alan görünür.
    const label = (i: number) => {
      const n = pts.length;
      const c = propsRef.current.center;
      const dist = (a: LatLon, b: LatLon) => {
        const d = toXY(b, a);
        return Math.hypot(d.x, d.n).toLocaleString("tr-TR", { maximumFractionDigits: 1 });
      };
      return `${dist(pts[(i + n - 1) % n], pts[i])} m · ${dist(pts[i], pts[(i + 1) % n])} m · ${Math.round(polygonArea(pts.map((q) => toXY(q, c))))} m²`;
    };
    const dragged = (m: Marker, i: number) => {
      const ll = m.getLatLng();
      pts[i] = [ll.lat, ll.lng];
      outline.setLatLngs(pts);
      m.setTooltipContent(label(i));
    };
    const tip = { direction: "top" as const, offset: [0, -12] as [number, number], className: "!bg-ink/90 !text-paper !border-0 !text-[11.5px]" };

    pts.forEach((q, i) => {
      const m = lib.marker(q, { draggable: true, autoPan: true, icon: handleIcon(lib, "kose"), title: "Sürükleyin; silmek için çift tıklayın" });
      m.on("dragstart", () => {
        hideOthers(m);
        m.bindTooltip(label(i), tip).openTooltip();
      });
      m.on("drag", () => dragged(m, i));
      m.on("dragend", () => commit());
      const remove = () => {
        if (pts.length <= 3) return setWarn("Bir yüzeyde en az 3 köşe olmalı.");
        pts = pts.filter((_, k) => k !== i);
        commit();
      };
      // Çift tıklama süreyle sayılır: dokunmatikte de çalışır.
      let lastClick = 0;
      m.on("click", () => {
        const now = Date.now();
        if (now - lastClick < 450) remove();
        lastClick = now;
      });
      m.on("contextmenu", remove);
      // Dinleyicisi olmayan işaretçide tıklama haritaya geçer ve seçim kalkar.
      m.on("click", () => {});
      others.push(m);
      g.addLayer(m);
    });
    // Kenar ortasındaki nokta çekilince yeni köşe olur.
    editPoints.forEach((q, k) => {
      const r = editPoints[(k + 1) % editPoints.length];
      const m = lib.marker([(q[0] + r[0]) / 2, (q[1] + r[1]) / 2], { draggable: true, autoPan: true, icon: handleIcon(lib, "orta"), title: "Yeni köşe eklemek için çekin" });
      m.on("dragstart", () => {
        hideOthers(m);
        const ll = m.getLatLng();
        pts.splice(k + 1, 0, [ll.lat, ll.lng]);
        m.bindTooltip(label(k + 1), tip).openTooltip();
      });
      m.on("drag", () => dragged(m, k + 1));
      m.on("dragend", () => commit());
      // Dinleyicisi olmayan işaretçide tıklama haritaya geçer ve seçim kalkar.
      m.on("click", () => {});
      others.push(m);
      g.addLayer(m);
    });
    // Ortadaki tutamak tüm şekli taşır; paneller de birlikte gider.
    const mid: LatLon = [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length];
    const mover = lib.marker(mid, { draggable: true, autoPan: true, icon: handleIcon(lib, "tasi"), title: "Tüm şekli taşı" });
    const base = pts.map((q) => [q[0], q[1]] as LatLon);
    mover.on("dragstart", () => hideOthers(mover));
    mover.on("drag", () => {
      const ll = mover.getLatLng();
      pts = base.map((q) => [q[0] + ll.lat - mid[0], q[1] + ll.lng - mid[1]] as LatLon);
      outline.setLatLngs(pts);
    });
    mover.on("dragend", () => commit(true));
    mover.on("click", () => {});
    others.push(mover);
    g.addLayer(mover);
  }, [editPoints, editId, ready, rebuild]);

  // Çizim taslağı (yalnız çizim modunda gösterilir); noktalar çizerken de sürüklenebilir.
  const drawing = props.mode === "ciz";
  useEffect(() => {
    const shown = drawing ? draft : [];
    const lib = L.current;
    const g = draftLayer.current;
    if (!ready || !lib || !g) return;
    g.clearLayers();
    if (!shown.length) return;
    const pts = shown.map((q) => [q[0], q[1]] as LatLon);
    const line = lib.polyline([...pts, pts[0]], { color: "#f5b301", weight: 2, dashArray: "4 4", interactive: false });
    g.addLayer(line);
    pts.forEach((q, i) => {
      const m = lib.marker(q, { draggable: true, autoPan: true, icon: handleIcon(lib, "kose") });
      m.on("drag", () => {
        const ll = m.getLatLng();
        pts[i] = [ll.lat, ll.lng];
        line.setLatLngs([...pts, pts[0]]);
      });
      m.on("dragend", () => setDraft(pts.map((x) => [x[0], x[1]] as LatLon)));
      // İlk noktaya tıklamak yüzeyi kapatır.
      m.on("click", () => {
        if (i === 0) finish();
      });
      g.addLayer(m);
    });
  }, [draft, drawing, ready]);

  const { focus, parcelRing } = props;
  useEffect(() => {
    if (ready && focus) map.current?.setView(focus.center, focus.zoom);
  }, [focus, ready]);

  useEffect(() => {
    const lib = L.current;
    const g = parcelLayer.current;
    if (!ready || !lib || !g) return;
    g.clearLayers();
    if (parcelRing?.length) g.addLayer(lib.polygon(parcelRing, { color: "#ff7a1a", weight: 2.5, fill: false, interactive: false }));
  }, [parcelRing, ready]);

  return (
    <div className="relative">
      {props.mode === "ciz" && (
        <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-2 rounded-lg bg-ink/85 px-3 py-2 text-[12.5px] text-paper">
          <span>Çatı yüzeyinin köşelerine sırayla tıklayın ({draft.length} nokta)</span>
          <button onClick={() => setDraft((d) => d.slice(0, -1))} disabled={!draft.length} className="rounded bg-paper/15 px-2 py-1 disabled:opacity-40">
            Geri al
          </button>
          <button onClick={finish} disabled={draft.length < 3} className="rounded bg-sun px-2 py-1 font-semibold text-ink disabled:opacity-40">
            Yüzeyi tamamla
          </button>
        </div>
      )}
      {props.mode === "sec" && (editPoints || props.canUndo || warn) && (
        <div className="absolute bottom-3 left-3 z-[500] flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 rounded-lg bg-ink/85 px-3 py-2 text-[12.5px] text-paper">
          {warn ? <span className="text-sun">{warn}</span> : editPoints && <span>Köşeleri sürükleyin. Kenar ortasındaki noktayı çekince yeni köşe eklenir, köşeye çift tıklayınca silinir, ✥ ile tümü taşınır.</span>}
          {props.canUndo && (
            <button onClick={() => { setWarn(null); props.onUndo(); }} className="rounded bg-paper/15 px-2 py-1">
              Geri al
            </button>
          )}
        </div>
      )}
      {props.mode === "panel" && (
        <div className="mb-2 rounded-xl border border-line bg-paper-raised p-2.5 text-[13px]">
          <div className="flex flex-wrap items-center gap-1.5">
            {PANEL_TOOLS.map((t) => (
              <button key={t.id} onClick={() => setTool(t.id)} className={`rounded-lg px-2.5 py-1.5 font-semibold ${tool === t.id ? "bg-ink text-paper" : "border border-line hover:border-ink"}`}>
                {t.ad}
              </button>
            ))}
            <button onClick={props.onUndo} disabled={!props.canUndo} className="ml-auto rounded-lg border border-line px-2.5 py-1.5 font-semibold hover:border-ink disabled:opacity-40">
              Geri al
            </button>
          </div>
          {/* Araç değişince harita kaymasın diye satır yerinde kalır. */}
          {(
            <div className={`mt-2 flex flex-wrap items-center gap-2 ${tool === "diz" ? "" : "invisible"}`}>
              <label className="flex items-center gap-1">Sütun <input type="number" min={0} value={cols || ""} placeholder="sınıra kadar" onChange={(e) => setCols(Math.max(0, Math.round(Number(e.target.value))))} className="w-24 rounded-lg border border-line bg-paper px-2 py-1" /></label>
              <label className="flex items-center gap-1">Sıra <input type="number" min={0} value={rows || ""} placeholder="sınıra kadar" onChange={(e) => setRows(Math.max(0, Math.round(Number(e.target.value))))} className="w-24 rounded-lg border border-line bg-paper px-2 py-1" /></label>
              <select value={right ? "sag" : "sol"} onChange={(e) => setRight(e.target.value === "sag")} aria-label="Yatay yön" className="rounded-lg border border-line bg-paper px-2 py-1">
                <option value="sag">Sağa doğru</option>
                <option value="sol">Sola doğru</option>
              </select>
              <select value={up ? "yukari" : "asagi"} onChange={(e) => setUp(e.target.value === "yukari")} aria-label="Dikey yön" className="rounded-lg border border-line bg-paper px-2 py-1">
                <option value="yukari">Yukarı doğru</option>
                <option value="asagi">Aşağı doğru</option>
              </select>
            </div>
          )}
          <p className="mt-1.5 text-[12px] text-slate">{PANEL_TOOLS.find((t) => t.id === tool)?.ipucu}</p>
        </div>
      )}
      {/* Harita kutusunun sınıfı sabit kalmalı: Leaflet kendi sınıflarını ekler, React değiştirirse silinir. */}
      <div className={props.mode === "sec" ? "" : "[&_.leaflet-container]:!cursor-crosshair"}>
        <div ref={box} className="h-[560px] w-full overflow-hidden rounded-2xl border border-line" />
      </div>
    </div>
  );
}
