"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { resolveAddress, suggestAddresses, type AddressHit } from "@/lib/adres-arama";

// Yazıldıkça adres önerir (navigasyon uygulamaları gibi); seçim yapılınca koordinatı verir.

export default function AddressSearch({ onPick, placeholder, className }: { onPick: (lat: number, lon: number, label: string) => void; placeholder?: string; className?: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<AddressHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [msg, setMsg] = useState<string | null>(null);
  const skip = useRef(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const text = q.trim();
    if (text.length < 3) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      suggestAddresses(text, ctl.signal)
        .then((list) => {
          setHits(list);
          setActive(-1);
          setOpen(true);
          setMsg(list.length ? null : "Sonuç bulunamadı; mahalle ve ilçeyle deneyin ya da haritada işaretleyin.");
        })
        .catch(() => {
          if (!ctl.signal.aborted) setMsg("Arama şu an yapılamadı; haritada işaretleyebilirsiniz.");
        });
    }, 300);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  async function pick(hit: AddressHit) {
    const label = [hit.title, hit.subtitle].filter(Boolean).join(", ");
    skip.current = true;
    setQ(label);
    setOpen(false);
    setHits([]);
    const at = await resolveAddress(hit).catch(() => null);
    if (at) onPick(at.lat, at.lon, label);
    else setMsg("Bu adresin konumu alınamadı; başka bir sonuç seçin ya da haritada işaretleyin.");
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && hits.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % hits.length);
    } else if (e.key === "ArrowUp" && hits.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? hits.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hits.length) pick(hits[Math.max(active, 0)]);
    } else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={box} className={`relative ${className ?? ""}`}>
      <div className="flex items-center rounded-xl border border-line bg-paper-raised focus-within:border-brand">
        <Search size={17} className="ml-3 shrink-0 text-slate" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (e.target.value.trim().length < 3) {
              setHits([]);
              setOpen(false);
              setMsg(null);
            }
          }}
          onFocus={() => hits.length && setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder ?? "Adres, sokak ya da site adı yazın"}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="adres-onerileri"
          aria-autocomplete="list"
          className="w-full bg-transparent px-3 py-3 text-[16px] outline-none"
        />
      </div>
      {open && hits.length > 0 && (
        <ul id="adres-onerileri" role="listbox" className="absolute left-0 right-0 top-full z-[1100] mt-1 max-h-[320px] overflow-auto rounded-xl border border-line bg-paper-raised py-1 shadow-xl">
          {hits.map((h, i) => (
            <li key={h.id} role="option" aria-selected={i === active}>
              <button type="button" onClick={() => pick(h)} onMouseEnter={() => setActive(i)} className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left ${i === active ? "bg-brand/10" : ""}`}>
                <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-ink">{h.title}</span>
                  {h.subtitle && <span className="block truncate text-[12.5px] text-slate">{h.subtitle}</span>}
                </span>
              </button>
            </li>
          ))}
          {hits[0].source === "google" && <li className="px-3 pb-1 pt-1.5 text-right text-[11px] text-slate">powered by Google</li>}
        </ul>
      )}
      {msg && <p className="mt-2 text-[12.5px] text-red-600">{msg}</p>}
    </div>
  );
}
