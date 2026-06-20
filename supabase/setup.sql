-- ============================================================================
--  LA QUINIELA — ONE-SHOT SUPABASE SETUP
--  Paste this whole file into the Supabase SQL Editor and press Run.
--  It creates all tables AND loads the members + 72 fixtures in one go.
--  Safe to re-run.
-- ============================================================================

-- ----- PART 1: SCHEMA -------------------------------------------------------
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

-- ----- PART 2: SEED DATA ----------------------------------------------------
-- ============================================================================
--  LA QUINIELA — seed data (members + 72 group-stage fixtures + config)
--  Paste this into the Supabase SQL editor AFTER running 0001_init.sql.
--  Safe to re-run: members upsert by name; fixtures are replaced.
-- ============================================================================

-- Members (roster + Angelo as admin) --------------------------------------
insert into members (name, email, is_admin) values
  ('PP Florez', null, false),
  ('Jimmy', null, false),
  ('Tito', null, false),
  ('Roma', null, false),
  ('Paco', null, false),
  ('Dr. Flores', null, false),
  ('Yoyo', 'luisyoyocuadra@gmail.com', false),
  ('Roger', null, false),
  ('Miguel', null, false),
  ('Efrain', null, false),
  ('Fernando', null, false),
  ('Castro Luis', null, false),
  ('Luchito Ramires', null, false),
  ('Angelo Chavez', null, true)
on conflict (name) do nothing;

