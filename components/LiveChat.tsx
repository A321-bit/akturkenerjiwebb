"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { whatsappLink, SITE_URL } from "@/lib/data";
import { trackEvent } from "@/lib/track";
import { trackGa4Lead, trackGoogleAdsLead } from "@/lib/ga4";

type Msg = { role: "user" | "assistant"; text: string };
type Session = { id: number; sig: string };

const WELCOME: Msg = {
  role: "assistant",
  text: "Merhaba! 👋 Aktürk Enerji canlı destek. Güneş paneli paketleri, fiyatlar veya kurulum hakkında sorunuzu yazabilirsiniz.",
};
const STORE_KEY = "akturk-chat";

// Mesajdaki bağlantıları tıklanabilir yapar.
function Linked({ text }: { text: string }) {
  const parts = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1: $2").split(/(https?:\/\/[^\s)]+)/g);
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

// Müşteri ilk mesajını yazınca ad + telefon istenir; bilgiler girilince sohbet
// admin → Talepler → Canlı Destek'e kaydedilir ve her mesajda döküm güncellenir.
export default function LiveChat({ whatsappNumber, pathname }: { whatsappNumber: string; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [session, setSession] = useState<Session | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState<"" | "Bey" | "Hanım">("");
  const [phone, setPhone] = useState("");
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const userCount = msgs.filter((m) => m.role === "user").length;
  const needContact = !session && userCount > 0;
  const history = (list: Msg[]) => list.filter((m) => m.text !== WELCOME.text);

  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ msgs: msgs.slice(-30), session }));
    } catch {}
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, session, open, busy]);

  async function ask(next: Msg[], s: Session | null) {
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history(next), session: s }),
        signal: AbortSignal.timeout(65000),
      });
      const j = await r.json();
      setMsgs([...next, { role: "assistant", text: j.text || j.error || "Bir sorun oluştu, lütfen tekrar deneyin." }]);
    } catch {
      setMsgs([...next, { role: "assistant", text: "Bağlantı sorunu oluştu. WhatsApp'tan yazarsanız hemen dönüş yapalım." }]);
    } finally {
      setBusy(false);
    }
  }

  function send() {
    const text = input.trim();
    if (!text || busy || needContact) return;
    const next = [...msgs, { role: "user" as const, text }];
    setMsgs(next);
    setInput("");
    if (userCount === 0) trackEvent("click", pathname, "live_chat_message");
    ask(next, session);
  }

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 10 || !title) {
      setFormErr(title ? "Lütfen adınızı ve telefon numaranızı girin." : "Lütfen size nasıl hitap edelim seçin (Bey / Hanım).");
      return;
    }
    setFormErr("");
    setSaving(true);
    const r = await fetch("/api/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${name.trim()} (${title})`, phone: phone.trim(), page: pathname, messages: history(msgs) }),
    }).catch(() => null);
    setSaving(false);
    const j = r?.ok ? await r.json() : null;
    if (!j?.id) {
      setFormErr("Kaydedilemedi, lütfen tekrar deneyin ya da WhatsApp'tan yazın.");
      return;
    }
    trackGa4Lead("canli_destek");
    trackGoogleAdsLead();
    setSession({ id: j.id, sig: j.sig });
    setMsgs((m) => [...m, { role: "assistant", text: `Teşekkürler ${name.trim().split(" ")[0]} ${title}! Sorularınızı yazmaya devam edebilirsiniz; uzmanımız da en kısa sürede sizi arayacak. 📞` }]);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          // Sayfa değişse de sohbet aynı sekmede kaldığı yerden devam eder.
          try {
            const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || "null");
            if (saved?.msgs) setMsgs(saved.msgs);
            if (saved?.session) setSession(saved.session);
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

        {needContact && !busy && (
          <form onSubmit={submitContact} className="space-y-2 rounded-xl border border-sun/50 bg-white p-3">
            <p className="text-[13px] font-semibold">Size daha iyi yardımcı olabilmemiz için adınızı ve telefonunuzu yazın</p>
            <div className="flex gap-2">
              {(["Bey", "Hanım"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTitle(t)} aria-pressed={title === t} className={`flex-1 rounded-lg border py-2 text-[14px] font-semibold ${title === t ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/70 hover:border-ink/40"}`}>
                  {t}
                </button>
              ))}
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Adınız Soyadınız" autoComplete="name" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-[14px] outline-none focus:border-ink/40" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefon (05xx xxx xx xx)" inputMode="tel" autoComplete="tel" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-[14px] outline-none focus:border-ink/40" />
            {formErr && <p className="text-[12.5px] text-red-600">{formErr}</p>}
            <p className="text-[11.5px] text-ink/55">Bilgileriniz yalnızca size dönüş yapmak için kullanılır.</p>
            <button type="submit" disabled={saving} className="w-full rounded-lg bg-sun py-2.5 text-[14px] font-bold text-ink hover:bg-sun-soft disabled:opacity-60">
              {saving ? "Kaydediliyor…" : "Sohbete devam et"}
            </button>
          </form>
        )}
      </div>

      <div className="flex gap-2 border-t border-ink/10 px-3 pt-2.5">
        <a
          href={whatsappLink(whatsappNumber, `Merhaba, canlı destekten yazıyorum.\n\nSayfa: ${SITE_URL}${pathname}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#25D366]/15 px-3 py-1.5 text-[12.5px] font-semibold text-[#128C4A] hover:bg-[#25D366]/25"
        >
          WhatsApp&apos;tan yazın
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
          placeholder={needContact ? "Önce adınızı ve telefonunuzu yazın" : "Sorunuzu yazın…"}
          disabled={needContact}
          maxLength={1500}
          className="flex-1 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-[14px] outline-none focus:border-ink/40 disabled:bg-ink/[0.04]"
        />
        <button type="submit" disabled={busy || needContact || !input.trim()} aria-label="Gönder" className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper disabled:opacity-40">
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
