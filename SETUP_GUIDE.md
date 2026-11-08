# Setup guide — from zero to Android launch

Written for someone who has never used these tools. Follow it top to bottom; do not skip
steps. Each part ends with how you know it worked.

Please keep signed in, in one browser window:

- `supabase.com` — your database and login
- `vercel.com` — hosts your website
- `github.com` — your code repository
- `play.google.com/console` — where you publish the app

---

## Part 1 — Supabase (45 minutes)

### 1a. Is your old database still alive?

1. Go to `https://supabase.com` and sign in.
2. Open **Dashboard**. You will see either:
   - your project with a **Restore** button (it exists; last seen applied migrations
     `0000`+`0001`, i.e. base tables only — comments/notifications/follows/blocks and
     everything beyond `0001` is missing), or
   - an empty list.

### Choose one path:

**Path A — keep the data (restore + upgrade in place):** click Restore, wait, then run
`0002` → `0014` in order. `0000` and `0001` will report "already exists" — skip them.
Migration `0007` upgrades the legacy `comments` table (adds `author_id`, `parent_id`,
`updated_at`, drops `user_id`, backfills both) — data is preserved.

**Path B — start clean (no real data yet):** create a new project and run
`0000` → `0014` in order. Everything is green from scratch — `0007` works on both
schemas.

Both paths end at the same final database shape. If you have content in the old project
you care about, Path A is required; if it was only testing data, Path B is simpler.

### 1b. Create a new project (only if needed)

1. Dashboard → green **New project** button.
2. Choose your organization (there is one personal org by default).
3. Fill in:
   - **Name:** `ThoughtDrop`
   - **Database password:** click **Generate a password**. Copy it into Notepad
     immediately — you will never see it again.
   - **Region:** closest to you, e.g. `ap-south-1` (Mumbai).
   - **Plan:** Free.
4. Click **Create new project**. Wait about 2 minutes until the dashboard stops spinning.

### 1c. The three values you need (for Vercel)

1. Bottom-left: click the **gear icon** → **Project Settings**.
2. Click **API** in the left sub-menu (may be labelled API Keys or Data API).
3. Copy these into Notepad:
   - **Project URL** — `https://<random-string>.supabase.co`
   - **anon public** key — looks like a long token (`eyJ...` or `sb_publishable_...`)
   - **service_role secret** — click **Reveal** first. Server-side only, never show anyone.
4. The Project URL must **not** have anything after the `.supabase.co`. Right:
   `https://abcdefgh.supabase.co`. Wrong:
   `https://abcdefgh.supabase.co/rest/v1/`.

### 1d. Create the database tables

1. Left sidebar → **SQL Editor** (terminal icon).
2. Click **+ New query**.
3. Open `D:\ThoughtDrop\supabase\migrations`. There are 15 files numbered `0000`–`0014`.
4. For **each file, in numeric order** (Path B: all of `0000`→`0014`; Path A: skip
   `0000` and `0001`):
   - Open it in Notepad → `Ctrl+A`, `Ctrl+C`
   - Back in the browser: paste into the SQL Editor
   - Click **Run** (green button, or `Ctrl+Enter`)
   - Wait for **"Success. No rows returned"** (red message? note the file and the words;
     `relation ... already exists` = object already there, skip this file;
     `function or relation "y" does not exist` = you skipped the file that creates "y")

**Both paths now lead to the same final database shape.** Migration `0007` was rewritten
to upgrade the legacy `comments` table in place (adds `author_id`, `parent_id`,
`updated_at`, drops `user_id`, preserves rows), so Path A and Path B behave identically.
5. Final verification — run these in the SQL Editor, all should return rows:

   ```sql
   select name from storage.buckets where id = 'idea-media';
   select column_name from information_schema.columns
    where table_schema='public' and table_name='users';
   select count(*) from public.user_blocks;
   select count(*) from public.push_tokens;
   select conname from pg_constraint where conname = 'notifications_type_check';
   ```

### 1e. Tell Supabase which apps may sign in

1. Left sidebar → **Authentication**.
2. Open **URL Configuration**.
   - **Site URL:** `https://thought-drop-eight.vercel.app`
   - Under **Redirect URLs** click **Add URL** three times, adding exactly:
     - `https://thought-drop-eight.vercel.app/auth/callback`
     - `https://thoughtdrop.app/auth/callback` (for later, if you attach the custom domain)
     - `com.thoughtdrop.app://login-callback`
   - **Save.**
