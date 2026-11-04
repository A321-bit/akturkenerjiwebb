# Aktürk Enerji web sitesi: bakım rehberi

Bu rehber, sitenin bir geliştiriciye ya da yapay zekâya ihtiyaç duymadan çalışması için yazıldı.

Site kendi kendine çalışır. Senin işin şunlar:
- Her akşam gelen rapor e-postasına bakmak.
- Ayda bir kullanım panellerini kontrol etmek.
- Reklam bütçelerini yönetmek.

## 1. Kendiliğinden çalışanlar

Bunlar Vercel üzerinde otomatik çalışır ve kimsenin açık tutmasına gerek yoktur.

| Ne | Ne zaman | Ne yapar |
|---|---|---|
| Günlük rapor e-postası | Her gün 22:30 | Talepler, Meta form başvuruları, reklam harcaması, Google arama verileri, sosyal medya ve güvenlik özetini gönderir. **Site kontrolü** yapar ve sorun varsa en üstte kırmızı "Dikkat" kutusu çıkarır. |
| Search Console verisi | Her gün 07:00 | Google arama verilerini admin paneldeki SEO ekranına çeker. |
| Sosyal medya paylaşımı | Her gün 10:00 ve 19:00 | Admin → Sosyal Medya'da planlanan gönderileri Facebook ve Instagram'a atar. |
| Veritabanı yedeği | Her Pazar 03:00 | GitHub'da şifreli yedek alır ve 90 gün saklar. Kurulumu için 5. bölüme bak. |
| Sayfa önbelleği | Sürekli | Sayfalar her ziyarette yeniden üretilmez, önbellekten verilir. Admin panelde bir şey kaydedince ilgili veri hemen yenilenir. |

Meta ve Google bağlantıları süresi dolmayan anahtarlarla çalışır, ara ara yenilemen gerekmez.

## 2. Günlük rapor e-postası

Konu satırı **"⚠ … uyarı"** ile başlıyorsa en üstteki kırmızı kutuyu oku. Uyarı türleri ve yapılacaklar:

- **"Sitede açılmayan adres var":** 4. bölümdeki adımları izle.
- **"Bugünkü reklam harcaması ortalamanın çok üstünde":** Google Ads ve Meta Reklam Yöneticisi'nde kampanya bütçelerine bak.
- **"Bugün hiç reklam harcaması yok":** Kampanyaları bilerek durdurduysan sorun yok. Durdurmadıysan ödeme yöntemine bak; kart reddedilmiş olabilir.
- **"Meta form başvurusu 3 günden uzun süredir bekliyor":** Personel Admin → Meta Formları'nda arayıp sonucu işaretlemeli. İşaretlenen sonuç Meta'ya gider ve reklamlar daha iyi müşteri bulur.
- **"Alınamayan veriler"** (e-postanın en altında): O servis bir günlüğüne cevap vermemiş olabilir. Birkaç gün üst üste aynı hata geliyorsa bir geliştiriciye göster.

Konu satırında uyarı yoksa ve "✓ Site kontrolü: … adres sorunsuz açıldı" yazıyorsa her şey yolunda demektir.

## 3. Aylık kontrol (ayın 1'i civarı, 10 dakika)

### Supabase (veritabanı ve görseller)
1. supabase.com → organizasyon → **Usage** sayfasını aç.
2. Ücretsiz planın sınırları:
   - **Egress** ve **Cached Egress**: ayrı ayrı aylık 5 GB.
   - **Database size**: 500 MB.
3. Kasım 2026 düzeltmelerinden sonraki ölçümler:
   - Veritabanı çıkışı: günde yaklaşık 8 MB, ayda yaklaşık 0,25 GB.
   - Görsel çıkışı: 3 Kasım'da günde 185 MB.
   - Admin görselleri 4 Kasım'da önbelleğe alındı; bundan sonra görsel çıkışı daha düşük olmalı.
4. **Pro'dan ücretsiz plana dönme kuralı:**
   - İki egress değeri de gün sayısına bölünüp 30 ile çarpıldığında **4 GB'ın altında** kalıyorsa ücretsiz plana dönülebilir. Örnek: 10 günde 1 GB → ayda yaklaşık 3 GB → dönülebilir.
   - Plan değiştirme: Organization → Billing → Change plan → Free.
   - Supabase kullanılmayan süreyi kredi olarak iade eder.
   - Ücretsiz planda Supabase'in kendi yedeği yoktur. Önce 5. bölümdeki yedeği kur.
