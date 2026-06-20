-- ============================================================================
--  LA QUINIELA — World Cup 2026 pool — initial schema
-- ============================================================================
--  Mirrors the original Excel sheet ("Hoja1") and the data model in the spec:
--    members, matches, predictions, pool_config.
--
--  AUTH MODEL (decided with the owner):
--    Members sign in with "pick your name + shared pool password"; the admin
--    has an extra PIN to enter results. There is NO Supabase Auth user table in
--    play here — sessions are issued by the Next.js server (signed cookie) after
--    checking the pool password. Therefore all access goes through the server
--    using the SERVICE ROLE key, and Row Level Security is enabled with NO anon
--    policies (the anon/public key cannot read or write these tables directly).
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
--  pool_config — single-row table holding pool-wide settings.
-- ---------------------------------------------------------------------------
create table if not exists pool_config (
  id                 boolean primary key default true check (id),  -- enforces a single row
  buy_in             numeric(10, 2) not null default 0,
  currency           text           not null default 'USD',
  -- Points awarded per correct prediction. Default 1 == the sheet's "1 / 0"
  -- legend. Editable so knockout rounds can be weighted later.
  points_per_correct integer        not null default 1 check (points_per_correct >= 0),
  -- Payout split as an ordered list, e.g. 1st 70% / 2nd 20% / 3rd 10%.
  payout_structure   jsonb          not null default
                       '[{"place":1,"pct":70},{"place":2,"pct":20},{"place":3,"pct":10}]'::jsonb,
  -- Hide other members' picks until a match locks at kickoff (owner's choice).
  picks_hidden_until_kickoff boolean not null default true,
  -- Last time results were auto-synced; used to throttle sync-on-view.
  last_synced_at     timestamptz,
  created_at         timestamptz    not null default now(),
  updated_at         timestamptz    not null default now()
);

-- ---------------------------------------------------------------------------
--  members — the fixed roster (13 friends to seed).
-- ---------------------------------------------------------------------------
create table if not exists members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,         -- displayed and used to "pick your name"
  email      text,                         -- optional; admin can fill in later
  is_admin   boolean not null default false,
  paid       boolean not null default false, -- has paid the buy-in
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  matches — fixtures. v1 seeds the 72 group-stage games; schema supports
--  knockout rounds (r32 .. final) so they can be added later.
-- ---------------------------------------------------------------------------
create table if not exists matches (
  id          uuid primary key default gen_random_uuid(),
  stage       text not null default 'group'
                check (stage in ('group','r32','r16','qf','sf','third','final')),
  group_label text,                         -- e.g. 'A'..'L' for group stage
  equipo_1    text not null,                -- canonical English/Spanish team name
  equipo_2    text not null,
  kickoff_utc timestamptz not null,         -- stored in UTC; rendered in America/Lima
  -- Actual result (GANADOR): 1 = Equipo 1, 2 = Equipo 2, 0 = draw. NULL until
  -- the admin enters it. (The Excel used 5 as a "not played" placeholder; here
  -- that is simply NULL.)
  result_code smallint check (result_code in (0,1,2)),
  match_order integer,                      -- preserves spreadsheet ordering
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- `locked` is DERIVED, not stored: a match is locked when kickoff_utc <= now().

create index if not exists matches_kickoff_idx on matches (kickoff_utc);

-- ---------------------------------------------------------------------------
--  predictions — one pick per member per match.
-- ---------------------------------------------------------------------------
create table if not exists predictions (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references members (id) on delete cascade,
  match_id   uuid not null references matches (id) on delete cascade,
  -- The pick (PRONOSTICO): 1 = Equipo 1, 2 = Equipo 2, 0 = draw.
  pick_code  smallint not null check (pick_code in (0,1,2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, match_id)             -- one pick per member per match
);
-- points_awarded is DERIVED in the app (src/lib/scoring.ts) so the result and
-- the points can never drift out of sync. It is intentionally not stored.

create index if not exists predictions_match_idx  on predictions (match_id);
create index if not exists predictions_member_idx on predictions (member_id);

-- ---------------------------------------------------------------------------
--  Keep updated_at fresh on writes.
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists pool_config_updated_at on pool_config;
create trigger pool_config_updated_at before update on pool_config
  for each row execute function set_updated_at();

drop trigger if exists matches_updated_at on matches;
create trigger matches_updated_at before update on matches
  for each row execute function set_updated_at();

drop trigger if exists predictions_updated_at on predictions;
create trigger predictions_updated_at before update on predictions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
--  Row Level Security: lock everything down. The server talks to the DB with
--  the service role (which bypasses RLS); the public anon key gets nothing.
-- ---------------------------------------------------------------------------
alter table pool_config  enable row level security;
alter table members      enable row level security;
alter table matches      enable row level security;
alter table predictions  enable row level security;
-- No policies are created on purpose -> anon/public access is denied by default.

-- ---------------------------------------------------------------------------
--  Ensure the singleton config row exists.
-- ---------------------------------------------------------------------------
insert into pool_config (id) values (true) on conflict (id) do nothing;
