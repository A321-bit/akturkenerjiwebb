-- Paket Oluştur: tedarikçi maliyet listesi (kalem başı alış, USD, KDV hariç) ve paket reçeteleri.
-- Maliyet içerdiği için dışarıya tamamen kapalı; yalnız service key ile okunur.
create table if not exists public.cost_items (
  id text primary key,
  code text,
  name text not null,
  grp text,
  source text,
  unit text,
  currency text not null default 'USD',
  list numeric,
  discount_pct numeric,
  cost_usd numeric,
  manual boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists cost_items_name_idx on public.cost_items (name);

create table if not exists public.product_packages (
  id bigserial primary key,
  name text not null,
  product_id bigint,
  lines jsonb not null default '[]'::jsonb,
  note text,
  linked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cost_items enable row level security;
alter table public.product_packages enable row level security;
revoke all on public.cost_items from anon, authenticated;
revoke all on public.product_packages from anon, authenticated;
notify pgrst, 'reload schema';

-- Sonradan eklenenler (2026-11-05)
alter table cost_items add column if not exists active boolean not null default true;
alter table product_packages add column if not exists sale_usd numeric(12,2);
