"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Phone, Send, X } from "lucide-react";
import { whatsappLink, SITE_URL } from "@/lib/data";
import { trackEvent } from "@/lib/track";
import { trackGa4Lead, trackGoogleAdsLead } from "@/lib/ga4";

type Msg = { role: "user" | "assistant"; text: string };

const WELCOME: Msg = {
  role: "assistant",
  text: "Merhaba! 👋 Aktürk Enerji canlı destek. Güneş paneli paketleri, fiyatlar veya kurulum hakkında sorunuzu yazabilirsiniz.",
};
const STORE_KEY = "akturk-chat";

// Mesajdaki bağlantıları tıklanabilir yapar.
function Linked({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target={p.startsWith(SITE_URL) ? undefined : "_blank"} rel="noopener noreferrer" className="break-all underline">
            {p.startsWith(SITE_URL) ? p.slice(SITE_URL.length) || "/" : p}
          </a>
        ) : (
          <span key={i}>{p.replace(/\*\*/g, "")}</span>
        )
      )}
    </>
  );
}

export default function LiveChat({ whatsappNumber, pathname }: { whatsappNumber: string; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<"closed" | "open" | "sent">("closed");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formErr, setFormErr] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-30)));
    } catch {}
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, form, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user" as const, text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    if (next.filter((m) => m.role === "user").length === 1) trackEvent("click", pathname, "live_chat_message");
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m.text !== WELCOME.text) }),
      });
      const j = await r.json();
      setMsgs([...next, { role: "assistant", text: j.text || j.error || "Bir sorun oluştu, lütfen tekrar deneyin." }]);
    } catch {
      setMsgs([...next, { role: "assistant", text: "Bağlantı sorunu oluştu. WhatsApp'tan yazarsanız hemen dönüş yapalım." }]);
    } finally {
      setBusy(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 10) {
      setFormErr("Lütfen adınızı ve telefon numaranızı girin.");
      return;
    }
    setFormErr("");
    const transcript = msgs
      .filter((m) => m.text !== WELCOME.text)
      .slice(-12)
      .map((m) => `${m.role === "user" ? "Müşteri" : "Asistan"}: ${m.text}`)
      .join("\n");
    const r = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        needType: "Canlı destek",
        fullname: name.trim(),
        phone: phone.trim(),
        source: "live_chat",
        formPage: pathname,
        notes: transcript ? `Canlı destek sohbeti:\n${transcript}` : "Canlı destekten arama talebi",
      }),
    }).catch(() => null);
    if (!r?.ok) {
      setFormErr("Gönderilemedi, lütfen tekrar deneyin ya da WhatsApp'tan yazın.");
      return;
    }
    trackGa4Lead("canli_destek");
    trackGoogleAdsLead();
    setForm("sent");
    setMsgs((m) => [...m, { role: "assistant", text: `Teşekkürler ${name.trim().split(" ")[0]}! Talebiniz bize ulaştı, uzmanımız en kısa sürede sizi arayacak. 📞` }]);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          // Sayfa değişse de sohbet aynı sekmede kaldığı yerden devam eder.
          try {
            const saved = sessionStorage.getItem(STORE_KEY);
            if (saved) setMsgs(JSON.parse(saved));
          } catch {}
          setOpen(true);
          trackEvent("click", pathname, "live_chat_open");
        }}
        aria-label="Canlı destek"
        className="flex items-center gap-2 rounded-full bg-sun px-5 py-3.5 text-ink shadow-[0_10px_32px_rgba(0,0,0,0.35)] ring-2 ring-ink/10 transition-transform hover:scale-105"
      >
        <Bot size={20} />
        <span className="whitespace-nowrap text-[14px] font-semibold">Canlı Destek</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] flex h-[min(600px,calc(100dvh-24px))] flex-col overflow-hidden rounded-2xl bg-paper text-ink shadow-[0_20px_60px_rgba(0,0,0,0.4)] ring-1 ring-ink/10 sm:inset-x-auto sm:bottom-7 sm:right-7 sm:w-[380px]">
      <div className="flex items-center gap-3 bg-ink px-4 py-3 text-paper">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sun text-ink">
          <Bot size={19} />
        </span>
        <div className="flex-1 leading-tight">
          <p className="text-[14.5px] font-semibold">Aktürk Enerji · Canlı Destek</p>
          <p className="text-[12px] text-paper/70">Yapay zekâ asistanı · uzmanımız arayabilir</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Kapat" className="rounded-full p-1.5 hover:bg-paper/15">
          <X size={18} />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[14px] leading-relaxed">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
            <p className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 ${m.role === "user" ? "rounded-br-sm bg-ink text-paper" : "rounded-bl-sm bg-ink/[0.06]"}`}>
              <Linked text={m.text} />
            </p>
          </div>
        ))}
        {busy && <p className="w-fit rounded-2xl rounded-bl-sm bg-ink/[0.06] px-3.5 py-2.5 text-ink/60">Yazıyor…</p>}

        {form === "open" && (
          <form onSubmit={submitLead} className="space-y-2 rounded-xl border border-ink/10 bg-white p-3">
            <p className="text-[13px] font-semibold">Uzmanımız sizi arasın</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Adınız Soyadınız" autoComplete="name" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-[14px] outline-none focus:border-ink/40" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefon (05xx xxx xx xx)" inputMode="tel" autoComplete="tel" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-[14px] outline-none focus:border-ink/40" />
            {formErr && <p className="text-[12.5px] text-red-600">{formErr}</p>}
            <p className="text-[11.5px] text-ink/55">Bilgileriniz yalnızca size dönüş yapmak için kullanılır.</p>
            <button type="submit" className="w-full rounded-lg bg-sun py-2.5 text-[14px] font-bold text-ink hover:bg-sun-soft">Gönder</button>
          </form>
        )}
      </div>

      <div className="flex gap-2 border-t border-ink/10 px-3 pt-2.5">
        {form !== "sent" && (
          <button type="button" onClick={() => setForm(form === "open" ? "closed" : "open")} className="flex items-center gap-1.5 rounded-full bg-ink/[0.06] px-3 py-1.5 text-[12.5px] font-semibold hover:bg-ink/10">
            <Phone size={14} /> Sizi arayalım
          </button>
        )}
        <a
          href={whatsappLink(whatsappNumber, `Merhaba, canlı destekten yazıyorum.\n\nSayfa: ${SITE_URL}${pathname}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#25D366]/15 px-3 py-1.5 text-[12.5px] font-semibold text-[#128C4A] hover:bg-[#25D366]/25"
        >
          WhatsApp
        </a>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 px-3 pb-3 pt-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Sorunuzu yazın…"
          maxLength={1500}
          className="flex-1 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-[14px] outline-none focus:border-ink/40"
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Gönder" className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper disabled:opacity-40">
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
