-- Müşteri yönetimi: müşteri kartı, faaliyet geçmişi, personel, tahsilat.
-- Mevcut tablolara dokunmaz; proposals tablosuna yalnız müşteri ve sorumlu bağlantısı eklenir.

create table if not exists public.staff (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  full_name text not null,
  email text,
  phone text,
  title text,
  active boolean not null default true
);

create table if not exists public.customers (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  company text,
  phone text not null,
  phone_key text not null unique,
  email text,
  province text,
  district text,
  address text,
  mahalle text,
  ada text,
  parsel text,
  source text,
  segment text,
  assigned_to bigint references public.staff(id) on delete set null,
  notes text
);
create index if not exists customers_name_idx on public.customers (full_name);

create table if not exists public.customer_activities (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  customer_id bigint not null references public.customers(id) on delete cascade,
  proposal_id bigint references public.proposals(id) on delete set null,
  staff_id bigint references public.staff(id) on delete set null,
  kind text not null,
  text text,
  due_at timestamptz,
  done_at timestamptz
);
create index if not exists customer_activities_customer_idx on public.customer_activities (customer_id, created_at desc);
create index if not exists customer_activities_due_idx on public.customer_activities (due_at) where done_at is null;

create table if not exists public.project_payments (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  proposal_id bigint not null references public.proposals(id) on delete cascade,
  step text not null,
  amount numeric(14,2) not null,
  currency text not null default 'USD',
  due_at date,
  paid_at date,
  note text
);
create index if not exists project_payments_proposal_idx on public.project_payments (proposal_id);

alter table public.proposals add column if not exists customer_id bigint references public.customers(id) on delete set null;
alter table public.proposals add column if not exists assigned_to bigint references public.staff(id) on delete set null;
create index if not exists proposals_customer_idx on public.proposals (customer_id);

-- Yalnız sunucu erişir.
alter table public.staff enable row level security;
alter table public.customers enable row level security;
alter table public.customer_activities enable row level security;
alter table public.project_payments enable row level security;
revoke all on public.staff, public.customers, public.customer_activities, public.project_payments from anon, authenticated;

notify pgrst, 'reload schema';
