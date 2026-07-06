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

## 4. İletişim formu

Form şu anda `/api/contact` route'una gönderiliyor ve veriler sunucu
loguna yazılıyor (Vercel dashboard → Project → Logs). Formdan gelen
taleplerin doğrudan e-postanıza düşmesini isterseniz:

1. [Resend](https://resend.com) gibi bir e-posta servisinde ücretsiz hesap açın
2. API anahtarınızı Vercel projenizde **Settings → Environment Variables**
   kısmına `RESEND_API_KEY` adıyla ekleyin
3. `app/api/contact/route.ts` içindeki yorum satırındaki örnek kodu aktif hale
   getirin

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
  api/contact/           Form gönderim endpoint'i
  sitemap.ts, robots.ts  SEO dosyaları
components/              Header, Footer, form, hesaplayıcı gibi bileşenler
content/blog/            Blog yazıları (Markdown)
lib/site-config.ts       Tüm şirket bilgisi ve içerik — DÜZENLENECEK ANA DOSYA
lib/blog.ts              Markdown okuma yardımcı fonksiyonları
```
