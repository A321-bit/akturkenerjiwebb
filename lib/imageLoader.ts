// Vercel'in görsel optimizasyonu kotası dolunca tüm görseller 402 veriyordu;
// bunun yerine görseller Supabase'e önceden sıkıştırılmış WebP olarak
// yükleniyor (scripts/ ile üretilen "-opt.webp" tam boy + "-opt-800.webp"
// küçük kopya). Bu loader, next/image'ın istediği genişliğe göre uygun
// kopyayı seçer; böylece telefonlar ve kartlar küçük dosyayı indirir.
export default function imageLoader({ src, width }: { src: string; width: number }) {
  if (src.endsWith("-opt.webp") && width <= 828) {
    return src.replace(/-opt\.webp$/, "-opt-800.webp");
  }
  return src;
}
