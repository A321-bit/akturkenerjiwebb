// Vercel'in görsel optimizasyonu kotası dolunca tüm görseller 402 veriyordu;
// bunun yerine görseller Supabase'e önceden sıkıştırılmış WebP olarak
// yükleniyor (scripts/ ile üretilen "-opt.webp" tam boy + "-opt-800.webp"
// küçük kopya). Bu loader, next/image'ın istediği genişliğe göre uygun
// kopyayı seçer; böylece telefonlar ve kartlar küçük dosyayı indirir.
export default function imageLoader({ src, width }: { src: string; width: number }) {
  // Telefonlar (3x ekranda ~1170 px'e kadar) küçük kopyayı indirir: LCP için en büyük kazanç.
  if (src.endsWith("-opt.webp") && width <= 1200) {
    return src.replace(/-opt\.webp$/, "-opt-800.webp");
  }
  return src;
}
