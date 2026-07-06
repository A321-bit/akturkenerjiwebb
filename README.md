# Aktürk Enerji Teknolojileri — Kurumsal Website

Next.js (App Router) + Tailwind CSS ile hazırlanmış, Vercel'de ücretsiz
yayınlanabilen kurumsal site. SEO ve yapay zeka aramaları için server-side
rendering, sitemap, robots.txt ve JSON-LD (LocalBusiness, Service, Article)
şemaları hazır durumda.

## 1. İçeriği güncelleme (EN ÖNEMLİ ADIM)

Neredeyse tüm şirket bilgisi **tek bir dosyada**: `lib/site-config.ts`

Bu dosyada `[PLACEHOLDER]` etiketli her satırı gerçek bilgilerinizle değiştirin:

- `contact.phoneDisplay`, `contact.phoneHref` — telefon numaranız
- `contact.whatsappNumber` — WhatsApp numaranız (ülke kodu ile, `+` ve boşluksuz, örn. `905XXXXXXXXX`)
- `contact.email`, `contact.addressLine`
- `social.instagram`, `social.linkedin` — sosyal medya hesaplarınız
- `references` dizisi — gerçek referans projeleriniz (başlık, konum, kapasite, yıl)
- `testimonials` dizisi — gerçek müşteri yorumlarınız
- `stats` dizisi — tamamlanan proje sayısı, kurulu güç gibi gerçek rakamlar

Değişiklik yaptıktan sonra site genelinde otomatik güncellenir.

## 2. Logo

Yüklediğiniz logo `public/logo.png` (arka planı şeffaflandırılmış hâli) olarak
zaten yerleştirildi ve header/footer'da kullanılıyor. Daha yüksek çözünürlüklü
veya vektör (SVG) bir logo dosyanız varsa aynı isimle üzerine kaydedebilirsiniz.

## 3. Blog yazıları

`content/blog/` klasöründeki `.md` dosyalarını düzenleyebilir veya yenilerini
ekleyebilirsiniz. Her dosyanın başında şu alanlar olmalı:

```md
---
title: "Yazı Başlığı"
description: "Kısa açıklama (meta description için kullanılır)"
date: "2026-07-01"
category: "Kategori Adı"
---

Yazı içeriği buradan itibaren normal Markdown ile yazılır.
```

Yeni bir `.md` dosyası eklemeniz yeterli — blog listesine otomatik dahil olur.

## 4. Teklif formu (LeadForm)

Ana sayfadaki ve `/iletisim` sayfasındaki çok adımlı teklif formu
`/api/lead` route'una gönderiliyor. Veriler her zaman sunucu loguna
yazılıyor (Vercel dashboard → Project → Logs); ayrıca aşağıdaki ortam
değişkenleri tanımlıysa Supabase ve/veya Google Sheets'e de kaydediliyor:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — bkz. `app/api/lead/route.ts`
  başındaki yorum için önerilen tablo şeması
- `GOOGLE_SHEETS_WEBHOOK_URL` — bir Google Apps Script Web App URL'i

## 5. Yerelde çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

## 6. Vercel'e yayınlama

1. Bu projeyi bir GitHub reposuna yükleyin
2. [vercel.com](https://vercel.com) üzerinden "New Project" ile bu repoyu seçin
   (Next.js otomatik algılanır, ekstra ayar gerekmez)
3. Deploy edin
4. Proje ayarlarından **Domains** kısmına `akturkenerji.com` alan adınızı
   ekleyin ve DNS ayarlarını Vercel'in verdiği talimata göre güncelleyin

## Klasör yapısı

```
app/                     Sayfalar ve rotalar (App Router)
  hizmetlerimiz/         Hizmetler listesi + her hizmet için detay sayfası
  referanslarimiz/       Referans/proje listesi
  blog/                  Blog listesi + yazı detay sayfası
  hakkimizda/, iletisim/ Kurumsal sayfalar
  api/lead/              Teklif formu gönderim endpoint'i (Supabase + Google Sheets)
  sitemap.ts, robots.ts  SEO dosyaları
components/              Header, Footer, form, hesaplayıcı gibi bileşenler
content/blog/            Blog yazıları (Markdown)
lib/site-config.ts       Tüm şirket bilgisi ve içerik — DÜZENLENECEK ANA DOSYA
lib/blog.ts              Markdown okuma yardımcı fonksiyonları
```
