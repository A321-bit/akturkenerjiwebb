@AGENTS.md

## Proje kuralları (Aktürk Enerji)

Bakım, kota ve acil durum rehberi: `docs/BAKIM-REHBERI.md`. Değişiklik yapmadan önce oku.

- Görseller yalnız `lib/imageLoader.ts` (`cdnImage` / `cdnThumb` / `cdnImageUrl`) üzerinden `/gorsel/...` yolundan verilir; Supabase storage adresi koda yazılmaz.
- Herkese açık sayfalar önbellekten verilir: `revalidate` ≥ 3600, `force-dynamic` / `revalidate = 0` / `cache: "no-store"` yok. Veritabanı okuyan fonksiyonlar `lib/data.ts` → `shared()` ile sarılır, hata boş liste olarak dönülmez.
- Admin panelden toplu kaydetme yapılmaz (her kayıt ISR kotası harcar).
- `npm run build` önce `scripts/check-guards.mjs` çalıştırır; kural bozulursa derleme durur. Bu kontrolü kapatma, kodu düzelt.
- Site metinleri profesyonel tonda; teşvik/hibe/devlet desteği/kredi içeriği yok; uydurma fiyat ya da bilgi yok.
