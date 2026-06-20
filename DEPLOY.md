# Deploy from an iPad (browser only — no computer, no terminal)

You can get La Quiniela live entirely from Safari on an iPad. ~10 minutes.
Two free accounts: **Supabase** (database) and **Vercel** (the app).

---

## 1. Create the database (Supabase)

1. Go to **supabase.com** → sign in with GitHub → **New project**.
   - Pick a name and a database password (save it somewhere) → **Create**.
   - Wait ~1 minute for it to finish setting up.
2. Open **SQL Editor** (left sidebar) → **New query**.
3. In a new browser tab open the repo file
   **`supabase/migrations/0001_init.sql`** on GitHub, tap **Raw**, select all,
   copy. Paste it into the SQL editor → **Run**. (Creates the tables.)
4. New query again. Open **`supabase/seed/seed.sql`** → **Raw** → copy → paste →
   **Run**. (Loads the 13 members, Angelo as admin, and all 72 fixtures.)
5. Open **Project Settings → API**. Keep this tab — you'll copy two values next:
   - **Project URL**
   - **service_role** key (under "Project API keys" — the secret one)

---

## 2. Deploy the app (Vercel)

1. Go to **vercel.com** → sign in with GitHub → **Add New… → Project**.
2. Import **`connolyc-design/jubilant-computing-machine`**.
   - Under **Branch**, choose **`claude/la-quiniela-world-cup-pool-tzsdu8`**
     (until it's merged to main).
3. Expand **Environment Variables** and add these (names exactly):

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | the Project URL from Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | the service_role key from Supabase |
   | `POOL_PASSWORD` | a password you'll share with the group |
   | `ADMIN_PIN` | a PIN only Angelo knows (e.g. 6 digits) |
   | `SESSION_SECRET` | any long random string (30+ characters) |
   | `CRON_SECRET` | any random string (optional, for the cron) |

4. Tap **Deploy**. After ~1 minute you'll get a link like
   **`la-quiniela-xxxx.vercel.app`**.

That's it — open the link, pick your name, type the `POOL_PASSWORD`, and you're in.
Results fill in automatically as matches finish. Angelo enters the admin PIN to
manage members and the pot. Share the link + the password with the group.

---

## Notes

- **Changing fixtures/passwords later:** edit env vars in Vercel → Redeploy.
- **Re-seeding:** the seed SQL is safe to run again (it replaces fixtures and
  skips members that already exist).
- Want this on a nicer domain (e.g. `laquiniela.app`)? Add it in Vercel →
  Settings → Domains.

> Can't run the full app *without* deploying: it needs the Supabase database, and
> a phone/tablet can't host that. The steps above are the genuinely-easiest way,
> and they work 100% from the iPad browser.
