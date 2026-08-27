# ThoughtDrop

A platform for sharing, validating, and collaborating on ideas.

## Tech Stack

- **Framework:** Next.js 16 (Turbopack) + React 19
- **Styling:** Tailwind CSS v4, custom monochrome theme
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Auth (email/password + OAuth)
- **Editor:** TipTap (rich text)
- **Animations:** Framer Motion
- **OG Images:** `@vercel/og` (dynamic server-rendered cards)

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
- **Full-text search** across ideas and communities (`/api/search`)
- **Infinite scroll** feed with cursor-based pagination (`/api/feed`)
- **Dynamic OG images** for social sharing (1200x630 cards)
- **Profile editing** (username, bio, website) with unique username validation
- **Admin console** (`/admin`) for moderation, content injection, and reporting
- **Rate limiting** on search and feed endpoints via middleware

## Project Structure

```
src/
  app/
    page.tsx              # Home feed (server → IdeaFeed client)
    create/               # Idea creation with TipTap editor
    idea/[id]/            # Idea detail, edit, OG image
    d/[communityName]/    # Community page
    communities/          # Community directory + creation
    profile/              # Profile view + edit
    admin/                # Admin moderation console
    api/
      feed/               # Cursor-paginated feed endpoint
      search/             # Full-text search endpoint
  components/
    IdeaCard.tsx          # Feed card (framer-motion, upvote, report)
    IdeaFeed.tsx          # Client infinite-scroll wrapper
    UpvoteButton.tsx      # Optimistic upvote with rollback
    SearchMenu.tsx        # Floating command-style search
    ShareButton.tsx       # Web Share API + clipboard + UTM
    Logo.tsx              # App logo (SVG)
    RichTextEditor.tsx    # TipTap editor
    EmptyState.tsx        # Illustrated empty states
  lib/
    admin.ts              # isAdminEmail() helper
  middleware.ts           # Rate limiting (search, feed)
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

Ensure `NEXT_PUBLIC_SITE_URL` is set to your production domain.

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

## License

Private — ThoughtDrop.