5. Sınır aşılırsa ücretsiz plan önce uyarır, sonra siteyi durdurur (2 Kasım'da yaşanan buydu). Pro planda durdurma olmaz, sadece fazla kullanım ücretlendirilir.

### Vercel (barındırma)
1. vercel.com'a **akturk-team** ekibinin hesabıyla gir → Usage.
2. Ücretsiz (Hobby) planda en önemli sınır **ISR Writes: 200.000/ay**. Ekim'de %75'e ulaşmıştı; düzeltmeden sonra çok altında olmalı.
3. Vercel %75'te e-posta atar. Böyle bir e-posta gelirse bir geliştiriciye bu rehberle birlikte göster.

### Reklamlar
- Google Ads ve Meta'da aylık harcamayı ve talep başı maliyeti kontrol et. Günlük raporda "Talep başı maliyet" kartı var.
- Çalışan reklamlarda sık değişiklik yapma; reklamın öğrenme süreci sıfırlanır.

## 4. Site açılmıyorsa

1. **Supabase:** Usage sayfasında kırmızı uyarı ya da "exceed quota / restricted" yazısı var mı? Varsa ya planı yükselt ya da ayın yenilenmesini bekle. Ayrıca status.supabase.com'da genel bir arıza olup olmadığına bak.
2. **Vercel:** Proje → Deployments. En üstteki yayın kırmızıysa (Error) site eski sağlam sürümde kalır, ziyaretçiler etkilenmez.
   - Hata olmadığı halde yeni sürümde sorun varsa: önceki yeşil yayının yanındaki "…" → **Promote to Production** (veya Instant Rollback). Bu, siteyi bir dakikada eski haline döndürür.
   - Ayrıca vercel-status.com'da genel bir arıza olup olmadığına bak.
3. **Alan adı:** Site hiç açılmıyor ve 1. ile 2. adımlar temizse alan adının süresi dolmuş olabilir. Alan adını aldığın firmada yenileme tarihine bak.

## 5. Veritabanı yedeği (bir kerelik kurulum, 5 dakika)

1. supabase.com → proje → üstteki **Connect** düğmesi → **Session pooler** bağlantı adresini kopyala.
   - Adres `postgresql://postgres.tzibyocqotqcowebswlq:[YOUR-PASSWORD]@...pooler.supabase.com:5432/postgres` şeklindedir.
   - `[YOUR-PASSWORD]` yerine veritabanı şifreni yaz. Şifreyi bilmiyorsan aynı ekrandaki Database Settings'ten sıfırlayabilirsin; site bu şifreyi kullanmaz, sıfırlamak siteyi etkilemez.
2. github.com/A321-bit/akturkenerjiwebb → **Settings → Secrets and variables → Actions → New repository secret**:
   - `SUPABASE_DB_URL` = 1. adımdaki adres.
   - `BACKUP_PASSPHRASE` = uzun bir parola. **Bu parolayı bir yere yaz; yedeği açmak için gerekir.**
3. **Actions** sekmesi → "Veritabanı yedeği" → **Run workflow** ile ilk yedeği hemen al. Yeşil tik çıkarsa kurulum tamamdır; sonrası her Pazar kendiliğinden çalışır.

Yedek şunları **içerir**: talepler, Meta form başvuruları, ürünler, hizmetler, bloglar, referanslar, teklifler, ayarlar ve diğer tüm tablolar.

**İçermez:** fotoğraf dosyaları. Fotoğrafların asılları D:\ arşivinde duruyor. Supabase'den toplu indirmek veri kotası harcadığı için yedeğe eklenmedi.

> **Önemli:** GitHub deposu şu anda **herkese açık** (public). Kodda şifre yok ve yedek şifreli olduğu için güvenli. Yine de depoyu gizli yapman önerilir: Settings → General → en alttaki Danger Zone → Change visibility → Private. Vercel bağlantısı bundan etkilenmez.

### Yedekten geri yükleme (geliştirici işi)
```bash
gpg --decrypt akturk-db-TARIH.dump.gpg > yedek.dump
pg_restore --no-owner --no-privileges --clean --if-exists -d "SUPABASE_DB_URL" yedek.dump
```

## 6. Kod kuralları (geliştirici ya da yapay zekâ ile çalışırken)

Bu kurallar Kasım 2026'daki kota krizinin nedenleridir. `scripts/check-guards.mjs` her derlemeden önce ilk dördünü otomatik denetler. Kural bozulursa yayın durur ve canlı site etkilenmez.

1. **Görseller Supabase'den doğrudan yüklenmez.** Hep `lib/imageLoader.ts` içindeki `cdnImage`, `cdnThumb` veya `cdnImageUrl` ile `/gorsel/...` yolundan verilir. Bu yol Vercel'in önbelleğinden gelir; her dosya Supabase'den yalnızca bir kez iner.
2. **Herkese açık sayfalar en az 1 saat (tercihen 1 gün) önbellekte kalır.** `revalidate` 3600'den küçük olamaz. Güncel veri gerekiyorsa admin kaydı önbelleği zaten temizler (`lib/admin-crud.ts` → `clearDataCache`).
3. **Herkese açık sayfalarda `force-dynamic` ve `revalidate = 0` kullanılmaz.**
4. **Herkese açık kodda `fetch(..., { cache: "no-store" })` kullanılmaz.**
5. **Veritabanından okuyan her fonksiyon `lib/data.ts` içindeki `shared()` (unstable_cache) ile sarılır.** Hata olursa boş liste dönülmez, hata fırlatılır; yoksa boş sonuç önbelleğe girer.
6. **Admin panelde toplu kaydetme (yüzlerce ürünü tek tek güncelleme) yapılmaz.** Her kayıt önbelleği temizler ve ISR kotası harcar. Toplu değişiklik doğrudan veritabanında yapılır, ardından bir kez önbellek temizlenir.
7. **Yayına almadan önce** `npm run build` çalıştırılır. Bu komut koruma kontrolünü de çalıştırır.

## 7. Bekleyen işler (Kasım 2026)

**Senin yapacakların:**
- **Search Console → URL denetimi → Dizine eklenmesini iste:**
  - /magaza/lityum-batarya-ve-setleri
  - /hizmetlerimiz/projelendirme-muhendislik-basvuru
  - /hizmetlerimiz/taahhut-isletme-bakim
- **Search Console → Site haritaları:** 2018'den kalan eski `http://` site haritalarını kaldır.
- **Supabase:** Ay sonuna doğru 3. bölümdeki kurala göre Pro'da kalma ya da ücretsize dönme kararını ver. Dönmeden önce 5. bölümdeki yedeği kur.
- **Yasal:** Şirket numaraları (MERSİS, vergi no), ETBİS kaydı ve hukuki metinlerin avukat kontrolü.
- **Hesaplama aracı Meta reklamı:** Görseller hazır, `taslaklar/reklam-on-grid-hesaplama/v4` klasöründe. Kendin açmak istersen:
  - Meta Reklam Yöneticisi → Trafik hedefi.
  - Hedef sayfa: akturkenerji.com/hesaplama/on-grid.
  - Kitle: 35 yaş üstü, villa bölgeleri.
  - Bütçe: günlük 100 TL'den başla.

**Reklam kuralları** (her zaman geçerli):
- Reklamlar ana sayfaya değil, ilgili hizmet ya da kategori sayfasına yönlendirilir.
- Teşvik, hibe, devlet desteği ve banka kredisi içeriği kullanılmaz.
- Fiyatlar gerçek olmalı; uydurma rakam kullanılmaz.

## 8. Önemli hesaplar

| Servis | Ne için | Not |
|---|---|---|
| Vercel (akturk-team) | Barındırma, otomatik görevler | Ücretsiz plan. Ortam değişkenleri (API anahtarları) burada. |
| Supabase | Veritabanı, görseller | Pro. Ücretsiz plana dönüş için 3. bölüm. |
| GitHub (A321-bit/akturkenerjiwebb) | Kod, haftalık yedek | Koda gönderilen her değişiklik Vercel'de otomatik yayına girer. |
| Google Ads, Meta Business | Reklam | |
| Google Search Console, Analytics, İşletme Profili | SEO, istatistik | Admin → SEO ve Google İşletme ekranlarına bağlı. |
| Resend | Günlük rapor ve talep e-postaları | |
| Microsoft Clarity | Ziyaretçi kayıtları | |
