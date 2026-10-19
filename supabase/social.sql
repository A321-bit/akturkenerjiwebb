-- Sosyal medya planı (Facebook + Instagram otomatik paylaşım) (2026-10-19).
-- Yalnızca sunucu anahtarıyla erişilir.

create table if not exists social_posts (
  id bigserial primary key,
  scheduled_at timestamptz not null,
  source_type text not null,          -- urun | kategori | referans | blog | hizmet
  source_slug text not null,
  title text not null,
  caption text not null,              -- {{fiyat}} gönderim anında güncel fiyatla değiştirilir
  link text not null,
  platforms text[] not null default array['facebook','instagram'],
  approved boolean not null default false,
  fb_status text not null default 'bekliyor',   -- bekliyor | zamanlandi | paylasildi | hata | yok
  fb_post_id text,
  ig_status text not null default 'bekliyor',   -- bekliyor | paylasildi | hata | yok
  ig_media_id text,
  ig_permalink text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_posts_scheduled_idx on social_posts (scheduled_at);
alter table social_posts enable row level security;
revoke all on social_posts from anon, authenticated;
notify pgrst, 'reload schema';
