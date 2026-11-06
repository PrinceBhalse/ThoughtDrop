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
   - your project with a **Restore** button (free projects pause after ~7 days without use), or
   - an empty list.
3. **If you see Restore:** click it, wait for it to finish, then jump to **1c** and check
   that the data survived. Done in 2 minutes. **Stop here and do this first.**
4. **If the list is empty:** the project is gone. Follow **1b**. Your data cannot be
   recovered, but your schema can be rebuilt from the files in `supabase/migrations`.

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
4. For **each file, in numeric order**:
   - Open it in Notepad → `Ctrl+A`, `Ctrl+C`
   - Back in the browser: paste into the SQL Editor
   - Click **Run** (green button, or `Ctrl+Enter`)
   - Wait for **"Success. No rows returned"** (red message? note the file and the words,
     skip to the next file)
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
   - **Site URL:** `https://thoughtdrop.app`
   - Under **Redirect URLs** click **Add URL** twice, adding exactly:
     - `https://thoughtdrop.app/auth/callback`
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
   | `NEXT_PUBLIC_SITE_URL` | `https://thoughtdrop.app` |
   | `ADMIN_EMAILS` | your email |

5. **Deploy**. Wait ~2–3 minutes. On **Congratulations**, click the preview URL
   (`…-princeb.vercel.app`). The ThoughtDrop home page should load; sign up and post a
   test idea there. If it works, the deploy is healthy.

### 2c. Attach thoughtdrop.app

The site is hosted by Cloudflare but has no working server behind it (that is the **525**
error you get today).

1. Vercel → Settings → **Domains** → type `thoughtdrop.app` → **Add**.
2. Vercel shows the DNS records it wants — usually `CNAME` → `cname.vercel-dns.com`.
3. Open Cloudflare: `https://dash.cloudflare.com` → click `thoughtdrop.app` →
   **DNS → Records** → **Add record**:
   - Type `CNAME`, Name `@`, Target = the record Vercel showed you
   - **Proxy status: click the orange cloud until it is grey** (DNS only — simplest)
4. (Optional) Same for `www`.
5. Cloudflare → **SSL/TLS → Overview** → **Full (strict)**.
6. Wait 5–10 minutes. Then:

```powershell
cd D:\ThoughtDrop
npm run check:deploy -- https://thoughtdrop.app
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
