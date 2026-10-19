"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

// İki adımlı giriş: önce şifre; iki adımlı doğrulama açıksa telefondaki
// 6 haneli kod (ya da yedek kod) istenir.
export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code: needCode ? code : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.href = "/admin";
        return;
      }
      if (data.needCode && !needCode) {
        setNeedCode(true);
      } else {
        setError(data.error ?? "Giriş yapılamadı.");
        if (needCode) setCode("");
      }
    } catch {
      setError("Bağlantı hatası.");
    }
    setLoading(false);
  }

  const input =
    "min-h-[52px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:border-sun focus:ring-1 focus:ring-sun";

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Aktürk Enerji</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">Yönetim Paneli</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre"
          autoComplete="current-password"
          autoFocus={!needCode}
          required
          readOnly={needCode}
          className={`${input} ${needCode ? "opacity-60" : ""}`}
        />
        {needCode && (
          <>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Doğrulama kodu (6 hane) ya da yedek kod"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              className={`${input} tracking-[0.2em]`}
            />
            <p className="text-[12.5px] text-slate">Telefonunuzdaki Authenticator uygulamasında &quot;Aktürk Enerji&quot; satırındaki kodu girin.</p>
          </>
        )}
        {error && <p className="text-[13px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper transition-colors hover:bg-sun hover:text-ink disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Kontrol ediliyor...
            </>
          ) : needCode ? (
            "Doğrula ve Giriş Yap"
          ) : (
            "Giriş Yap"
          )}
        </button>
      </form>
    </div>
  );
}
