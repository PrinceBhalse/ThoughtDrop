# Publishing ThoughtDrop to Google Play

The Android app is a native shell around the deployed Next.js site. **Start with
[LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)** — the ordered, checked-off version of this
document (accounts → backend → deploy → device test → Play → rollout).

Everything in **Section A** is already done and verified. **Section B** is the weekend
list — it needs accounts, payment and a device/emulator, which only you can provide.

Verified build outputs:

| Item | Value |
|------|-------|
| Signed release bundle | `android/app/build/outputs/bundle/release/app-release.aab` (5.22 MB) |
| Debug APK (sideload test) | `android/app/build/outputs/apk/debug/app-debug.apk` (7.38 MB) |
| Package | `com.thoughtdrop.app` |
| versionCode / versionName | `1` / `1.0.0` |
| minSdk / targetSdk | 24 (Android 7.0) / 36 (Android 16) |
| Signing | `android/app/thoughtdrop-release.keystore`, alias `thoughtdrop` |
| Upload-key SHA-256 | `D3:4F:AD:58:22:D4:A2:16:28:8D:EE:2C:E0:09:BF:F9:CD:78:2E:FE:1F:D1:06:9D:00:42:81:E0:CD:72:C8:75` |

> **Status right now (checked on 22 Oct 2026):** the code is ready, but the two external
> services are not. `https://thoughtdrop.app` resolves through Cloudflare and answers
> **HTTP 525** (no working origin), and the Supabase host configured in `.env.local`
> (`protltcvgpfgialbijti.supabase.co`) **does not resolve at all** — so `/api/feed`
> returns 500 and the APK would sit on the offline screen. Both must be fixed before the
> APK is installable in any useful way. Run `npm run check:deploy -- https://<domain>`
> to verify after deploying.

---

## A. Already done

**Native shell**

- Capacitor 8 Android project, launch mode `singleTask`, state restore, hardware Back
  routed through app history (and `minimizeApp` at the root).
- Splash screen, status bar (`#131620`), keyboard `native` resize, dark webview
  background — no white flash.
- App Links for `https://<site>/idea/*` and `/profile/*` (`autoVerify`), host rewritten
  from `NEXT_PUBLIC_SITE_URL` by `npm run android:sync`.
- Native Android share sheet for ideas (falls back to Clipboard on web).
- FCM push: permission request, `default` notification channel (Android 8+), token
  stored in `push_tokens`, tap → deep route, cold-start routing (60s window) with tray
  cleanup. Registration degrades gracefully when Firebase is not configured.
- **Play UGC compliance built in**: terms acceptance at signup (recorded as
  `users.terms_accepted_at`), in-app **report user** and **block user** on profiles and
  on every comment, blocking conceals their ideas/comments/notifications for the
  reporter, and again after unblock everything comes back. Notifications via DB triggers
  also respect blocks (`is_blocked_by` in `0014`).
- Sign-in that actually works in a WebView: email + password (sign-in and sign-up) plus
  GitHub/Google through a Custom Tab and a `com.thoughtdrop.app://login-callback` deep
  link that exchanges the PKCE code inside the app. The old server-side OAuth redirect
  would have left the session in Chrome instead of the app.
- Forgot the flow? `getLaunchUrl` handles cold starts from App Links and OAuth returns;
  handled launch URLs are de-duplicated in `localStorage`.
- Haptic feedback on upvote (native only).
- `allowBackup=false` so auth tokens are not cloud-backed up.
- Permissions limited to `INTERNET`, `POST_NOTIFICATIONS`, `VIBRATE`,
  `ACCESS_NETWORK_STATE`; cleartext HTTP disabled.

**Brand and store assets**

- Adaptive launcher icon, legacy icon, round icon, 74 Android density resources,
  light/dark splash from the real logo.
- `play-store/icon-512.png` (512×512, opaque) and
  `play-store/feature-graphic-1024x500.png` — regenerate with
  `node scripts/generate-store-assets.js`.
- Regenerate the rest with `npm run assets:brand` (needs `D:/Downloads/ThoughtDrop.png`
  or `LOGO_SOURCE=<path>`).

**Policy pages (hosted on the site, so they work inside the app too)**

- `/privacy` — full privacy policy (data collected, processors, retention, rights).
- `/terms` — terms of use.
- `/account/delete` — public deletion page + instant in-app deletion for signed-in
  users (typed `DELETE` confirmation). Backed by `POST /api/account/delete`, which
  removes ideas, comments, votes, bookmarks, follows, notifications, push tokens,
  forks, reports, NDA signatures, workspace messages, uploaded `idea-media` files, the
  profile row and finally the auth user.
- "Delete account" + legal links added to `/profile/edit`.
- `public/.well-known/assetlinks.json` with the upload-key and debug SHA-256.

**Verification**

- `npx tsc --noEmit` clean, `npx eslint src --max-warnings=0` clean (0/0),
  `npm run build` clean, `gradlew bundleRelease assembleDebug` → BUILD SUCCESSFUL.

---

