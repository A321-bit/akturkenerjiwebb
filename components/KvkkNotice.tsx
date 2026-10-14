import Link from "next/link";

// Telefon toplayan her formun altında KVKK aydınlatma yükümlülüğü için.
// Talebe dönüş için açık rıza gerekmediğinden onay kutusu konmadı.
export default function KvkkNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-[12px] leading-snug text-slate ${className}`}>
      Bilgileriniz yalnızca talebinize dönüş için kullanılır.{" "}
      <Link href="/kvkk-aydinlatma-metni" target="_blank" className="underline hover:text-ink">
        KVKK Aydınlatma Metni
      </Link>
    </p>
  );
}
