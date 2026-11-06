# ThoughtDrop

A platform for sharing, validating, and collaborating on ideas.

Ships as a **Next.js web app** and a **native Android app** (Capacitor shell around the
same codebase), with an iOS build planned once the Android release validates demand.

## Tech Stack

- **Framework:** Next.js 16 (Turbopack) + React 19
- **Styling:** Tailwind CSS v4, custom monochrome theme with light/dark modes
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Auth (email/password + OAuth)
- **Editor:** TipTap (rich text) with image uploads to Supabase Storage
- **Animations:** Framer Motion
- **OG Images:** `@vercel/og` (dynamic server-rendered cards)
- **Mobile:** Capacitor 8 (Android), native share sheet, FCM push notifications

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` (or create it manually) and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=you@example.com
```

Optional (native push notifications):

```env
# Firebase service account JSON (or base64) — enables FCM delivery
FIREBASE_SERVICE_ACCOUNT=
# Secret required by /api/push/dispatch
CRON_SECRET=
```

### 3. Database migrations

Run each SQL file in order via the **Supabase Dashboard > SQL Editor**:

```
supabase/migrations/
  0000_initial_schema.sql
  0001_v2_features.sql
  0002_phase2_collaboration.sql
  0003_phase3_admin_moderation.sql
  0004_infrastructure.sql
  0005_upvotes_search_crud.sql
  0006_profile_fields.sql
  0007_comments.sql
  0008_bookmarks.sql
  0009_follows.sql
  0010_notifications.sql
  0011_push_tokens.sql
  0012_idea_media_storage.sql
  0013_notification_events.sql
  0014_user_safety.sql
```

Each migration is idempotent (`IF NOT EXISTS`, `IF EXISTS`) so safe to re-run.

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Features

- **Idea sharing** with rich text editor, categories, and collaboration status
- **Community sub-drops** (`/d/<name>`) for topic-specific discussions
- **Upvoting** with optimistic UI (database-backed via `toggle_upvote` RPC)
- **Threaded comments** with replies and live counters
- **Bookmarks** for saving ideas
- **Follow system** with a Following feed
- **Notifications** (in-app bell + native push) for upvotes, comments, replies, follows and forks
- **Full-text search** across ideas and communities (`/api/search`)
- **Infinite scroll** feed with cursor-based pagination (`/api/feed`)
- **Trending / newest / top** sorting with time-decay ranking
- **Public creator profiles** (`/profile/[username>`)
- **Dark / light theme** with system detection
- **Dynamic OG images** for social sharing (1200x630 cards)
- **Admin console** (`/admin`) for moderation, content injection, and reporting
- **Rate limiting** on search and feed endpoints via proxy

## Android App

The Android app is a Capacitor shell that loads the hosted Next.js app and adds what a
web page cannot do on its own: native push notifications, the Android share sheet,
deep links into ideas/profiles, and the hardware Back button.

```bash
npm run android:sync     # inject site URL, copy web assets + plugins
npm run android:apk      # debug APK  -> android/app/build/outputs/apk/debug
npm run android:aab      # signed release bundle -> android/app/build/outputs/bundle/release
```

Release signing lives in `android/keystore.properties` (git-ignored) and
`android/app/thoughtdrop-release.keystore` (git-ignored). Bump `APP_VERSION_CODE` /
`APP_VERSION_NAME` in `android/gradle.properties` for every Play upload.

Sign-in inside the app uses email + password, or GitHub/Google through a Custom Tab that
returns via `com.thoughtdrop.app://login-callback`. Add that URL (and
`https://<domain>/auth/callback`) to Supabase → Authentication → URL Configuration, or
social sign-in will fail in the app.

Store graphics: `npm run assets:store` writes `play-store/icon-512.png` and
`play-store/feature-graphic-1024x500.png`.

Full publishing steps: [PLAY_STORE_RELEASE.md](PLAY_STORE_RELEASE.md) ·
Order of operations: [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) ·
Step-by-step click guide (no prior tool knowledge assumed): [SETUP_GUIDE.md](SETUP_GUIDE.md).

