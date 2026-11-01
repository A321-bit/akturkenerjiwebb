"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { captureClickId } from "@/lib/attribution";
import { CONSENT_EVENT, CONSENT_OPEN_EVENT, openConsentSettings, readConsent, readConsentRaw, saveConsent } from "@/lib/consent";
import { trackEvent } from "@/lib/track";

function subscribe(cb: () => void) {
  window.addEventListener(CONSENT_EVENT, cb);
  return () => window.removeEventListener(CONSENT_EVENT, cb);
}

// Reddetmek kabul etmek kadar kolay olmalı; kutular işaretsiz başlar.
export default function CookieConsent() {
  const pathname = usePathname();
  const stored = useSyncExternalStore(subscribe, readConsentRaw, () => "sunucu");
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const reopen = () => {
      const c = readConsent();
      setAnalytics(Boolean(c?.analytics));
      setMarketing(Boolean(c?.marketing));
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  if (pathname?.startsWith("/admin") || (stored !== null && !open)) return null;

  function choose(a: boolean, m: boolean) {
    setOpen(false);
    trackEvent("click", pathname ?? "/", `cerez_tercih:analitik_${a ? 1 : 0}:pazarlama_${m ? 1 : 0}`);
    saveConsent(a, m);
    if (m) captureClickId();
  }

  const btn = "min-h-[42px] flex-1 rounded-lg px-3 text-[13.5px] font-semibold";
  return (
    <div role="dialog" aria-label="Çerez tercihleri" className="fixed inset-x-0 bottom-0 z-[10000] p-3 print:hidden sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl bg-ink p-4 text-paper shadow-[0_12px_40px_rgba(0,0,0,0.4)] sm:p-5">
        <p className="text-[13.5px] leading-relaxed text-paper/90">
          Sitenin çalışması için gerekli olanlar dışında, siteyi iyileştirmek ve reklamlarımızı ölçmek için çerez kullanmak istiyoruz. Onay vermezseniz bu çerezler kullanılmaz.{" "}
          <Link href="/cerez-politikasi" className="underline">Çerez Politikası</Link>
        </p>
        {details && (
          <div className="mt-3 space-y-2 text-[13px]">
            <p className="rounded-lg bg-paper/10 px-3 py-2"><b>Zorunlu:</b> tercihinizin saklanması ve site güvenliği. Her zaman açıktır.</p>
            <label className="flex items-start gap-2.5 rounded-lg bg-paper/10 px-3 py-2">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-0.5" />
              <span><b>Analiz:</b> Google Analytics ve Microsoft Clarity ile sitenin nasıl kullanıldığının ölçülmesi.</span>
            </label>
            <label className="flex items-start gap-2.5 rounded-lg bg-paper/10 px-3 py-2">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5" />
              <span><b>Pazarlama:</b> Google Ads ve Meta Pikseli ile reklam ölçümü ve size uygun reklam gösterimi.</span>
            </label>
          </div>
        )}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button onClick={() => choose(false, false)} className={`${btn} bg-paper/15 hover:bg-paper/25`}>Yalnızca zorunlu</button>
          {details ? (
            <button onClick={() => choose(analytics, marketing)} className={`${btn} bg-paper/15 hover:bg-paper/25`}>Seçimimi kaydet</button>
          ) : (
            <button onClick={() => setDetails(true)} className={`${btn} bg-paper/15 hover:bg-paper/25`}>Tercihleri yönet</button>
          )}
          <button onClick={() => choose(true, true)} className={`${btn} bg-paper/15 hover:bg-paper/25`}>Tümünü kabul et</button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      Çerez Tercihleri
    </button>
  );
}