3. Still under **Authentication** → **Providers** (or Sign In / Providers):
   - Toggle **Email** **ON** — this is how you sign in inside the Android app.
   - Optional: enable **GitHub** and **Google**. Each needs a Client ID/Secret created in
     that provider's console and its redirect URL pasted there. Skip if unclear — email
     sign-in is enough, and Play reviewers can use it.

**Done when:** Part 1c values exist in Notepad, verification queries return rows,
`Email` is ON, and both redirect URLs are saved.

---

## Part 2 — Deploy the site (45 minutes)

### 2a. Push the code to GitHub

In PowerShell at `D:\ThoughtDrop`:

```powershell
git status           # you will see many changed/new files
git add .
git commit -m "Android release"
git push
```

(Repo: `https://github.com/PrinceBhalse/ThoughtDrop.git` — your GitHub login is already
set up on this machine.)

### 2b. Import the project on Vercel

1. `https://vercel.com/new` → Sign in with **GitHub** (must be the same GitHub account
   that owns the repo).
2. **Import Git Repository** → find `PrinceBhalse/ThoughtDrop` → **Import**.
3. **Framework Preset** says `Next.js` automatically — leave it.
4. Open **Environment Variables**. For every row: type Key, paste Value, click **Add**:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL from 1c |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key from 1c |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key from 1c |
   | `NEXT_PUBLIC_SITE_URL` | `https://thought-drop-eight.vercel.app` (until you attach the custom domain — see §2c) |
   | `ADMIN_EMAILS` | your email |

5. **Deploy**. Wait ~2–3 minutes. On **Congratulations**, click the preview URL
   (`…-princeb.vercel.app`). The ThoughtDrop home page should load; sign up and post a
   test idea there. If it works, the deploy is healthy.

### 2c. Optional: attach a custom domain (SKIP for now — launch works without it)

> **Updated Nov 2026:** the site is fully live at
> `https://thought-drop-eight.vercel.app` (all 7 health checks pass). The app now
> launches on that URL and `thoughtdrop.app` is **not required** for the Play Store
> submission — the Play listing accepts any working URL. Do this section only after
> the app is validated with real testers.

**First, the mystery of thoughtdrop.app:** it IS registered — at Cloudflare
Registrar, registered 2025-08-20, expires 2027-08-20. It currently returns error
525 (registered + parked, no origin). Log in to `https://dash.cloudflare.com` with
your usual email:

- **If you see `thoughtdrop.app` in your dashboard** → you bought it and forgot →
  you own it. In that dashboard: **DNS → Records → Add record**: type `CNAME`,
  name `@`, target `cname.vercel-dns.com`, **proxy = grey cloud (DNS only)**.
  Then add `thoughtdrop.app` in Vercel → Settings → Domains. 5 minutes, done.
  (That grey-cloud CNAME is exactly what removes the 525.)
- **If you do NOT see it** → someone else owns it until Aug 2027. Launch on the
  Vercel URL, and if/when you want a custom brand domain, buy any name you're
  sure of directly in Cloudflare (**Domain Registration → Register Domain**) —
  Cloudflare Registrar is at-cost pricing, and its DNS is already there.

**Whenever a custom domain is attached, do these two updates (in this order):**

1. Change `NEXT_PUBLIC_SITE_URL` to the new domain in:
   - Vercel → Settings → Environment Variables → **Redeploy** after saving
   - `D:\ThoughtDrop\.env.local` (line 4)
   - `D:\ThoughtDrop\capacitor-web\index.html` (`APP_URL`)
2. Supabase → Authentication → URL Configuration:
   - **Site URL:** `https://<new-domain>`
   - **Redirect URLs:** `https://<new-domain>/auth/callback`,
     `com.thoughtdrop.app://login-callback`
3. Verify, then rebuild the APK/AAB:

```powershell
cd D:\ThoughtDrop
npm run check:deploy -- https://<new-domain>
npm run android:sync
npm run android:aab
```

All seven checks must say **PASS**. If one fails, paste me the output.

**Done when:** seven PASS lines and a working `.vercel.app` site.

---

## Part 3 — Rebuild and install the Android app (30 minutes)

