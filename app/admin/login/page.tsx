"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("failed");
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Şifre hatalı.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">
        Aktürk Enerji
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
        Yönetim Paneli
      </h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre"
          autoFocus
          required
          className="min-h-[52px] rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:border-sun focus:ring-1 focus:ring-sun"
        />
        {error && <p className="text-[13px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold text-paper transition-colors hover:bg-sun hover:text-ink disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Giriş yapılıyor...
            </>
          ) : (
            "Giriş Yap"
          )}
        </button>
      </form>
    </div>
  );
}
