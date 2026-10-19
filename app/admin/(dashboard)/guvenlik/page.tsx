"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

type Status = {
  totpEnabled: boolean;
  backupCodesLeft: number;
  customPassword: boolean;
  sessions: { id: string; created_at: string; expires_at: string; ip: string | null; user_agent: string | null; current: boolean }[];
  attempts: { at: string; ip: string | null; success: boolean; reason: string | null }[];
};

const when = (iso: string) => new Date(iso).toLocaleString("tr-TR");
const device = (ua: string | null) => {
  if (!ua) return "Bilinmeyen cihaz";
  const os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : "Diğer";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Tarayıcı";
  return `${br} · ${os}`;
};

// Admin → Güvenlik: iki adımlı doğrulama, şifre değiştirme, oturumlar, giriş geçmişi.
export default function SecurityPage() {
  const [s, setS] = useState<Status | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState<string[] | null>(null);
  const [pw, setPw] = useState({ current: "", code: "", next: "", again: "" });
  const [dis, setDis] = useState({ password: "", code: "" });

  const load = useCallback(() => {
    fetch("/api/admin/security")
      .then((r) => r.json())
      .then(setS);
  }, []);
  useEffect(load, [load]);

  async function post(body: object) {
    setMsg("");
    setErr("");
    const res = await fetch("/api/admin/security", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "İşlem yapılamadı.");
      return null;
    }
    load();
    return data;
  }

  const card = "rounded-2xl border border-line bg-paper-raised p-5";
  const btn = "rounded-full bg-ink px-4 py-2 text-[13.5px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-40";
  const btn2 = "rounded-full border border-line px-4 py-2 text-[13.5px] font-semibold hover:border-ink";

  if (!s) return <p className="text-[13.5px] text-slate">Yükleniyor…</p>;

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Güvenlik</h1>
        <p className="mt-1 text-[13.5px] text-slate">
          Aynı IP&apos;den 30 dakikada 5 hatalı denemede o IP 30 dakika engellenir; tüm dünyadan 1 saatte 30 hatalı denemede giriş 1
          saat kilitlenir. Her girişte ve kilitlenmede e-posta gönderilir.
        </p>
      </div>

      {(msg || err) && <p className={`rounded-xl px-4 py-3 text-[13.5px] ${err ? "bg-red-50 text-red-700" : "bg-paper-raised text-volt"}`}>{err || msg}</p>}

      <section className={card}>
        <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold">
          {s.totpEnabled ? <ShieldCheck size={18} className="text-volt" /> : <ShieldAlert size={18} className="text-red-600" />}
          İki adımlı doğrulama {s.totpEnabled ? "açık" : "kapalı"}
        </h2>

        {backup && (
          <div className="mt-4 rounded-xl border-2 border-sun bg-sun/10 p-4">
            <p className="text-[13.5px] font-semibold">Yedek kodlarınız (yalnızca şimdi gösterilir):</p>
            <p className="mt-1 text-[12.5px] text-slate">Telefonunuz kaybolursa bu kodlarla girersiniz; her kod bir kez kullanılır. Yazdırıp güvenli bir yerde saklayın.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[15px] sm:grid-cols-5">
              {backup.map((c) => (
                <span key={c} className="rounded bg-paper px-2 py-1 text-center">
                  {c}
                </span>
              ))}
            </div>
            <button type="button" className={`${btn2} mt-3`} onClick={() => setBackup(null)}>
              Kaydettim, kapat
            </button>
          </div>
        )}

        {!s.totpEnabled && !setup && (
          <>
            <p className="mt-2 text-[13.5px] text-slate">
              Açtığınızda girişte şifreye ek olarak telefonunuzdaki 6 haneli kod istenir. Şifre ele geçirilse bile kod olmadan girilemez.
              Telefona <strong>Google Authenticator</strong> ya da <strong>Microsoft Authenticator</strong> yükleyin.
            </p>
            <button
              type="button"
              className={`${btn} mt-3`}
              onClick={async () => {
                const d = await post({ action: "totp-start" });
                if (d) setSetup(d);
              }}
            >
              Kurulumu başlat
            </button>
          </>
        )}

        {!s.totpEnabled && setup && (
          <div className="mt-3 grid gap-4 sm:grid-cols-[240px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt="Authenticator karekodu" width={240} height={240} className="rounded-lg border border-line" />
            <div className="flex flex-col gap-2 text-[13.5px]">
              <p>1. Authenticator uygulamasında <strong>+</strong> → <strong>QR kodu tara</strong> ile soldaki karekodu okutun.</p>
              <p className="text-[12.5px] text-slate">
                Tarayamıyorsanız anahtarı elle girin: <code className="break-all">{setup.secret}</code>
              </p>
              <p>2. Uygulamada beliren 6 haneli kodu yazın:</p>
              <div className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="123456" className="admin-input w-36 tracking-[0.2em]" />
                <button
                  type="button"
                  className={btn}
                  onClick={async () => {
                    const d = await post({ action: "totp-confirm", code });
                    if (d) {
                      setBackup(d.backupCodes);
                      setSetup(null);
                      setCode("");
                      setMsg("İki adımlı doğrulama açıldı.");
                    }
                  }}
                >
                  Doğrula ve aç
                </button>
              </div>
            </div>
          </div>
        )}

        {s.totpEnabled && (
          <div className="mt-3 flex flex-col gap-2 text-[13.5px]">
            <p className="text-slate">Kalan yedek kod: {s.backupCodesLeft}</p>
            <details>
              <summary className="cursor-pointer text-slate">İki adımlı doğrulamayı kapat</summary>
              <div className="mt-2 flex flex-wrap gap-2">
                <input type="password" value={dis.password} onChange={(e) => setDis({ ...dis, password: e.target.value })} placeholder="Şifre" className="admin-input w-48" />
                <input value={dis.code} onChange={(e) => setDis({ ...dis, code: e.target.value })} placeholder="Kod" className="admin-input w-32" />
                <button
                  type="button"
                  className={btn2}
                  onClick={async () => {
                    if (!confirm("İki adımlı doğrulama kapatılsın mı? Panel daha az güvenli olur.")) return;
                    if (await post({ action: "totp-disable", ...dis })) setMsg("İki adımlı doğrulama kapatıldı.");
                    setDis({ password: "", code: "" });
                  }}
                >
                  Kapat
                </button>
              </div>
            </details>
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className="font-display text-[17px] font-semibold">Şifreyi değiştir</h2>
        <p className="mt-1 text-[13px] text-slate">
          En az 12 karakter; küçük harf, büyük harf, rakam ve sembolden en az üçü. Değişince bu cihaz dışındaki tüm oturumlar kapanır.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="Mevcut şifre" autoComplete="current-password" className="admin-input" />
          {s.totpEnabled ? (
            <input value={pw.code} onChange={(e) => setPw({ ...pw, code: e.target.value })} placeholder="Doğrulama kodu" className="admin-input" />
          ) : (
            <span />
          )}
          <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="Yeni şifre" autoComplete="new-password" className="admin-input" />
          <input type="password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} placeholder="Yeni şifre (tekrar)" autoComplete="new-password" className="admin-input" />
        </div>
        <button
          type="button"
          disabled={!pw.current || !pw.next || pw.next !== pw.again}
          className={`${btn} mt-3`}
          onClick={async () => {
            if (await post({ action: "password", current: pw.current, code: pw.code, next: pw.next })) {
              setMsg("Şifre değiştirildi; diğer oturumlar kapatıldı.");
              setPw({ current: "", code: "", next: "", again: "" });
            }
          }}
        >
          Şifreyi değiştir
        </button>
        {pw.next && pw.again && pw.next !== pw.again && <p className="mt-2 text-[12.5px] text-red-600">Yeni şifreler aynı değil.</p>}
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-[17px] font-semibold">Açık oturumlar ({s.sessions.length})</h2>
          <span className="flex-1" />
          {s.sessions.length > 1 && (
            <button
              type="button"
              className={btn2}
              onClick={async () => {
                if (await post({ action: "revoke-others" })) setMsg("Bu cihaz dışındaki tüm oturumlar kapatıldı.");
              }}
            >
              Diğer tüm oturumları kapat
            </button>
          )}
        </div>
        <ul className="mt-3 divide-y divide-line text-[13.5px]">
          {s.sessions.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="font-medium">{device(x.user_agent)}</span>
              <span className="text-slate">{x.ip}</span>
              <span className="text-slate">açılış {when(x.created_at)}</span>
              {x.current ? (
                <span className="rounded-full bg-volt/15 px-2 py-0.5 text-[12px]">bu cihaz</span>
              ) : (
                <button type="button" className="text-red-600 hover:underline" onClick={() => post({ action: "revoke", id: x.id })}>
                  Kapat
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="font-display text-[17px] font-semibold">Son giriş denemeleri</h2>
        <ul className="mt-3 divide-y divide-line text-[13px]">
          {s.attempts.map((a, i) => (
            <li key={i} className="flex flex-wrap gap-3 py-1.5">
              <span className={a.success ? "font-semibold text-volt" : "font-semibold text-red-600"}>{a.success ? "Başarılı" : "Hatalı"}</span>
              <span className="text-slate">{when(a.at)}</span>
              <span className="text-slate">{a.ip}</span>
              <span className="text-slate-soft">{a.reason}</span>
            </li>
          ))}
          {!s.attempts.length && <li className="py-1.5 text-slate">Kayıt yok.</li>}
        </ul>
      </section>
    </div>
  );
}
