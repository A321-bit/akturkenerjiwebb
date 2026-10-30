"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Hash, LocateFixed, MapPin, Search } from "lucide-react";
import { parseCoordinates, type Parcel } from "@/lib/teklif/locate";
import type { LatLon } from "@/lib/teklif/geometry";

// Müşteri çatısını bulma: adres, koordinat (ya da Google Haritalar bağlantısı), ada/parsel.

type Item = { id: number; ad: string };
type Mode = "adres" | "koordinat" | "parsel";

const center = (ring: LatLon[]): LatLon => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];

async function list(type: string, id?: number): Promise<Item[]> {
  const r = await fetch(`/api/admin/parsel?type=${type}${id ? `&id=${id}` : ""}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error);
  return d.items;
}

export default function LocateBar({ onFocus, onParcel }: { onFocus: (c: LatLon, zoom: number) => void; onParcel: (p: Parcel | null) => void }) {
  const [mode, setMode] = useState<Mode>("adres");
  const [text, setText] = useState("");
  const [coord, setCoord] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [iller, setIller] = useState<Item[]>([]);
  const [ilceler, setIlceler] = useState<Item[]>([]);
  const [mahalleler, setMahalleler] = useState<Item[]>([]);
  const [il, setIl] = useState(0);
  const [ilce, setIlce] = useState(0);
  const [mahalle, setMahalle] = useState(0);
  const [ada, setAda] = useState("");
  const [parsel, setParsel] = useState("");

  useEffect(() => {
    if (mode !== "parsel" || iller.length) return;
    list("il")
      .then(setIller)
      .catch(() => setMsg({ ok: false, text: "TKGM servisine ulaşılamadı. Parsel Sorgu sitesinden koordinatı alıp Koordinat sekmesine yapıştırabilirsiniz." }));
  }, [mode, iller.length]);

  function pickIl(id: number) {
    setIl(id);
    setIlce(0);
    setMahalle(0);
    setIlceler([]);
    setMahalleler([]);
    if (id) list("ilce", id).then(setIlceler).catch(() => setMsg({ ok: false, text: "İlçeler alınamadı." }));
  }
  function pickIlce(id: number) {
    setIlce(id);
    setMahalle(0);
    setMahalleler([]);
    if (id) list("mahalle", id).then(setMahalleler).catch(() => setMsg({ ok: false, text: "Mahalleler alınamadı." }));
  }

  async function searchAddress() {
    if (text.trim().length < 3) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=tr&accept-language=tr&q=${encodeURIComponent(text)}`);
      const [hit] = await r.json();
      if (!hit) setMsg({ ok: false, text: "Adres bulunamadı. Mahalle ve ilçeyle yazın ya da koordinat veya ada/parsel kullanın." });
      else {
        onFocus([Number(hit.lat), Number(hit.lon)], 19);
        setMsg({ ok: true, text: `${hit.display_name}. Sonuç yaklaşıktır; çatıyı haritada doğrulayın.` });
      }
    } catch {
      setMsg({ ok: false, text: "Adres araması şu an yapılamadı. Koordinat ya da ada/parsel kullanın." });
    }
    setBusy(false);
  }

  async function searchCoord() {
    setMsg(null);
    const c = parseCoordinates(coord);
    if (!c) {
      setMsg({ ok: false, text: /goo\.gl/i.test(coord) ? "Kısa bağlantıda koordinat yok. Bağlantıyı tarayıcıda açıp adres çubuğundaki uzun adresi yapıştırın." : "Koordinat okunamadı. Örnek: 39.9208, 32.8541" });
      return;
    }
    onFocus(c, 20);
    setBusy(true);
    // Koordinattaki parsel de bulunursa ada/parsel bilgisi teklife eklenir; bulunamazsa konum yine geçerlidir.
    try {
      const r = await fetch(`/api/admin/parsel?type=nokta&lat=${c[0]}&lon=${c[1]}`);
      const d = await r.json();
      if (r.ok && d.ring?.length) {
        onParcel(d);
        setMsg({ ok: true, text: `Konum bulundu: ${d.mahalle} ${d.ada}/${d.parsel}. Parsel sınırı turuncu çizgidir.` });
      } else {
        onParcel(null);
        setMsg({ ok: true, text: "Konum bulundu. Bu nokta için parsel bilgisi gelmedi." });
      }
    } catch {
      onParcel(null);
      setMsg({ ok: true, text: "Konum bulundu. Parsel bilgisi alınamadı." });
    }
    setBusy(false);
  }

  async function searchParcel() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/parsel?type=parsel&mahalle=${mahalle}&ada=${ada.trim()}&parsel=${parsel.trim()}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (!d.ring?.length) throw new Error("Parsel sınırı gelmedi.");
      onParcel(d);
      onFocus(center(d.ring), 19);
      setMsg({ ok: true, text: `${d.mahalle} ${d.ada}/${d.parsel}${d.alanM2 ? ` · ${d.alanM2.toLocaleString("tr-TR")} m²` : ""}${d.nitelik ? ` · ${d.nitelik}` : ""}` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Parsel bulunamadı." });
    }
    setBusy(false);
  }

  const tabs: [Mode, string, React.ReactNode][] = [
    ["adres", "Adres", <Search key="a" size={14} />],
    ["koordinat", "Koordinat", <LocateFixed key="k" size={14} />],
    ["parsel", "Ada / parsel", <Hash key="p" size={14} />],
  ];
  const field = "rounded-lg border border-line bg-paper px-2.5 py-2 text-[13.5px] outline-none focus:border-brand";
  const go = "inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-paper hover:bg-brand-deep disabled:opacity-40";

  return (
    <div className="mb-3 rounded-2xl border border-line bg-paper-raised p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <MapPin size={15} className="text-brand" />
        <span className="mr-1 text-[13px] font-semibold">Çatıyı bul</span>
        {tabs.map(([k, label, icon]) => (
          <button key={k} onClick={() => { setMode(k); setMsg(null); }} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12.5px] font-semibold ${mode === k ? "border-ink bg-ink text-paper" : "border-line text-slate hover:border-ink"}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {mode === "adres" && (
          <>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchAddress()} placeholder="Mahalle, sokak, ilçe, il" className={`${field} min-w-[240px] flex-1`} />
            <button onClick={searchAddress} disabled={busy} className={go}>Bul</button>
          </>
        )}
        {mode === "koordinat" && (
          <>
            <input value={coord} onChange={(e) => setCoord(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchCoord()} placeholder={`39.9208, 32.8541 · 39°55'15"N 32°51'15"E · Google Haritalar bağlantısı`} className={`${field} min-w-[240px] flex-1`} />
            <button onClick={searchCoord} disabled={busy} className={go}>Bul</button>
          </>
        )}
        {mode === "parsel" && (
          <>
            <select value={il} onChange={(e) => pickIl(Number(e.target.value))} className={field} aria-label="İl">
              <option value={0}>İl</option>
              {iller.map((x) => <option key={x.id} value={x.id}>{x.ad}</option>)}
            </select>
            <select value={ilce} onChange={(e) => pickIlce(Number(e.target.value))} disabled={!il} className={field} aria-label="İlçe">
              <option value={0}>İlçe</option>
              {ilceler.map((x) => <option key={x.id} value={x.id}>{x.ad}</option>)}
            </select>
            <select value={mahalle} onChange={(e) => setMahalle(Number(e.target.value))} disabled={!ilce} className={field} aria-label="Mahalle">
              <option value={0}>Mahalle</option>
              {mahalleler.map((x) => <option key={x.id} value={x.id}>{x.ad}</option>)}
            </select>
            <input value={ada} onChange={(e) => setAda(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Ada" className={`${field} w-20`} />
            <input value={parsel} onChange={(e) => setParsel(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Parsel" className={`${field} w-20`} />
            <button onClick={searchParcel} disabled={busy || !mahalle || !ada || !parsel} className={go}>Bul</button>
            <a href="https://parselsorgu.tkgm.gov.tr/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
              Parsel Sorgu <ExternalLink size={12} />
            </a>
          </>
        )}
      </div>
      {msg && <p className={`mt-2 text-[12.5px] ${msg.ok ? "text-slate" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
