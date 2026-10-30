-- Teklif Stüdyosu: hazırlanan teklifler. Tasarım (çatı yüzeyleri, paneller), fiyat kalemleri ve
-- koşullar "data" alanında JSON olarak tutulur; listede gereken özet alanlar ayrı sütunlardır.
-- Yalnızca sunucu (service role) erişir; RLS açık, politika yok.

create table if not exists public.proposals (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  proposal_no text not null unique,
  status text not null default 'Taslak',
  customer_name text,
  customer_phone text,
  province text,
  calc_id bigint,
  dc_kwp numeric,
  total numeric,
  data jsonb not null
);

alter table public.proposals enable row level security;
create index if not exists proposals_updated_idx on public.proposals (updated_at desc);