## B. Your weekend list (needs your accounts)

### B1. Accounts and env (about 30 minutes)

| # | Task | Cost |
|---|------|------|
| 1 | Google Play Developer account at <https://play.google.com/console> (individual) | $25 once |
| 2 | Confirm the real domain. If it is not `thoughtdrop.app`, update `NEXT_PUBLIC_SITE_URL`, `src/lib/site.ts`, and run `npm run android:sync` | — |
| 3 | `npm run android:sync` → `npm run android:aab` after any config change | — |
| 4 | Add `SUPABASE_SERVICE_ROLE_KEY` to the deployment env (Project Settings → API → `service_role`). Without it `/account/delete` returns 501 and push dispatch cannot authenticate | free |
| 5 | Deploy the site; confirm `https://<domain>/privacy`, `/terms`, `/account/delete` load | hosting |
| 6 | Supabase → Authentication → **URL Configuration**: set Site URL to the production domain and add these Redirect URLs: `https://<domain>/auth/callback`, `com.thoughtdrop.app://login-callback`. Without the second one, GitHub/Google sign-in inside the Android app fails | free |
| 7 | Supabase → Authentication → Providers: enable **Email** (password sign-in is the primary path in the app) and keep GitHub/Google enabled | free |

### B2. Apply migrations (5 minutes)

Supabase Dashboard → SQL Editor, run in order (skip any already applied):

`0000_initial_schema.sql` → `0001_v2_features.sql` → `0002_phase2_collaboration.sql` →
`0003_phase3_admin_moderation.sql` → `0004_infrastructure.sql` →
`0005_upvotes_search_crud.sql` → `0006_profile_fields.sql` → `0007_comments.sql` →
`0008_bookmarks.sql` → `0009_follows.sql` → `0010_notifications.sql` →
`0011_push_tokens.sql` → `0012_idea_media_storage.sql` →
`0013_notification_events.sql` → `0014_user_safety.sql`

On a fresh project, all of them (a fresh DB has none). Only the tail is needed if your
existing project already has the early ones.

Then verify: `select * from storage.buckets where id = 'idea-media';` and
`select column_name from information_schema.columns where table_name='users' and column_name='terms_accepted_at';`

### B3. Firebase / push (15 minutes, optional but recommended)

1. <https://console.firebase.google.com> → new project → add Android app
   `com.thoughtdrop.app` → download `google-services.json` →
   `android/app/google-services.json` (git-ignored).
2. Project settings → Service accounts → generate private key → set
   `FIREBASE_SERVICE_ACCOUNT` (raw JSON or base64) and `CRON_SECRET` in the env.
3. Rebuild the AAB (the google-services plugin is applied automatically once the file
   exists).
4. Schedule the dispatcher: `.github/workflows/push-dispatch.yml` is already committed and
   calls `GET /api/push/dispatch` every 10 minutes with `Authorization: Bearer <secret>`.
   Set repo **Settings → Secrets and variables → Actions**: secret `CRON_SECRET` and
   optional variable `SITE_URL`. (Vercel Hobby crons only run once a day, hence Actions.)

Without Firebase the app still installs and runs; only push is skipped.

### B4. Screenshots and store listing (30 minutes)

Capture at least 2 (Play requires 2–8) phone screenshots at 1080×1920 or larger:

1. Feed (`/`) with real ideas — the "open moment".
2. An idea detail page with the discussion visible.
3. Optionally `/create` (editor) and a profile page.

Upload in Play Console → Store presence → Main store listing:

- **App name (≤30):** `ThoughtDrop — Idea Exchange`
- **Short description (≤80):** `Drop ideas, get feedback, and build with people who care.`
- **Full description (≤4000):** use the copy below.
- **App icon:** `play-store/icon-512.png`
- **Feature graphic:** `play-store/feature-graphic-1024x500.png`
- **Category:** Social · **Tags:** community, productivity
- **Contact email:** `hello@thoughtdrop.app` (change in `src/lib/site.ts` if different)

<details>
<summary>Full description copy</summary>

```
ThoughtDrop is where unfinished ideas get better.

Post an idea in seconds, drop it into a community, and let the right people find it.
Every idea gets a real discussion thread, upvotes that surface what matters, and a
workspace for the people who want to take it further.

WHAT YOU CAN DO
• Post ideas with rich text and images — text only when you want to keep it simple
• Browse the feed by fresh, top or trending; follow creators you rate
• Fork any public idea to build your own version and credit the original
• Discuss in threaded comments and reply to the people who reply to you
• Bookmark ideas to come back to, and track your drafts
• Join focused micro-communities instead of one noisy global feed
• Protect sensitive concepts with NDA-gated workspaces
• Get notified about upvotes, comments, replies, follows and forks — with native
  push notifications on Android

WHY THOUGHTDROP
Most idea tools are graveyards. ThoughtDrop is built around one loop: publish, get
signal, improve. Forking makes collaboration visible, and communities keep feedback
relevant instead of random.

BUILT FOR ANDROID
Native share sheet, push notifications, deep links that open ideas straight in the
app, and hardware back-button support.

Free to use. Your ideas stay yours — delete any idea, or your whole account, at any
time from Settings.
```
</details>

