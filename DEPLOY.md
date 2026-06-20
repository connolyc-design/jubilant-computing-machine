# Deploy from an iPad (browser only — no computer, no terminal)

You can get La Quiniela live entirely from Safari on an iPad. ~10 minutes.
Two free accounts: **Supabase** (database) and **Vercel** (the app).

---

## 1. Create the database (Supabase)

### 1a. Sign in
1. In Safari, go to **supabase.com**.
2. Tap **Start your project** (or **Sign In**, top right).
3. Tap **Continue with GitHub**. If GitHub asks, tap **Authorize supabase**.
   (If you don't have a GitHub account yet, create one first at github.com — it's
   free — then come back.)

### 1b. Create an organization (first time only)
4. If it asks for an **organization**: type any name (e.g. "Quiniela"),
   set **Type = Personal** and **Plan = Free**, then tap **Create organization**.

### 1c. Create the project
5. Tap **New project**.
6. Fill in:
   - **Name:** `la-quiniela` (anything is fine).
   - **Database Password:** tap **Generate a password**, then **Copy it and save
     it** in your Notes (you won't need it for this app, but Supabase wants one).
   - **Region:** pick the closest — **South America (São Paulo)** for Lima.
   - **Plan:** **Free**.
7. Tap **Create new project**. Wait ~1–2 minutes while it says "Setting up
   project…". When the dashboard appears, it's ready.

### 1d. Run the setup SQL (creates tables + loads all data in one go)
8. In the left sidebar tap **SQL Editor** (the icon that looks like `>_`).
9. Tap **+ New query** (top left of that panel).
10. Open the setup file in a **new Safari tab**:
    `github.com/connolyc-design/jubilant-computing-machine/blob/claude/la-quiniela-world-cup-pool-tzsdu8/supabase/setup.sql`
    → tap the **Raw** button (top right of the file) → tap and hold the text →
    **Select All** → **Copy**.
11. Go back to the Supabase tab, tap inside the empty query box, **Paste**.
12. Tap **Run** (bottom-right green button).
13. You should see **"Success. No rows returned"** — that's correct. The tables,
    the 13 members (+ Angelo as admin), and all 72 fixtures are now loaded.

> Want to double-check? Left sidebar → **Table Editor** → open **members**
> (should show 14 rows) and **matches** (should show 72 rows).

### 1e. Copy the two API values you'll need for Vercel
14. Left sidebar → **Project Settings** (gear icon at the bottom) → **API**.
15. Leave this tab open. You'll copy two things in Step 2:
    - **Project URL** (under "Project URL").
    - **service_role** key (under "Project API keys" → tap **Reveal** next to
      `service_role`, then copy). This one is secret — only goes into Vercel,
      never share it publicly.

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
