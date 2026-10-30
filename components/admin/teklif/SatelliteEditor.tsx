"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { cellFootprint, toLatLon, toXY, type FaceFrame, type LatLon, type LayoutSettings, type Obstacle, type PanelCell, type XY } from "@/lib/teklif/geometry";
import { ESRI, getImagery } from "@/lib/teklif/imagery";

// Uydu üzerinde çatı yüzeyi çizme ve panel yerleştirme.
// Görüntü: Google Map Tiles (anahtar varsa), yoksa Esri World Imagery (lib/teklif/imagery.ts).

export type EditorMode = "sec" | "ciz" | "panel";

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
  /** Panel modunda tıklanan nokta (tasarım merkezine göre metre). */
  onPanelClick: (p: XY) => void;
  /** Harita bu konuma götürülür (adres, koordinat, parsel araması). */
  focus?: { center: LatLon; zoom: number; key: number } | null;
  /** Parsel sınırı (turuncu çizgi); tıklamaları engellemez. */
  parcelRing?: LatLon[] | null;
  obstacles?: Obstacle[];
};

export default function SatelliteEditor(props: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const draftLayer = useRef<LayerGroup | null>(null);
  const parcelLayer = useRef<LayerGroup | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);
  const propsRef = useRef(props);
  const [draft, setDraft] = useState<LatLon[]>([]);
  const draftRef = useRef<LatLon[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    propsRef.current = props;
  });
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    let alive = true;
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
      m.on("moveend", () => {
        const c = m.getCenter();
        propsRef.current.onView([c.lat, c.lng], m.getZoom());
      });
      m.on("click", (e) => {
        const p = propsRef.current;
        const ll: LatLon = [e.latlng.lat, e.latlng.lng];
        if (p.mode === "ciz") setDraft((d) => [...d, ll]);
        else if (p.mode === "panel") p.onPanelClick(toXY(ll, p.center));
        else p.onSelectFace(null);
      });
      m.on("dblclick", () => {
        if (propsRef.current.mode === "ciz") finish();
      });
      map.current = m;
      setReady(true);
    })();
    return () => {
      alive = false;
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
      const poly = lib.polygon(o.points, { color: "#e5484d", weight: 2, fillColor: "#e5484d", fillOpacity: 0.3, interactive: false });
      poly.bindTooltip(`${o.name} · ${o.height} m`, { permanent: true, direction: "center", className: "!bg-red-700/80 !text-paper !border-0 !text-[10.5px]" });
      g.addLayer(poly);
    }
    const byId = new Map(frames.map((f) => [f.face.id, f]));
    for (const c of cells) {
      const fr = byId.get(c.faceId);
      if (!fr) continue;
      const pts = cellFootprint(fr, c, layout).map((p) => toLatLon(p, center));
      g.addLayer(lib.polygon(pts, { color: "#9fb6d6", weight: 0.8, fillColor: "#132a4f", fillOpacity: 0.92, interactive: false }));
    }
  }, [props, ready]);

  // Çizim taslağı (yalnız çizim modunda gösterilir).
  const drawing = props.mode === "ciz";
  useEffect(() => {
    const shown = drawing ? draft : [];
    const lib = L.current;
    const g = draftLayer.current;
    if (!ready || !lib || !g) return;
    g.clearLayers();
    if (!shown.length) return;
    g.addLayer(lib.polyline([...shown, shown[0]], { color: "#f5b301", weight: 2, dashArray: "4 4" }));
    shown.forEach((p) => g.addLayer(lib.circleMarker(p, { radius: 4, color: "#f5b301", fillColor: "#fff", fillOpacity: 1, weight: 2 })));
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
      {props.mode === "panel" && (
        <div className="absolute bottom-3 left-3 z-[500] rounded-lg bg-ink/85 px-3 py-2 text-[12.5px] text-paper">Panel eklemek ya da kaldırmak için yüzey üzerinde tıklayın</div>
      )}
      {/* Harita kutusunun sınıfı sabit kalmalı: Leaflet kendi sınıflarını ekler, React değiştirirse silinir. */}
      <div className={props.mode === "sec" ? "" : "[&_.leaflet-container]:!cursor-crosshair"}>
        <div ref={box} className="h-[560px] w-full overflow-hidden rounded-2xl border border-line" />
      </div>
    </div>
  );
}
