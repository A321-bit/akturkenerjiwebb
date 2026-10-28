"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Search } from "lucide-react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ILLER } from "@/lib/il-konum";

// Konum seçimi: adres arama (OpenStreetMap Nominatim), "konumumu bul" ve haritaya iğne bırakma.
// Leaflet yalnızca tarayıcıda yüklenir; harita verisi © OpenStreetMap katkıcıları.

export type PickedLocation = { lat: number; lon: number; il: string; label?: string };

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

export default function LocationPicker({ value, onChange }: { value: PickedLocation | null; onChange: (v: PickedLocation) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const placeRef = useRef<((lat: number, lon: number, label?: string) => void) | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!alive || !box.current || map.current) return;
      const start = value ?? { lat: 39.0, lon: 35.2 };
      const m = L.map(box.current, { zoomControl: true, scrollWheelZoom: false }).setView([start.lat, start.lon], value ? 15 : 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      const icon = L.divIcon({ html: PIN, className: "", iconSize: [34, 44], iconAnchor: [17, 43] });
      const place = (lat: number, lon: number, label?: string) => {
        if (!marker.current) {
          marker.current = L.marker([lat, lon], { icon, draggable: true }).addTo(m);
          marker.current.on("dragend", () => {
            const p = marker.current!.getLatLng();
            onChangeRef.current({ lat: p.lat, lon: p.lng, il: nearestIl(p.lat, p.lng) });
          });
        } else marker.current.setLatLng([lat, lon]);
        onChangeRef.current({ lat, lon, il: nearestIl(lat, lon), label });
      };
      m.on("click", (e) => place(e.latlng.lat, e.latlng.lng));
      if (value) place(value.lat, value.lon, value.label);
      map.current = m;
      placeRef.current = place;
    })();
    return () => {
      alive = false;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- harita bir kez kurulur

  const placeAt = (lat: number, lon: number, label?: string) => {
    placeRef.current?.(lat, lon, label);
    map.current?.setView([lat, lon], 17);
  };

  async function search() {
    if (query.trim().length < 3) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=tr&accept-language=tr&q=${encodeURIComponent(query)}`
      );
      const [hit] = await r.json();
      if (!hit) setMsg("Adres bulunamadı; mahalle ve ilçeyle deneyin ya da haritada işaretleyin.");
      else placeAt(Number(hit.lat), Number(hit.lon), hit.display_name);
    } catch {
      setMsg("Arama şu an yapılamadı; haritada işaretleyebilirsiniz.");
    }
    setBusy(false);
  }

  function locate() {
    if (!navigator.geolocation) return setMsg("Tarayıcınız konum paylaşımını desteklemiyor.");
    setBusy(true);
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

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center rounded-xl border border-line bg-paper-raised focus-within:border-brand">
          <Search size={17} className="ml-3 text-slate" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
            placeholder="Adres, mahalle ya da site adı (ör. Beytepe, Çankaya)"
            className="w-full bg-transparent px-3 py-3 outline-none"
          />
          <button onClick={search} disabled={busy} className="mr-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper disabled:opacity-50">
            Bul
          </button>
        </div>
        <button onClick={locate} disabled={busy} className="flex items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-3 text-[13.5px] font-semibold text-ink hover:border-brand disabled:opacity-50">
          <Crosshair size={16} /> Konumumu bul
        </button>
      </div>
      {msg && <p className="mt-2 text-[12.5px] text-red-600">{msg}</p>}
      <div ref={box} className="relative z-0 mt-3 h-[320px] w-full overflow-hidden rounded-2xl border border-line sm:h-[380px]" />
      <p className="mt-2 text-[12.5px] text-slate">
        {value ? (
          <>
            <b className="text-ink">{value.il}</b> · iğneyi sürükleyerek tam çatınızın üzerine taşıyabilirsiniz.
          </>
        ) : (
          "Adresinizi arayın ya da haritada evinizin üzerine dokunun."
        )}
      </p>
    </div>
  );
}
