import Link from "next/link";
import { Calculator } from "lucide-react";

// Off grid paket hesaplama aracına giriş kutusu (mağaza ana sayfası ve Off Grid kategorisi).
export default function CalculatorCta() {
  return (
    <Link
      href="/magaza/off-grid-hesaplama"
      className="group flex items-center gap-4 rounded-2xl border border-sun/50 bg-sun/10 p-4 transition-colors hover:border-sun sm:p-5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sun">
        <Calculator size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] font-semibold text-ink">Şebekeniz yok mu? Size yetecek paketi ücretsiz hesaplayın</span>
        <span className="block text-[13.5px] text-slate">
          Bağ evi, yayla evi ya da çiftlik için cihazlarınızı seçin; günlük tüketiminizi, panel ve batarya ihtiyacınızı ve uygun off grid
          paketi hemen görün.
        </span>
      </span>
      <span className="hidden rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper group-hover:bg-sun group-hover:text-ink sm:block">
        Paket Hesapla
      </span>
    </Link>
  );
}
