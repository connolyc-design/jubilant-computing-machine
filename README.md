# La Quiniela — World Cup 2026 Pool

A mobile-first web app that replaces the family Excel sheet used to run a World
Cup 2026 prediction pool (*quiniela*) for a friend group in Lima, Peru. Members
predict each match (`1` = Equipo 1, `2` = Equipo 2, `0` = draw); correct picks
earn points; a live leaderboard ranks everyone; a light money layer tracks the
pot and payouts.

> Made by Angelo Chavez and Connoly Chavez · *Hecho por Angelo Chávez y Connoly Chávez*

## Stack

- **Next.js (App Router)** + **TypeScript** + **Tailwind**
- **Supabase** (Postgres) for data
- **next-intl** for full ES/EN localization (Spanish default), all times shown in **Lima** (`America/Lima`)
- Auth: **pick your name + shared pool password** (admin has an extra PIN). No emails required.

## How scoring works (the heart of it)

See [`src/lib/scoring.ts`](src/lib/scoring.ts) — pure, fully-commented, and unit
tested in [`tests/scoring.test.ts`](tests/scoring.test.ts). It reproduces the
spreadsheet exactly: **1 point per correct prediction, 0 otherwise**, no
exact-score bonus. `points_per_correct` is a config value (default `1`) so it
can be changed later.

```bash
npm test        # run the scoring tests
```

## Build status (phased — see the build prompt)

- [x] **Phase 1** — scaffold, schema, scoring engine + tests, ES/EN i18n shell with toggle, Lima-time helper, pick-name/password auth
- [x] **Phase 2** — members + admin roles, paid tracking (`/admin/members`)
- [x] **Phase 3** — 72 real group-stage fixtures (Lima time) + `1/0/2` prediction UI, lock-at-kickoff, picks hidden until kickoff
- [x] **Phase 4** — admin results entry (`/admin/results`) + auto-scoring + live leaderboard (PUNTAJE/PUESTO)
- [x] **Phase 5** — pot total + payout calculator from standings (`/pot`)
- [x] **Phase 6** — pot-config admin UI, ES/EN parity, About credit
- [x] **Auto-results** — scheduled sync writes finished-match GANADORs (no manual entry)

> **Kickoff times:** matchups, dates, groups, and kickoff times come from the
> real 2026 schedule (sourced from the openfootball dataset, with exact per-venue
> UTC offsets) and are stored in UTC / rendered in Lima time. Every fixture is
> still **admin-editable** in case of any official change.

## Deploy from a phone/iPad (no computer)

See **[DEPLOY.md](DEPLOY.md)** — a browser-only, ~10-minute guide using the
Supabase and Vercel web UIs. The data seed is provided as paste-in SQL
(`supabase/seed/seed.sql`) so no terminal is needed.

## Local setup

1. **Install deps**

   ```bash
   npm install
   ```

2. **Create a Supabase project** (https://supabase.com) and run the migration in
   the SQL editor (or via the Supabase CLI):

   ```
   supabase/migrations/0001_init.sql
   ```

3. **Configure env** — copy `.env.example` to `.env.local` and fill in:

   | Var | What |
   |-----|------|
   | `SUPABASE_URL` | Project URL (Settings → API) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
   | `POOL_PASSWORD` | Shared password members type to enter |
   | `ADMIN_PIN` | Extra PIN for admin actions |
   | `SESSION_SECRET` | 32+ random chars (`openssl rand -base64 32`) |

4. **Seed the roster**

   ```bash
   npm run seed
   ```

5. **Run**

   ```bash
   npm run dev
   ```

## Deploy

Deploy to **Vercel**: import the repo, add the same env vars in Project
Settings, and ship. Shareable by link — no app store.

## Automatic results

Results update **on their own** — Angelo doesn't have to enter them, and there's
**nothing to set up**. The app pulls finished group-stage scores from the
openfootball 2026 feed, derives the GANADOR (`1`/`2`/`0`), and writes it to the
DB. It only sets a result once a match's **kickoff has passed**, so no future
result can leak before lock.

Three ways it stays current (you don't have to choose — they layer):

1. **Sync on view (default, zero config).** Opening the app or the leaderboard
   triggers a throttled sync (at most once every ~10 min, with a race guard), so
   whoever looks first refreshes it for everyone. Works on any hosting plan.
2. **Cron (optional).** `/api/sync` runs on a Vercel Cron every 2 h
   (`vercel.json`); protect it with `CRON_SECRET`. Handy so the table is fresh
   even if nobody has the app open.
3. **Manual.** A **Sync now** button on the admin panel, and manual
   entry/override at `/admin/results`.

## Money layer

Informational only. The app tracks who has paid the buy-in, the total pot, and
each winner's payout from the final standings. It does **not** process payments
— settle off-app (Yape / Plin / cash).
