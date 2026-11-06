# What's left to do — Android launch

Code is finished and verified (typed, linted, production build, signed AAB/APK, 0/0
warnings). Twenty-one isolated advisory reports remain in dev-only tooling
(@capacitor/assets, eslint-config-next, sharp/libheif); none affect the shipped app.

**Context from last check:** `https://thoughtdrop.app` answers HTTP 525 (no working
origin) and the Supabase host in `.env.local` no longer resolves. Both are external to
this repo and block the app from working no matter how good the code is — and neither can
be done by me. Fix them in the order below; the whole project is unblocked by step 2.

**Read from zero:** [SETUP_GUIDE.md](SETUP_GUIDE.md) — click-by-click instructions for
Supabase, Vercel, DNS, Firebase and Play, written for someone who has never used these
tools.

Everything here is in dependency order. Steps 1–3 take about **3 hours**; step 4 is the
real one, the closed test.

---

## Step 1 — Supabase (45 min)

Your existing project is unreachable. Easiest path: create a fresh project in the same
region (e.g. Mumbai) and run **all** migrations, starting from `0000`:

1. Supabase Dashboard → New project → note the Project URL, the `anon`/publishable key and
   the `service_role` key (Project Settings → API). Do **not** use the `/rest/v1/` suffix
   in the URL.
2. Dashboard → SQL Editor → paste and Run each file, in order:

   ```
   0000_initial_schema.sql  0001_v2_features.sql  0002_phase2_collaboration.sql
   0003_phase3_admin_moderation.sql  0004_infrastructure.sql
   0005_upvotes_search_crud.sql  0006_profile_fields.sql
   0007_comments.sql  0008_bookmarks.sql  0009_follows.sql
   0010_notifications.sql  0011_push_tokens.sql
   0012_idea_media_storage.sql  0013_notification_events.sql
   0014_user_safety.sql
   ```

   After each paste, press **RUN**. If it errors with "already exists", skip that file and
   continue — the later files are defensive.
3. **Authentication → URL Configuration:** Site URL = `https://thoughtdrop.app`
   Add redirect URLs (both, exactly as written — one is the custom-scheme callback the
   Android OAuth flow returns to):

   ```
   https://thoughtdrop.app/auth/callback
   com.thoughtdrop.app://login-callback
   ```
4. **Authentication → Providers:** enable **Email** (password sign-in — this is how an
   Android reviewer can sign in; Play will test this). Enable GitHub/Google too if you
   want, add each provider's callback URL, and set
   `https://<project-ref>.supabase.co/auth/v1/callback` inside each provider's console.
5. Verify in SQL Editor — all must return one or more rows:

   ```sql
   select id from storage.buckets where id = 'idea-media';
   select conname from pg_constraint where conname='notifications_type_check';
   select column_name from information_schema.columns
    where table_schema='public' and table_name='users' and column_name='terms_accepted_at';
   select count(*) from public.user_blocks;   -- 0 is fine, just no error
   ```

**What this gives you:** a working backend — user accounts, comments, upvotes, bookmarks,
notifications, push tokens plus the new **block/report users** tables and the
terms_accepted_at recorded at signup.

---

## Step 2 — Environment + deploy (45 min)

1. Commit and push the repo to GitHub origin (`github.com/PrinceBhalse/ThoughtDrop`).
2. Vercel → Import project (Next.js auto-detect). Environment variables:

   | Name | Value | Secret? |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 1 | no |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 1 | no |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 1 | **yes** — needed for account deletion + push dispatch |
   | `NEXT_PUBLIC_SITE_URL` | `https://thoughtdrop.app` | no |
   | `ADMIN_EMAILS` | your email | no |
   | `FIREBASE_SERVICE_ACCOUNT` | Firebase private key JSON (or base64) — step 4 | **yes** |
   | `CRON_SECRET` | any long random string — step 4 | **yes** |

3. **Attach the domain.** Add `thoughtdrop.app` and `www.thoughtdrop.app` in Vercel →
   Settings → Domains; copy the DNS records it shows into **Cloudflare** (your DNS). It
   returns **525** today because there's no backing origin. Set Cloudflare SSL/TLS to
   **Full (strict)**.
4. Verify from any terminal (exit code 0):

   ```bash
   npm run check:deploy -- https://thoughtdrop.app
   ```

   Must print `PASS  …  7/7`. If a check fails, fix that one first.

---

## Step 3 — Native build + install + smoke test (45 min)

```bash
cd D:\ThoughtDrop
$env:ANDROID_HOME = "C:\Users\Prince\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = "C:\Program Files\Java\jdk-23"
npm run android:sync     # syncs web assets to the native project
npm run android:apk      # debug APK
npm run android:aab      # signed release bundle
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

Then, on the phone:

- [ ] Cold start: splash, then feed (no white flash, no offline screen)
- [ ] Create account with email + password in the app (onboarding asks for DOB; **must**
      show the terms checkbox — that's the Play UGC requirement that users accept terms
      before creating content)
- [ ] Post, edit (⋯ on your own idea), delete an idea
- [ ] Comment, reply, edit your own comment; **Report** another person's comment — must
      say "Reported"
- [ ] **Block** another user: their comments disappear instantly; opening their profile
      shows the "blocked" screen; unblocking restores everything
- [ ] Upvote (haptic tick), follow, share sheet
- [ ] Hardware Back walks the app history, minimizes at the feed
- [ ] `android.intent.action.VIEW https://thoughtdrop.app/idea/<id>` opens the app, not
      Chrome
