import type { NextConfig } from "next";

// Alan adı 2013–2018 arasında eski bir sitede kullanılıyordu; o sitenin
// Internet Archive'da görülen adresleri 404 veriyordu. Dış linklerin ve
// eski dizin kayıtlarının değeri kaybolmasın diye konusu en yakın yeni
// sayfaya kalıcı yönlendirme yapılır. Eski admin (/ynt/...) bilerek 404 kalır.
const LEGACY_REDIRECTS: [string, string][] = [
  ["/anasayfa.html", "/"],
  ["/default.asp", "/"],
  ["/ankara-gunes-paneli", "/"],
  ["/gunes-enerjisi", "/hizmetlerimiz"],
  ["/gunes-enerjisi.html", "/hizmetlerimiz"],
  ["/gunes-enerjisi-hizmetleri.html", "/hizmetlerimiz"],
  ["/faaliyetlerimiz.html", "/hizmetlerimiz"],
  ["/gunes-enerji-santralleri", "/hizmetlerimiz"],
  ["/gunes-enerji-santralleri.html", "/hizmetlerimiz"],
  ["/:slug(hizmet[0-9]+\\.html)", "/hizmetlerimiz"],
  ["/cati-uzeri-ges", "/hizmetlerimiz/villa-cati-ges"],
  ["/cati-uzeri-ges.html", "/hizmetlerimiz/villa-cati-ges"],
  ["/solar-villa-projeleri", "/hizmetlerimiz/villa-cati-ges"],
  ["/solar-villa-projeleri.html", "/hizmetlerimiz/villa-cati-ges"],
  ["/solar-konut-projeleri", "/hizmetlerimiz/villa-cati-ges"],
  ["/solar-konut-projeleri.html", "/hizmetlerimiz/villa-cati-ges"],
  ["/10-kw-sebeke-baglantili-gunes-enerjisi-sistemi.html", "/hizmetlerimiz/villa-cati-ges"],
  ["/5-kw-on-grid-sebeke-baglantili-gunes-enerji-sistemi.html", "/hizmetlerimiz/villa-cati-ges"],
  ["/on-grid-sistemler-sebeke-baglantili.html", "/hizmetlerimiz/villa-cati-ges"],
  ["/ongrid-sebeke-baglantili-elektrik-uretimi-solar-paketler.html", "/hizmetlerimiz/villa-cati-ges"],
  ["/off-grid-sistemler-akulu.html", "/hizmetlerimiz/off-grid-sebekeden-bagimsiz"],
  ["/:slug(solar-paket.*)", "/hizmetlerimiz/off-grid-sebekeden-bagimsiz"],
  ["/solar-jenerator.html", "/hizmetlerimiz/off-grid-sebekeden-bagimsiz"],
  ["/solar-lambalar.html", "/hizmetlerimiz/off-grid-sebekeden-bagimsiz"],
  ["/:slug(jel-aku.*)", "/hizmetlerimiz/lityum-batarya-depolama"],
  ["/solar-jel-akuler.html", "/hizmetlerimiz/lityum-batarya-depolama"],
  ["/:slug(ruzgar-.*)", "/hizmetlerimiz/ruzgar-hibrit"],
  ["/-ruzgar-turbini-akturk-wind-24v-2000w.html", "/hizmetlerimiz/ruzgar-hibrit"],
  ["/-ruzgar-turbini-akturk-wind-12/:rest*", "/hizmetlerimiz/ruzgar-hibrit"],
  ["/tarimsal-sulama", "/hizmetlerimiz/tarimsal-sulama"],
  ["/tarimsal-sulama.html", "/hizmetlerimiz/tarimsal-sulama"],
  ["/tarimsal-sulama-paketleri.html", "/hizmetlerimiz/tarimsal-sulama"],
  ["/gunes-paneli.html", "/hizmetlerimiz/malzeme-tedarik-toptan-perakende"],
  ["/:slug(gunes-paneli-akturk-solar-.*)", "/hizmetlerimiz/malzeme-tedarik-toptan-perakende"],
  ["/:slug(.*inverterler.*\\.html)","/hizmetlerimiz/malzeme-tedarik-toptan-perakende"],
  ["/sarj-kontrol-cihazlari.html", "/hizmetlerimiz/malzeme-tedarik-toptan-perakende"],
  ["/solar-kablolar.html", "/hizmetlerimiz/malzeme-tedarik-toptan-perakende"],
  ["/solar-montaj-sistemleri.html", "/hizmetlerimiz/malzeme-tedarik-toptan-perakende"],
  ["/urun1.html", "/hizmetlerimiz/malzeme-tedarik-toptan-perakende"],
  ["/gunes-paneli-fiyatlari.html", "/blog/gunes-enerjisi-sistemleri-fiyatlari-2026-karsilastirmali-rehber"],
  ["/bayilik.html", "/hizmetlerimiz/distributorluk-bayilik"],
  ["/BAY%C4%B0L%C4%B0K.html", "/hizmetlerimiz/distributorluk-bayilik"],
  ["/ges-proje-danismanligi.html", "/hizmetlerimiz/projelendirme-muhendislik-basvuru"],
  ["/tesvik-ve-hibe-islemleri", "/hizmetlerimiz/projelendirme-muhendislik-basvuru"],
  ["/tesvik-ve-hibe-islemleri.html", "/hizmetlerimiz/projelendirme-muhendislik-basvuru"],
  ["/ges-yatirim.html", "/blog/ankara-ges-yatirimi-avantajlari-lisanssiz-uretim"],
  ["/teknik-servis-hizmeti", "/hizmetlerimiz/taahhut-isletme-bakim"],
  ["/teknik-servis-hizmeti.html", "/hizmetlerimiz/taahhut-isletme-bakim"],
  ["/solar-otopark", "/hizmetlerimiz/elektrikli-arac-sarj-istasyonu"],
  ["/solar-otopark.html", "/hizmetlerimiz/elektrikli-arac-sarj-istasyonu"],
  ["/hakkimizda.html", "/hakkimizda"],
  ["/ekibimiz.html", "/hakkimizda"],
  ["/insan-kaynaklari.html", "/hakkimizda"],
  ["/iletisim.html", "/iletisim"],
  ["/tr/iletisim.html", "/iletisim"],
  ["/referanslarimiz.html", "/referanslarimiz"],
  ["/blog.html", "/blog"],
];

