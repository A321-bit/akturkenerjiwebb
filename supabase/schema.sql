-- Aktürk Enerji — admin panel içerik şeması
-- Bu dosyayı Supabase Dashboard > SQL Editor içine yapıştırıp "Run" ile çalıştırın.

create table if not exists site_settings (
  id int primary key default 1,
  name text not null,
  short_name text,
  founded_year int,
  city text,
  country text,
  description text,
  phone_display text,
  phone_href text,
  whatsapp_number text,
  email text,
  address_line text,
  maps_embed_url text,
  working_hours text,
  instagram text,
  linkedin text,
  youtube text,
  facebook text,
  stats jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  constraint site_settings_single_row check (id = 1)
);

create table if not exists services (
  id bigint generated always as identity primary key,
  slug text unique not null,
  eyebrow text not null,
  title text not null,
  summary text not null,
  description text not null,
  bullets text[] not null default '{}',
  audience text not null,
  image text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_references (
  id bigint generated always as identity primary key,
  slug text unique not null,
  title text not null,
  category text not null,
  location text not null,
  address text,
  capacity text not null,
  year text not null,
  summary text not null,
  description text,
  image text,
  gallery text[] not null default '{}',
  video_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists blog_posts (
  id bigint generated always as identity primary key,
  slug text unique not null,
  title text not null,
  description text not null,
  category text not null,
  content text not null,
  published_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists testimonials (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null,
  quote text not null,
  sort_order int not null default 0
);

create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  type text not null check (type in ('pageview', 'click')),
  path text not null,
  label text,
  city text,
  region text,
  country text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx on analytics_events (created_at desc);
create index if not exists analytics_events_type_idx on analytics_events (type);
create index if not exists analytics_events_path_idx on analytics_events (path);

create table if not exists site_videos (
  id bigint generated always as identity primary key,
  title text not null,
  youtube_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id bigint generated always as identity primary key,
  need_type text not null,
  bill_range text,
  fullname text not null,
  phone text not null,
  email text,
  province text,
  source text not null default 'website',
  created_at timestamptz not null default now()
);

-- Herkese açık okuma (site ziyaretçileri publishable anahtarla okuyacak),
-- yazma işlemleri sadece sunucu tarafında secret anahtarla yapılacağı için
-- yazma politikası eklemiyoruz (varsayılan olarak RLS her şeyi reddeder).
alter table site_settings enable row level security;
alter table services enable row level security;
alter table project_references enable row level security;
alter table blog_posts enable row level security;
alter table testimonials enable row level security;
alter table site_videos enable row level security;
alter table leads enable row level security;
alter table analytics_events enable row level security;

create policy "public read" on site_settings for select using (true);
create policy "public read" on services for select using (true);
create policy "public read" on project_references for select using (true);
create policy "public read" on blog_posts for select using (true);
create policy "public read" on testimonials for select using (true);
create policy "public read" on site_videos for select using (true);
-- leads tablosuna herkese açık okuma YOK — sadece secret anahtarla yazılıp okunur.

-- Görsel yükleme için storage bucket (herkese açık okuma, yazma sadece secret anahtarla)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public read media" on storage.objects for select using (bucket_id = 'media');