- [ ] Sign out, sign in again with the same credentials — profile persisted
- [ ] Delete account button at `/profile/edit` — removes the whole account

Minimum device target: Android 7.0 (minSdk 24). Test on whatever you actually run.

---

## Step 4 — Firebase + Push (20 min, optional but recommended)

Push is what makes Play's "repackaged website" rejection impossible.

1. Firebase → **Add project** → **Add Android app** → package `com.thoughtdrop.app` →
   download `google-services.json` → place at `android/app/google-services.json`
   (git-ignored).
2. Project Settings → Service accounts → **Generate new private key**. Add that JSON (or a
   base64 of it) as `FIREBASE_SERVICE_ACCOUNT` in Vercel, and set `CRON_SECRET`.
3. Rebuild: `npm run android:aab` — Firebase Messaging gets picked up automatically once
   the file exists.
4. `.github/workflows/push-dispatch.yml` is already committed: set repo **Settings →
   Secrets and variables → Actions**: secret `CRON_SECRET` (same value) and optional
   variable `SITE_URL`. It delivers pushes every 10 minutes (Vercel Hobby crons run once
   a day, so Actions does this job).
5. Test: open the app on the phone → (grant notification permission) → have another
   account comment on your idea → push arrives → tapping it opens that idea inside the
   app.

No Firebase? The app installs and everything else works; only push is absent.

---

## Step 5 — Google Play (2–3 h hands-on + 14-day clock)

Identity verification on your new $25 personal account must finish first. Everything in
sections 1–4 above must be done before this.

1. **Play Console → Create app** — name `ThoughtDrop`, English, App, Free, accept terms.
2. **Store listing** — branding in `play-store/`, all text copy/alternates in
   `PLAY_STORE_RELEASE.md` §B4:
   - icon `play-store/icon-512.png`
   - feature graphic `play-store/feature-graphic-1024x500.png`
   - **2–8 phone screenshots** — capture on the device: feed, idea detail, editor,
     profile. 16:9 or 9:16, 1080×1920 is fine.
   - Short description (80 chars) and full description (4000 max) from the doc.
   - Contact email — change `CONTACT_EMAIL` in `src/lib/site.ts` if you want a different
     one and redeploy.
3. **App content** (all must be completed):
   - Privacy policy URL → `https://thoughtdrop.app/privacy`
   - **App access** → state that all functionality requires login, provide your own
     test account (email + password created via the app) — Play will sign in with it.
   - Ads → no ads. Content rating → Social/Communication, **user-generated content = yes**,
     expect Everyone/Teen. Target audience → 13 and over. News → No.
   - Data safety → answers pre-filled in `PLAY_STORE_RELEASE.md` §B5 (account deletion URL
     → `https://thoughtdrop.app/account/delete`).
   - **User-generated content:** the app now has in-app reporting and blocking of users
     and content, ToS acceptance at signup, and admin moderation — state exactly that.
4. **Testing → Closed testing:** create a release, upload `app-release.aab`, add **12
   testers** (Gmail accounts you control or friends). Their **14-day continuous** opt-in
   window is the pacing item — nothing else can compress it. Start it ASAP, keep them
   engaged with one nudge per few days.
5. **Production access:** after 14 days, apply. Then staged rollout 10% → 50% → 100%,
   watching **Vitals** and pre-launch reports between steps.
6. **After the first upload:** Play Console → App integrity → copy the **Play App Signing
   SHA-256** → add it next to the existing fingerprints in
   `public/.well-known/assetlinks.json` → redeploy → on the phone:
   `adb shell pm get-app-links com.thoughtdrop.app` (should say `verified`).

---

## What's already done (don't redo)

- Native shell: splash, status bar, keyboard resize, back button, App Links,
  cold-start deep links, native share, haptics, app-loading loader page with offline
  retry, `allowBackup=false`, cleartext disabled.
- Sign-in that actually works in the WebView: email + password, and GitHub/Google via a
  Custom Tab returning to `com.thoughtdrop.app://login-callback`.
- **Play UGC compliance (just shipped):** block users (feed, comments, profiles and
  notifications all hide their content), report users, ToS acceptance checkbox at signup,
  auto-severed follows on block, block/unblock from profile or any comment.
- Account deletion page + API (`/account/delete` + `POST /api/account/delete`), privacy
  policy and terms (`/privacy`, `/terms`), App Links file, store icon + feature graphic,
  reassemble, `PLAY_STORE_RELEASE.md`.
- Debug APK 7.38 MB, signed release AAB 5.22 MB built and verified.

## After launch — delivery plan

1. **Dogfood (week 1):** you + 2–3 people, daily. Fix the three worst issues.
2. **Soft launch (weeks 2–3):** the closed testers become your first community. Ask each
   for one posted idea. Target 10 posters, not installs.
3. **Public launch (week 4+):** one primary channel + two secondary. Product Hunt
   (Tue–Thu), Show HN, r/SideProject, Indie Hackers, link in bio, build-in-public posts.
   Lead with *forking* — every shared idea link is an install link via App Links.
4. **Retention:** push only real events (≤2/week), weekly top-5 digest, a featured-idea
   slot on the home feed, an update every 2–3 weeks (bump `APP_VERSION_CODE`).
5. **Measure:** install→sign-up >40%, sign-up→first post >50%, D7 retention >10%. If D7
   is lower, fix onboarding/feed/empty states before marketing.
