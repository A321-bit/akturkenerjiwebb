"use client";

import { useCallback, useEffect, useState } from "react";

// Personel girişi ve yetkileri: rol hazır gelir, her yetki ayrıca açılıp kapatılır. Yalnız sahip görür.

type Perms = { cost: boolean; rules: boolean; allCustomers: boolean; dashboard: boolean };
type Row = { id: number; full_name: string; title: string | null; email: string | null; active: boolean; hasLogin: boolean; perms: Perms };

const LABELS: [keyof Perms, string][] = [
  ["cost", "Maliyet ve kârı görür"],
  ["rules", "Fiyat kurallarını değiştirir"],
  ["allCustomers", "Tüm müşterileri görür"],
  ["dashboard", "Şirket özetini görür"],
];
const PRESETS: Record<string, Perms> = {
  Satış: { cost: false, rules: false, allCustomers: false, dashboard: false },
  Mühendis: { cost: false, rules: false, allCustomers: true, dashboard: false },
  Yönetici: { cost: true, rules: true, allCustomers: true, dashboard: true },
};

export default function StaffAccess() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pw, setPw] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    fetch("/api/admin/staff-access")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setRows(d))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function save(id: number, body: object, ok?: string) {
    const r = await fetch("/api/admin/staff-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? (ok ?? "Kaydedildi.") : (d.error ?? "Kaydedilemedi."));
    if (r.ok) load();
  }

  if (!rows) return null;
  return (
    <section className="mt-4 rounded-2xl border border-line bg-paper-raised p-4">
      <h3 className="font-semibold">Personel girişleri ve yetkiler</h3>
      <p className="text-[12.5px] text-slate">Personel, e-postası ve burada verdiğiniz şifreyle girer. Kimin neyi göreceğini siz seçersiniz. Personel; mağaza, reklam, güvenlik ve ayar sayfalarına giremez. Sahip girişiniz değişmez.</p>
      {msg && <p className="mt-2 text-[13px] font-semibold text-brand">{msg}</p>}
      {rows.length === 0 && <p className="mt-2 text-[13px] text-slate">Önce yukarıdan personel ekleyin.</p>}
      <div className="mt-3 space-y-3">
        {rows.map((s) => (
          <div key={s.id} className={`rounded-xl border border-line p-3 ${s.active ? "" : "opacity-60"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{s.full_name}{s.title ? <span className="font-normal text-slate"> · {s.title}</span> : null} {s.hasLogin ? <span className="ml-1 rounded-full bg-volt/15 px-2 py-0.5 text-[11px] font-semibold text-volt">Girişi var</span> : <span className="ml-1 rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-slate">Girişi yok</span>}</p>
              <label className="flex items-center gap-1.5 text-[12.5px]"><input type="checkbox" checked={s.active} onChange={(e) => save(s.id, { active: e.target.checked })} /> Etkin</label>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input defaultValue={s.email ?? ""} onBlur={(e) => e.target.value.trim() !== (s.email ?? "") && save(s.id, { email: e.target.value })} placeholder="Giriş e-postası" type="email" autoComplete="off" className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13px]" />
              <input value={pw[s.id] ?? ""} onChange={(e) => setPw({ ...pw, [s.id]: e.target.value })} placeholder={s.hasLogin ? "Yeni şifre (en az 10 karakter)" : "Şifre (en az 10 karakter)"} type="password" autoComplete="new-password" className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13px]" />
              <button disabled={!pw[s.id] || !s.email} onClick={() => save(s.id, { password: pw[s.id] }, "Şifre kaydedildi.").then(() => setPw({ ...pw, [s.id]: "" }))} className="rounded-lg bg-ink px-3 py-1.5 text-[13px] font-semibold text-paper disabled:opacity-40">Şifreyi kaydet</button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
              <select aria-label="Hazır rol" value="" onChange={(e) => e.target.value && save(s.id, { perms: PRESETS[e.target.value] })} className="rounded-lg border border-line bg-paper px-2 py-1 text-[12.5px]">
                <option value="">Hazır rol uygula</option>
                {Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}
              </select>
              {LABELS.map(([k, label]) => (
                <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={s.perms[k]} disabled={!s.hasLogin || (k === "rules" && !s.perms.cost)} onChange={(e) => save(s.id, { perms: { [k]: e.target.checked } })} /> {label}</label>
              ))}
              {s.hasLogin && <button onClick={() => confirm(`${s.full_name} için giriş kaldırılsın mı?`) && save(s.id, { removeLogin: true }, "Giriş kaldırıldı.")} className="text-[12.5px] font-semibold text-red-600">Girişi kaldır</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
