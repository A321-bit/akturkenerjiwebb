"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Eraser, PenLine, Undo2 } from "lucide-react";
import type { LayerGroup, Map as LeafletMap, Marker, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import AddressSearch from "./AddressSearch";
import { ILLER } from "@/lib/il-konum";
import { getImagery } from "@/lib/teklif/imagery";
import { polygonArea, toXY, type LatLon } from "@/lib/teklif/geometry";

// Konum seçimi: yazıldıkça önerilen adres, "konumumu bul", uydu haritasında iğne ve
// isteğe bağlı çatı çizimi. Leaflet yalnızca tarayıcıda yüklenir.

export type PickedLocation = { lat: number; lon: number; il: string; label?: string };
export type RoofDrawing = { ring: LatLon[]; areaM2: number };

export function nearestIl(lat: number, lon: number): string {
  let best = ILLER[0];
  let bestD = Infinity;
  for (const i of ILLER) {
    const d = (i.lat - lat) ** 2 + ((i.lon - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best.ad;
}

const PIN = `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg"><path d="M17 43s15-14.6 15-26A15 15 0 0 0 2 17c0 11.4 15 26 15 26z" fill="#3f74c4" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="17" r="5.5" fill="#fff"/></svg>`;
const VERTEX = `<span style="display:block;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid #f5b301;box-shadow:0 1px 4px rgba(0,0,0,.5)"></span>`;
const ESRI_REF = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference";

const areaOf = (ring: LatLon[]) => (ring.length < 3 ? 0 : polygonArea(ring.map((p) => toXY(p, ring[0]))));

export default function LocationPicker({
  value,
  onChange,
  roof,
  onRoof,
}: {
  value: PickedLocation | null;
  onChange: (v: PickedLocation) => void;
  /** Verilirse çatı çizimi sunulur. */
  roof?: RoofDrawing | null;
  onRoof?: (r: RoofDrawing | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const labels = useRef<TileLayer[]>([]);
  const onChangeRef = useRef(onChange);
  const onRoofRef = useRef(onRoof);
  const placeRef = useRef<((lat: number, lon: number, label?: string) => void) | null>(null);
  const ring = useRef<LatLon[]>(roof?.ring ?? []);
  const drawingRef = useRef(false);
  const redrawRef = useRef<(() => void) | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState(roof?.ring.length ?? 0);
  const [area, setArea] = useState(roof?.areaM2 ?? 0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
    onRoofRef.current = onRoof;
  }, [onChange, onRoof]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ default: L }, imagery] = await Promise.all([import("leaflet"), getImagery()]);
      if (!alive || !box.current || map.current) return;
      const start = value ?? { lat: 39.0, lon: 35.2 };
      const m = L.map(box.current, { zoomControl: true, scrollWheelZoom: false, keyboard: false, maxZoom: 21 }).setView([start.lat, start.lon], value ? 19 : 6);
      L.tileLayer(imagery.template, { maxNativeZoom: imagery.maxNativeZoom, maxZoom: 21, attribution: imagery.attribution }).addTo(m);
      // Yol ve yer adları uydu görüntüsünün üstünde; çizim sırasında kaldırılır.
      labels.current = ["World_Transportation", "World_Boundaries_and_Places"].map((s) => L.tileLayer(`${ESRI_REF}/${s}/MapServer/tile/{z}/{y}/{x}`, { maxNativeZoom: 19, maxZoom: 21 }).addTo(m));

      const shapes: LayerGroup = L.layerGroup().addTo(m);
      const vertexIcon = L.divIcon({ html: VERTEX, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
      const report = () => {
        const a = areaOf(ring.current);
        setPoints(ring.current.length);
        setArea(a);
        if (!drawingRef.current) onRoofRef.current?.(ring.current.length >= 3 ? { ring: ring.current, areaM2: a } : null);
      };
      const redraw = () => {
        shapes.clearLayers();
        const pts = ring.current;
        if (pts.length >= 3) shapes.addLayer(L.polygon(pts, { color: "#f5b301", weight: 3, fillColor: "#f5b301", fillOpacity: 0.28, interactive: false }));
        else if (pts.length === 2) shapes.addLayer(L.polyline(pts, { color: "#f5b301", weight: 3, interactive: false }));
        pts.forEach((p, i) => {
          const v = L.marker(p, { icon: vertexIcon, draggable: true, keyboard: false });
          v.on("drag", () => {
            const q = v.getLatLng();
            ring.current = ring.current.map((x, j) => (j === i ? ([q.lat, q.lng] as LatLon) : x));
          });
          v.on("dragend", () => {
            redraw();
            report();
          });
          shapes.addLayer(v);
        });
      };
      redrawRef.current = () => {
        redraw();
        report();
      };

      const icon = L.divIcon({ html: PIN, className: "", iconSize: [34, 44], iconAnchor: [17, 43] });
      const place = (lat: number, lon: number, label?: string) => {
        if (!marker.current) {
          marker.current = L.marker([lat, lon], { icon, draggable: true, keyboard: false }).addTo(m);
          marker.current.on("dragend", () => {
            const p = marker.current!.getLatLng();
            onChangeRef.current({ lat: p.lat, lon: p.lng, il: nearestIl(p.lat, p.lng) });
          });
        } else marker.current.setLatLng([lat, lon]);
        onChangeRef.current({ lat, lon, il: nearestIl(lat, lon), label });
      };
      m.on("click", (e) => {
        if (drawingRef.current) {
          ring.current = [...ring.current, [e.latlng.lat, e.latlng.lng]];
          redraw();
          report();
        } else place(e.latlng.lat, e.latlng.lng);
      });
      if (value) place(value.lat, value.lon, value.label);
      redraw();
      map.current = m;
      placeRef.current = place;
    })();
    return () => {
      alive = false;
      map.current?.remove();
      map.current = null;
      marker.current = null;
      redrawRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- harita bir kez kurulur

  const placeAt = (lat: number, lon: number, label?: string) => {
    placeRef.current?.(lat, lon, label);
    map.current?.setView([lat, lon], 19);
  };

  function locate() {
    if (!navigator.geolocation) return setMsg("Tarayıcınız konum paylaşımını desteklemiyor.");
    setBusy(true);
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        placeAt(p.coords.latitude, p.coords.longitude);
        setBusy(false);
      },
      () => {
        setMsg("Konum izni verilmedi; adres yazın ya da haritada işaretleyin.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function setLabels(on: boolean) {
    const m = map.current;
    if (!m) return;
    labels.current.forEach((l) => (on ? l.addTo(m) : l.remove()));
  }

  function startDrawing() {
    if (!value) return setMsg("Önce adresinizi seçin ya da konumunuzu bulun.");
    setMsg(null);
    drawingRef.current = true;
    setDrawing(true);
    setLabels(false);
    ring.current = [];
    redrawRef.current?.();
    map.current?.setView([value.lat, value.lon], Math.max(map.current.getZoom(), 20));
    marker.current?.remove();
  }

  function finishDrawing() {
    drawingRef.current = false;
    setDrawing(false);
    setLabels(true);
    if (marker.current && map.current) marker.current.addTo(map.current);
    redrawRef.current?.();
  }

  function undo() {
    ring.current = ring.current.slice(0, -1);
    redrawRef.current?.();
  }

  function clear() {
    ring.current = [];
    redrawRef.current?.();
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper-raised px-3 py-2 text-[13px] font-semibold text-ink hover:border-brand disabled:opacity-40";

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <AddressSearch className="flex-1" onPick={placeAt} placeholder="Adres, sokak ya da site adı yazın (ör. Beytepe)" />
        <button onClick={locate} disabled={busy} className="flex items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-3 text-[13.5px] font-semibold text-ink hover:border-brand disabled:opacity-50">
          <Crosshair size={16} /> {busy ? "Konum alınıyor…" : "Konumumu bul"}
        </button>
      </div>
      {msg && <p className="mt-2 text-[12.5px] text-red-600">{msg}</p>}
      <div ref={box} className="relative z-0 mt-3 h-[360px] w-full overflow-hidden rounded-2xl border border-line sm:h-[440px]" />

      {onRoof && (
        <div className="mt-3 rounded-xl border border-line bg-paper p-3">
          {drawing ? (
            <>
              <p className="text-[13.5px] font-semibold text-ink">Çatınızın köşelerine sırayla dokunun</p>
              <p className="mt-0.5 text-[12.5px] text-slate">
                {points < 3 ? `En az 3 köşe gerekiyor (${points} işaretlendi).` : `Yaklaşık ${Math.round(area).toLocaleString("tr-TR")} m². Köşeleri sürükleyerek düzeltebilirsiniz.`}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button onClick={finishDrawing} disabled={points < 3} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-paper hover:bg-brand-deep disabled:opacity-40">
                  Çizimi bitir
                </button>
                <button onClick={undo} disabled={!points} className={btn}>
                  <Undo2 size={14} /> Geri al
                </button>
                <button onClick={clear} disabled={!points} className={btn}>
                  <Eraser size={14} /> Temizle
                </button>
              </div>
            </>
          ) : points >= 3 ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13.5px] font-semibold text-ink">Çatınız çizildi: yaklaşık {Math.round(area).toLocaleString("tr-TR")} m²</p>
              <div className="flex gap-2">
                <button onClick={startDrawing} className={btn}>
                  <PenLine size={14} /> Yeniden çiz
                </button>
                <button onClick={clear} className={btn}>
                  <Eraser size={14} /> Sil
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-slate">İsterseniz çatınızı kendiniz çizin, kaç panel sığacağını görün. Zorunlu değildir.</p>
              <button onClick={startDrawing} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper">
                <PenLine size={14} /> Çatımı çiz
              </button>
            </div>
          )}
        </div>
      )}

      {!drawing && (
        <p className="mt-2 text-[12.5px] text-slate">
          {value ? (
            <>
              <b className="text-ink">{value.il}</b> · iğneyi sürükleyerek tam çatınızın üzerine taşıyabilirsiniz.
            </>
          ) : (
            "Adresinizi yazıp listeden seçin, konumunuzu bulun ya da haritada evinizin üzerine dokunun."
          )}
        </p>
      )}
    </div>
  );
}
