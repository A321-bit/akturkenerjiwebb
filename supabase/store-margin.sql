-- Mağaza: alış maliyeti + kâr marjıyla otomatik fiyat (2026-10).

-- 1) Sütunlar (yeni kod deploy edilmeden önce)
alter table store_products
  add column if not exists cost_usd numeric(12,2),
  add column if not exists bom jsonb not null default '[]'::jsonb,
  add column if not exists margin_pct numeric(6,2);
alter table store_categories add column if not exists margin_pct numeric(6,2);
alter table store_settings
  add column if not exists vat_pct numeric(5,2) not null default 20,
  add column if not exists default_margin_pct numeric(6,2);
notify pgrst, 'reload schema';

-- 2) Yeni kod deploy edildikten SONRA: alış fiyatları ve marjlar public (anon)
-- anahtarla okunamasın. Site bu tabloları artık sunucu anahtarıyla okuyor.
revoke select on store_products, store_categories, store_settings from anon, authenticated;
notify pgrst, 'reload schema';

-- 3) Üstü çizili fiyat marjı (2026-10-16)
alter table store_products add column if not exists list_margin_pct numeric(6,2);
alter table store_categories add column if not exists list_margin_pct numeric(6,2);
alter table store_settings add column if not exists default_list_margin_pct numeric(6,2);
notify pgrst, 'reload schema';