// 300 kelime civarındaki ince blog yazıları (SEO denetimi, 2026-10-09) aynı
// konuyu çok daha kapsamlı anlatan hizmet sayfalarına yönlendirildi. Yazılar
// silinmedi: published_at 2099-12-31 yapılarak gizlendi. Geri almak için
// eski tarihleri yazıp bu satırları kaldırın: id 1 → 2026-03-18,
// id 2 → 2026-02-09, id 3 → 2026-04-03, id 4 → 2026-05-12.
const RETIRED_POST_REDIRECTS: [string, string][] = [
  ["/blog/lityum-batarya-depolama-ne-zaman-gerekli", "/hizmetlerimiz/lityum-batarya-depolama"],
  ["/blog/muteahhitler-icin-ges-proje-entegrasyonu", "/hizmetlerimiz/muteahhit-ges"],
  ["/blog/tarimsal-sulama-gunes-enerjisi-pompa", "/hizmetlerimiz/tarimsal-sulama"],
  ["/blog/villa-cati-kac-kwp-ges-sistemi", "/hizmetlerimiz/villa-cati-ges"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return [...LEGACY_REDIRECTS, ...RETIRED_POST_REDIRECTS].map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
  images: {
    // Vercel hesabının aylık "Görsel Optimizasyonu" kotası dolduğunda
    // /_next/image tüm görseller için 402 (Payment Required) döndürüyordu.
    // Özel loader /_next/image'ı hiç kullanmaz (kota yok); görseller Supabase'e
    // önceden sıkıştırılmış WebP olarak yüklenir, loader genişliğe göre seçer.
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tzibyocqotqcowebswlq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