-- Fixtures: clear the group stage first so this stays idempotent ----------
delete from matches where stage = 'group';
insert into matches (match_order, stage, group_label, equipo_1, equipo_2, kickoff_utc) values
  (1, 'group', 'A', 'Mexico', 'South Africa', '2026-06-11T19:00:00Z'),
  (2, 'group', 'A', 'South Korea', 'Czechia', '2026-06-12T02:00:00Z'),
  (3, 'group', 'B', 'Canada', 'Bosnia and Herzegovina', '2026-06-12T19:00:00Z'),
  (4, 'group', 'D', 'United States', 'Paraguay', '2026-06-13T01:00:00Z'),
  (5, 'group', 'B', 'Qatar', 'Switzerland', '2026-06-13T19:00:00Z'),
  (6, 'group', 'C', 'Brazil', 'Morocco', '2026-06-13T22:00:00Z'),
  (7, 'group', 'C', 'Haiti', 'Scotland', '2026-06-14T01:00:00Z'),
  (8, 'group', 'D', 'Australia', 'Türkiye', '2026-06-14T04:00:00Z'),
  (9, 'group', 'E', 'Germany', 'Curaçao', '2026-06-14T17:00:00Z'),
  (10, 'group', 'F', 'Netherlands', 'Japan', '2026-06-14T20:00:00Z'),
  (11, 'group', 'E', 'Côte d''Ivoire', 'Ecuador', '2026-06-14T23:00:00Z'),
  (12, 'group', 'F', 'Sweden', 'Tunisia', '2026-06-15T02:00:00Z'),
  (13, 'group', 'H', 'Spain', 'Cape Verde', '2026-06-15T16:00:00Z'),
  (14, 'group', 'G', 'Belgium', 'Egypt', '2026-06-15T19:00:00Z'),
  (15, 'group', 'H', 'Saudi Arabia', 'Uruguay', '2026-06-15T22:00:00Z'),
  (16, 'group', 'G', 'Iran', 'New Zealand', '2026-06-16T01:00:00Z'),
  (17, 'group', 'I', 'France', 'Senegal', '2026-06-16T19:00:00Z'),
  (18, 'group', 'I', 'Iraq', 'Norway', '2026-06-16T22:00:00Z'),
  (19, 'group', 'J', 'Argentina', 'Algeria', '2026-06-17T01:00:00Z'),
  (20, 'group', 'J', 'Austria', 'Jordan', '2026-06-17T04:00:00Z'),
  (21, 'group', 'K', 'Portugal', 'DR Congo', '2026-06-17T17:00:00Z'),
  (22, 'group', 'L', 'England', 'Croatia', '2026-06-17T20:00:00Z'),
  (23, 'group', 'L', 'Ghana', 'Panama', '2026-06-17T23:00:00Z'),
  (24, 'group', 'K', 'Uzbekistan', 'Colombia', '2026-06-18T02:00:00Z'),
  (25, 'group', 'A', 'Czechia', 'South Africa', '2026-06-18T16:00:00Z'),
  (26, 'group', 'B', 'Switzerland', 'Bosnia and Herzegovina', '2026-06-18T19:00:00Z'),
  (27, 'group', 'B', 'Canada', 'Qatar', '2026-06-18T22:00:00Z'),
  (28, 'group', 'A', 'Mexico', 'South Korea', '2026-06-19T01:00:00Z'),
  (29, 'group', 'D', 'United States', 'Australia', '2026-06-19T19:00:00Z'),
  (30, 'group', 'C', 'Scotland', 'Morocco', '2026-06-19T22:00:00Z'),
  (31, 'group', 'C', 'Brazil', 'Haiti', '2026-06-20T00:30:00Z'),
  (32, 'group', 'D', 'Türkiye', 'Paraguay', '2026-06-20T03:00:00Z'),
  (33, 'group', 'F', 'Netherlands', 'Sweden', '2026-06-20T17:00:00Z'),
  (34, 'group', 'E', 'Germany', 'Côte d''Ivoire', '2026-06-20T20:00:00Z'),
  (35, 'group', 'E', 'Ecuador', 'Curaçao', '2026-06-21T00:00:00Z'),
  (36, 'group', 'F', 'Tunisia', 'Japan', '2026-06-21T04:00:00Z'),
  (37, 'group', 'H', 'Spain', 'Saudi Arabia', '2026-06-21T16:00:00Z'),
  (38, 'group', 'G', 'Belgium', 'Iran', '2026-06-21T19:00:00Z'),
  (39, 'group', 'H', 'Uruguay', 'Cape Verde', '2026-06-21T22:00:00Z'),
  (40, 'group', 'G', 'New Zealand', 'Egypt', '2026-06-22T01:00:00Z'),
  (41, 'group', 'J', 'Argentina', 'Austria', '2026-06-22T17:00:00Z'),
  (42, 'group', 'I', 'France', 'Iraq', '2026-06-22T21:00:00Z'),
  (43, 'group', 'I', 'Norway', 'Senegal', '2026-06-23T00:00:00Z'),
  (44, 'group', 'J', 'Jordan', 'Algeria', '2026-06-23T03:00:00Z'),
  (45, 'group', 'K', 'Portugal', 'Uzbekistan', '2026-06-23T17:00:00Z'),
  (46, 'group', 'L', 'England', 'Ghana', '2026-06-23T20:00:00Z'),
  (47, 'group', 'L', 'Panama', 'Croatia', '2026-06-23T23:00:00Z'),
  (48, 'group', 'K', 'Colombia', 'DR Congo', '2026-06-24T02:00:00Z'),
  (49, 'group', 'B', 'Switzerland', 'Canada', '2026-06-24T19:00:00Z'),
  (50, 'group', 'B', 'Bosnia and Herzegovina', 'Qatar', '2026-06-24T19:00:00Z'),
  (51, 'group', 'C', 'Scotland', 'Brazil', '2026-06-24T22:00:00Z'),
  (52, 'group', 'C', 'Morocco', 'Haiti', '2026-06-24T22:00:00Z'),
  (53, 'group', 'A', 'Czechia', 'Mexico', '2026-06-25T01:00:00Z'),
  (54, 'group', 'A', 'South Africa', 'South Korea', '2026-06-25T01:00:00Z'),
  (55, 'group', 'E', 'Curaçao', 'Côte d''Ivoire', '2026-06-25T20:00:00Z'),
  (56, 'group', 'E', 'Ecuador', 'Germany', '2026-06-25T20:00:00Z'),
  (57, 'group', 'F', 'Japan', 'Sweden', '2026-06-25T23:00:00Z'),
  (58, 'group', 'F', 'Tunisia', 'Netherlands', '2026-06-25T23:00:00Z'),
  (59, 'group', 'D', 'Türkiye', 'United States', '2026-06-26T02:00:00Z'),
  (60, 'group', 'D', 'Paraguay', 'Australia', '2026-06-26T02:00:00Z'),
  (61, 'group', 'I', 'Norway', 'France', '2026-06-26T19:00:00Z'),
  (62, 'group', 'I', 'Senegal', 'Iraq', '2026-06-26T19:00:00Z'),
  (63, 'group', 'H', 'Cape Verde', 'Saudi Arabia', '2026-06-27T00:00:00Z'),
  (64, 'group', 'H', 'Uruguay', 'Spain', '2026-06-27T00:00:00Z'),
  (65, 'group', 'G', 'Egypt', 'Iran', '2026-06-27T03:00:00Z'),
  (66, 'group', 'G', 'New Zealand', 'Belgium', '2026-06-27T03:00:00Z'),
  (67, 'group', 'L', 'Panama', 'England', '2026-06-27T21:00:00Z'),
  (68, 'group', 'L', 'Croatia', 'Ghana', '2026-06-27T21:00:00Z'),
  (69, 'group', 'K', 'Colombia', 'Portugal', '2026-06-27T23:30:00Z'),
  (70, 'group', 'K', 'DR Congo', 'Uzbekistan', '2026-06-27T23:30:00Z'),
  (71, 'group', 'J', 'Algeria', 'Austria', '2026-06-28T02:00:00Z'),
  (72, 'group', 'J', 'Jordan', 'Argentina', '2026-06-28T02:00:00Z');

-- Pool config: currency USD, 1 point per correct --------------------------
update pool_config set currency = 'USD', points_per_correct = 1 where id = true;
