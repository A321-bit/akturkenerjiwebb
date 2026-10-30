"use client";

import { useEffect, useState } from "react";
import { ILLER } from "@/lib/il-konum";

// İl listesi sabit; ilçeler TKGM listesinden öneri olarak gelir, servis yanıt vermezse elle yazılır.

type Item = { id: number; ad: string };
const key = (s: string) => s.toLocaleUpperCase("tr-TR").trim();

export default function CustomerPlace({ province, district, onChange }: { province: string; district: string; onChange: (x: { province?: string; district?: string }) => void }) {
  const [iller, setIller] = useState<Item[]>([]);
  const [ilceler, setIlceler] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/admin/parsel?type=il")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.items && setIller(d.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const il = iller.find((x) => key(x.ad) === key(province));
    if (!il) return;
    let live = true;
    fetch(`/api/admin/parsel?type=ilce&id=${il.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d?.items && setIlceler(d.items))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [province, iller]);

  const field = "mt-1 w-full rounded-lg border border-line bg-paper-raised px-3 py-2 outline-none focus:border-brand";
  return (
    <>
      <label className="block">
        <span className="text-[12.5px] font-semibold text-slate">İl *</span>
        <select value={ILLER.some((i) => i.ad === province) ? province : ""} onChange={(e) => onChange({ province: e.target.value, district: "" })} className={field}>
          <option value="">İl seçin</option>
          {ILLER.map((i) => <option key={i.ad}>{i.ad}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-[12.5px] font-semibold text-slate">İlçe *</span>
        <input list="ilce-listesi" value={district} onChange={(e) => onChange({ district: e.target.value })} placeholder={province ? "İlçe yazın ya da seçin" : "Önce il seçin"} className={field} />
        <datalist id="ilce-listesi">{ilceler.map((x) => <option key={x.id} value={x.ad} />)}</datalist>
      </label>
    </>
  );
}