## Project Structure

```
src/
  app/
    page.tsx              # Home feed (server → IdeaFeed client)
    create/               # Idea creation with TipTap editor
    idea/[id]/            # Idea detail, edit, OG image
    d/[communityName]/    # Community page
    communities/          # Community directory + creation
    profile/[username]/   # Public creator profile
    profile/              # Own profile + saved ideas + edit
    admin/                # Admin moderation console
    api/
      feed/               # Cursor-paginated feed endpoint
      search/             # Full-text search endpoint
      notifications/      # Notification list + read state
      push/dispatch/      # Cron endpoint for native push delivery
      upload/             # Image upload to Supabase Storage
      account/delete/     # Account deletion endpoint (service role)
    privacy/              # Privacy policy
    terms/                # Terms of use
    account/delete/       # Public deletion page + confirmation form
  components/
    IdeaCard.tsx          # Feed card (framer-motion, upvote, bookmark, report)
    IdeaFeed.tsx          # Client infinite-scroll wrapper
    UpvoteButton.tsx      # Optimistic upvote with rollback
    BookmarkButton.tsx    # Optimistic bookmark toggle
    FollowButton.tsx      # Optimistic follow toggle (POST /api/follow)
    NativeApp.tsx         # Android bridge: deep links, back, push, OAuth return
    Comments.tsx          # Threaded comment thread
    SearchMenu.tsx        # Floating command-style search
    ShareButton.tsx       # Native share sheet / Web Share API + clipboard + UTM
    NotificationBell.tsx  # Unread badge + dropdown
    MobileDrawer.tsx      # Mobile slide-out navigation
    ThemeToggle.tsx       # Light / dark / system
    Logo.tsx              # App logo
    RichTextEditor.tsx    # TipTap editor with image upload
  lib/
    admin.ts              # isAdminEmail() helper
    native.ts             # Capacitor platform helpers
    push.ts               # FCM HTTP v1 sender (no extra dependencies)
    push-dispatch.ts      # Push delivery for pending notifications
  proxy.ts                # Rate limiting (search, feed)
android/                  # Capacitor Android project
capacitor-web/            # Native loader + offline screen
assets/                   # Source icons/splash for @capacitor/assets
```

## Deploying

### Vercel (recommended)

1. Push to GitHub
2. Import in [vercel.com/new](https://vercel.com/new)
3. Set environment variables in the Vercel dashboard
4. Deploy — no build config needed (Turbopack handles it)

### Other platforms

```bash
npm run build
npm run start
```

Ensure `NEXT_PUBLIC_SITE_URL` is set to your production domain — the Android app and
push deep links use it.

### Push notification cron

`vercel.json`:

```json
{
  "crons": [{ "path": "/api/push/dispatch", "schedule": "0 * * * *" }]
}
```

Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set.

## Migrations Reference

| File | Purpose |
|------|---------|
| `0000` | Core schema: users, ideas, communities, comments, upvotes, RLS policies |
| `0001` | V2 features: user adoption, idea ownership, workspace, inboxes |
| `0002` | Phase 2: collaboration, real-time, advanced communities |
| `0003` | Phase 3: admin moderation, reports, content hiding, injection |
| `0004` | Infrastructure: featured ideas, feed indexes |
| `0005` | Upvotes persistence, full-text search indexes, toggle_upvote RPC |
| `0006` | Profile fields (bio, website), unique username index |
| `0007` | Threaded comments + comments_count |
| `0008` | Bookmarks |
| `0009` | Follows |
| `0010` | Notifications table + RLS |
| `0011` | Push tokens (FCM) + notifications.pushed_at |
| `0012` | `idea-media` storage bucket + RLS policies |
| `0013` | Notification event triggers, forks, live counters |
| `0014` | User blocks, user reports, terms acceptance, block-filtered notifications |

## License

Private — ThoughtDrop.
