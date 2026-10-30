-- Google İşletme gönderi planı. Taslaklar burada bekler; onaylanınca Google'a ileri tarihli
-- (scheduledTime) gönderilir. Yalnızca sunucu (service role) erişir; RLS açık, politika yok.

create table if not exists public.gbp_scheduled_posts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  account text not null,
  location text not null,
  location_title text,
  scheduled_at timestamptz not null,
  kind text not null default 'referans',
  summary text not null,
  url text,
  photo_url text,
  approved boolean not null default false,
  status text not null default 'taslak',
  published_name text,
  error text
);

alter table public.gbp_scheduled_posts enable row level security;
create index if not exists gbp_scheduled_posts_time_idx on public.gbp_scheduled_posts (scheduled_at);
