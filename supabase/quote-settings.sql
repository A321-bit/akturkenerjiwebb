-- Teklif Stüdyosu fiyat kuralları ve varsayılanları (tek satır, jsonb).
create table if not exists public.quote_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.quote_settings enable row level security;
revoke all on public.quote_settings from anon, authenticated;
notify pgrst, 'reload schema';
