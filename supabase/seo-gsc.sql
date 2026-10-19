-- SEO paneli: Search Console verisinin günlük kopyası (2026-10-19).
-- Yalnızca sunucu anahtarıyla okunur/yazılır (RLS açık, politika yok).

create table if not exists gsc_rows (
  date date not null,
  query text not null,
  page text not null,
  device text not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr real,
  position real,
  primary key (date, query, page, device)
);
create index if not exists gsc_rows_query_idx on gsc_rows (query);
create index if not exists gsc_rows_date_idx on gsc_rows (date);
alter table gsc_rows enable row level security;

create table if not exists gsc_sync_log (
  id bigserial primary key,
  ran_at timestamptz not null default now(),
  start_date date,
  end_date date,
  row_count integer,
  error text
);
alter table gsc_sync_log enable row level security;

revoke all on gsc_rows, gsc_sync_log from anon, authenticated;

-- Dönem için anahtar kelime listesi: sıra, gösterim ve tıklama karşılaştırma dönemiyle birlikte.
-- Ortalama sıra gösterimle ağırlıklıdır (Search Console'un hesapladığı gibi).
create or replace function gsc_keywords(
  p_start date, p_end date, p_prev_start date, p_prev_end date,
  p_device text default null, p_page text default null
)
returns table (
  query text, clicks bigint, impressions bigint, ctr numeric, "position" numeric,
  top_page text, prev_position numeric, prev_clicks bigint, prev_impressions bigint
)
language sql stable security definer set search_path = public as $$
  with cur as (
    select r.query, sum(r.clicks) c, sum(r.impressions) i,
           sum(r.position * r.impressions) / nullif(sum(r.impressions), 0) pos
    from gsc_rows r
    where r.date between p_start and p_end
      and (p_device is null or r.device = p_device)
      and (p_page is null or r.page like p_page || '%')
    group by r.query
  ),
  prev as (
    select r.query, sum(r.clicks) c, sum(r.impressions) i,
           sum(r.position * r.impressions) / nullif(sum(r.impressions), 0) pos
    from gsc_rows r
    where r.date between p_prev_start and p_prev_end
      and (p_device is null or r.device = p_device)
      and (p_page is null or r.page like p_page || '%')
    group by r.query
  ),
  tp as (
    select distinct on (x.query) x.query, x.page
    from (
      select r.query, r.page, sum(r.impressions) i
      from gsc_rows r
      where r.date between p_start and p_end
        and (p_device is null or r.device = p_device)
        and (p_page is null or r.page like p_page || '%')
      group by r.query, r.page
    ) x
    order by x.query, x.i desc
  )
  select cur.query, cur.c, cur.i,
         round(cur.c::numeric / nullif(cur.i, 0) * 100, 2),
         round(cur.pos::numeric, 1),
         tp.page,
         round(prev.pos::numeric, 1), prev.c, prev.i
  from cur
  left join prev on prev.query = cur.query
  left join tp on tp.query = cur.query
  order by cur.i desc;
$$;

-- Bir anahtar kelimenin günlük seyri.
create or replace function gsc_query_daily(p_query text, p_start date, p_end date, p_device text default null)
returns table (date date, clicks bigint, impressions bigint, "position" numeric)
language sql stable security definer set search_path = public as $$
  select r.date, sum(r.clicks), sum(r.impressions),
         round((sum(r.position * r.impressions) / nullif(sum(r.impressions), 0))::numeric, 1)
  from gsc_rows r
  where r.query = p_query and r.date between p_start and p_end
    and (p_device is null or r.device = p_device)
  group by r.date
  order by r.date;
$$;

revoke execute on function gsc_keywords(date, date, date, date, text, text) from anon, authenticated, public;
revoke execute on function gsc_query_daily(text, date, date, text) from anon, authenticated, public;
notify pgrst, 'reload schema';
