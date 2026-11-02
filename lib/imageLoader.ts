// Vercel'in görsel optimizasyonu kotası dolunca tüm görseller 402 veriyordu;
// bunun yerine görseller Supabase'e önceden sıkıştırılmış WebP olarak
// yükleniyor (scripts/ ile üretilen "-opt.webp" tam boy + "-opt-800.webp"
// küçük kopya). Bu loader, next/image'ın istediği genişliğe göre uygun
// kopyayı seçer; böylece telefonlar ve kartlar küçük dosyayı indirir.
const SUPABASE_MEDIA = "https://tzibyocqotqcowebswlq.supabase.co/storage/v1/object/public/media/";

/**
 * Supabase görselini Vercel CDN'den geçen /gorsel yoluna çevirir (next.config rewrite). Aynı dosya
 * Supabase'den yalnızca bir kez iner; ücretsiz plandaki aylık 5 GB veri çıkışı görsellere harcanmaz.
 */
export const cdnImage = (src: string) => (src.startsWith(SUPABASE_MEDIA) ? `/gorsel/${src.slice(SUPABASE_MEDIA.length)}` : src);

export default function imageLoader({ src, width }: { src: string; width: number }) {
  // Telefonlar (3x ekranda ~1170 px'e kadar) küçük kopyayı indirir: LCP için en büyük kazanç.
  if (src.endsWith("-opt.webp") && width <= 1200) {
    return cdnImage(src.replace(/-opt\.webp$/, "-opt-800.webp"));
  }
  return cdnImage(src);
}
