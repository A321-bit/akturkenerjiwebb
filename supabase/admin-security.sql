-- Admin giriş güvenliği (2026-10-19): sunucu tarafı oturumlar, deneme kaydı
-- (kaba kuvvet koruması), iki adımlı doğrulama ve panelden değiştirilebilir şifre.
-- Yalnızca sunucu anahtarıyla erişilir.

create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ip text,
  user_agent text,
  revoked_at timestamptz
);

create table if not exists admin_login_attempts (
  id bigserial primary key,
  at timestamptz not null default now(),
  ip text,
  success boolean not null,
  reason text
);
create index if not exists admin_login_attempts_at_idx on admin_login_attempts (at);
create index if not exists admin_login_attempts_ip_idx on admin_login_attempts (ip, at);

create table if not exists admin_security (
  id integer primary key default 1 check (id = 1),
  password_hash text,          -- bcrypt; boşsa ADMIN_PASSWORD_HASH_B64 kullanılır
  totp_secret text,            -- AES-256-GCM ile şifreli
  totp_pending text,           -- kurulum sırasında, doğrulanana kadar
  totp_enabled boolean not null default false,
  backup_codes text[] not null default '{}',  -- SHA-256 özetleri, tek kullanımlık
  updated_at timestamptz not null default now()
);
insert into admin_security (id) values (1) on conflict do nothing;

alter table admin_sessions enable row level security;
alter table admin_login_attempts enable row level security;
alter table admin_security enable row level security;
revoke all on admin_sessions, admin_login_attempts, admin_security from anon, authenticated;
notify pgrst, 'reload schema';