PowerShell at `D:\ThoughtDrop`:

```powershell
$env:ANDROID_HOME = "C:\Users\Prince\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = "C:\Program Files\Java\jdk-23"
npm run android:sync
npm run android:apk
npm run android:aab      # this is the file you upload to Play
```

Install on your phone (USB debugging enabled):

```powershell
adb install -r D:\ThoughtDrop\android\app\build\outputs\apk\debug\app-debug.apk
```

On the phone:

- [ ] Cold open shows the splash → your feed (not the offline screen)
- [ ] Create account (onboarding asks DOB; **tick the Terms checkbox**)
- [ ] Post, edit, delete an idea
- [ ] Comment, reply, edit your own comment; **Report** someone else's comment
- [ ] **Block** someone: their comments vanish instantly; profile shows blocked state;
      **Unblock** restores everything
- [ ] Upvote (haptic), follow, share sheet opens
- [ ] Hardware Back walks back through the app
- [ ] Sign out and back in — still logged in data persisted
- [ ] `https://thoughtdrop.app/privacy`, `/terms`, `/account/delete` all load inside the app

---

## Part 4 — Push notifications (optional, 20 minutes)

1. `https://console.firebase.google.com` → **Add project** → `ThoughtDrop` → turn Google
   Analytics **off** → **Create**.
2. Click the **Android robot** icon → register app with package name exactly
   `com.thoughtdrop.app` → **Register app** → **Download google-services.json** → move it to
   `D:\ThoughtDrop\android\app\`.
3. Gear icon → **Project settings** → **Service accounts** → **Generate new private key** →
   confirm → a `.json` file downloads. Open it in Notepad, select all, copy.
4. Vercel → **Settings → Environment Variables**, add:
   - `FIREBASE_SERVICE_ACCOUNT` = the whole JSON
   - `CRON_SECRET` = any long random string
5. Vercel → **Deployments → ⋯ → Redeploy** so the new values take effect.
6. GitHub → your repo → **Settings → Secrets and variables → Actions → New repository
   secret**: name `CRON_SECRET`, value = the same random string. (This keeps the push
   dispatcher running every 10 minutes; Vercel Hobby crons run only once a day.)
7. Rebuild: `npm run android:aab`. Then test with a second account commenting on your idea.

**Skipping?** The app still works fully; you simply get no push notifications (in-app
notification bell still works).

---

## Part 5 — Google Play Console (2–3 h + 14 days)

1. `https://play.google.com/console` → **All apps → Create app**:
   name `ThoughtDrop`, default language English, App, Free, accept the declarations.
2. Left sidebar tasks — fill each one:
   - **App access** → "All or some functionality is restricted" → give your own
     email + password test account. Play reviewers will sign in with it.
   - **Ads** → No ads.
   - **Content rating** → Social/Communication; answer truthfully; user-generated
     content = **Yes**. Expect Everyone/Teen.
   - **Target audience** → 13+.
   - **Data safety** → copy the answers from `PLAY_STORE_RELEASE.md` §B5.
   - **Account deletion** → URL `https://thoughtdrop.app/account/delete`
   - **Privacy policy** → `https://thoughtdrop.app/privacy`
3. **Store listing**: copy title / short / full description from
   `PLAY_STORE_RELEASE.md` §B4. Icon `play-store/icon-512.png`; feature graphic
   `play-store/feature-graphic-1024x500.png`; upload 2–8 screenshots taken on your phone
   (feed, idea detail, editor, profile look best).
4. **Testing → Closed testing → Create new track** → upload
   `android/app/build/outputs/bundle/release/app-release.aab` → add **12 tester Gmail
   addresses**.
5. **Wait 14 days.** They must stay opted in the whole time; if they drop off you do it
   again. Keep them using the app once a day.
6. **Apply for production access** (button appears after the window passes).
7. Roll out in stages: 10% → 50% → 100%, watching **Vitals** between steps.

---

## Order of operations

```
Supabase restore-or-recreate → run migrations → auth URLs → Vercel deploy →
Cloudflare DNS → check:deploy passes → rebuild APK/AAB → device smoke test →
Firebase (optional) → Play listing + forms → closed test (12 testers, 14 days) →
production rollout
```

**If you get stuck on any step, paste me the exact error text and the command you ran.**