### B5. App content forms (20 minutes)

| Section | Answer |
|---------|--------|
| Privacy policy | `https://<domain>/privacy` |
| App access | All functionality available without special credentials — provide a test account (`review@…` / password) since review requires login |
| Ads | No ads |
| Content rating | Questionnaire → category Social/Communication; expect Everyone / Teen. No gambling, no mature content. User-generated content → **yes**, and moderation is in place: in-app reporting of content and users, blocking of users, ToS acceptance at signup (see B1–B2), admin tools, auto-hide at 3 reports |
| Target audience | 13+ (do not select under-13) |
| News app | No |
| Data safety | See below |
| Account deletion | `https://<domain>/account/delete` |

**Data safety answers (match the app's actual behaviour):**

- Collects: *Email address* (account management, app functionality), *User IDs*
  (account management), *Name / username* (app functionality, public), *Photos*
  (app functionality — editor uploads, optional), *Other user-generated content*
  (ideas, comments), *Device or other IDs* (FCM token, app functionality).
- Not collected: location, contacts, calendar, health, financial info, browsing history,
  SMS, call logs.
- Data is **encrypted in transit** → yes. **Users can request deletion** → yes, and
  provide the deletion URL. **Committed to Play Families policy** → N/A (13+).
- No data sold, no data shared for advertising.

### B6. Upload and test (weekend + 14 days)

1. Play Console → **Testing → Internal testing** → upload `app-release.aab` → add
   yourself → install from the Play link.
2. Smoke test on a real phone:
   - cold start shows the branded splash, no white flash
   - feed loads, images render, create/edit/delete an idea
   - comments post, edit/delete controls only on your own comments
   - upvote haptic + count
   - share sheet opens
   - notification permission prompt appears (Android 13+)
   - sign in with **email + password** (create the account in-app first)
   - sign in with **GitHub/Google** → Custom Tab opens, and returning to the app lands
     you signed in (this is the step most likely to need the Supabase redirect URL above)
   - push arrives and opens the right idea (if Firebase is set up)
   - `https://<domain>/idea/<id>` opens in the app, not the browser
   - Settings → Delete account works (use a throwaway account)
   - airplane mode → offline screen with retry
3. **Production access:** personal developer accounts created after 13 Nov 2023 need a closed
   test with **12 testers for 14 continuous days** before applying. Organization accounts are
   exempt. Start this as early as possible either way.
4. Then Production → staged rollout (10% → 50% → 100%), watching Vitals.

### B7. Play App Signing fingerprint (do this after the first upload)

Play re-signs your bundle with Google's key, so App Links verification uses Google's
certificate, not your upload key:

1. Play Console → App integrity → App signing → copy **SHA-256 certificate
   fingerprint**.
2. Add it to `public/.well-known/assetlinks.json` next to the existing fingerprints.
3. Redeploy, then verify:
   `https://<domain>/.well-known/assetlinks.json` returns JSON, and on the phone
   `adb shell pm get-app-links com.thoughtdrop.app` shows `verified`.

---

## C. Rebuilding

```bash
npm run android:sync     # inject NEXT_PUBLIC_SITE_URL, copy web assets + plugins
npm run android:apk      # debug APK for sideloading
npm run android:aab      # signed release bundle for Play
```

Bump versions in `android/gradle.properties` before every upload:

```properties
APP_VERSION_CODE=2
APP_VERSION_NAME=1.0.1
```

Signing material (both git-ignored): `android/keystore.properties` and
`android/app/thoughtdrop-release.keystore` (alias `thoughtdrop`). **Back both up** — if
the upload key is lost you must request a Play App Signing key reset.

---

## D. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Offline screen on launch | `NEXT_PUBLIC_SITE_URL` wrong/unreachable — the loader pings `/api/feed` before handing off |
| Deep links open the browser | `assetlinks.json` missing/mismatched, or manifest host ≠ deployed domain; re-run `npm run android:sync` |
| No push | `google-services.json` missing, or `FIREBASE_SERVICE_ACCOUNT` / `CRON_SECRET` unset; check `adb logcat \| grep -i firebase` |
| Delete account says "not configured" | `SUPABASE_SERVICE_ROLE_KEY` missing in the deployment env |
| Gradle "Unsupported class file" | `JAVA_HOME` must point at JDK 17+ (`C:\Program Files\Java\jdk-23`) |
| Upload rejected: target SDK | Bump `targetSdkVersion` in `android/variables.gradle`, rebuild |
| Upload rejected: "just a website" | Keep native push, share, App Links and haptics working — they are the minimum-functionality evidence |

## E. After launch

- Watch Play Console → **Vitals** for crashes/ANRs, and the pre-launch report.
- Keep `versionCode` increasing; test every release on internal testing first.
- iOS later: `npx cap add ios` on a Mac with Xcode, same `capacitor.config.ts`,
  $99/year Apple Developer Program.
