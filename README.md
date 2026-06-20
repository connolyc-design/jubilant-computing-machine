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
- [ ] Phase 6 — final ES/EN polish pass, mobile polish, pot-config admin UI

> **Note on kickoff times:** matchups + dates come from the real 2026 draw; the
> exact kickoff times were generated from the official daily slots (Lima = ET−1h)
> and are **admin-editable** — worth a quick verification pass before the group
> relies on lock-at-kickoff.

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

## Money layer

Informational only. The app tracks who has paid the buy-in, the total pot, and
each winner's payout from the final standings. It does **not** process payments
— settle off-app (Yape / Plin / cash).
