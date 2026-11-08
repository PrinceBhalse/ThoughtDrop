# ThoughtDrop Product Roadmap — v1 → Social Platform

*Written 2026-11-07. Sequenced so plan each phase ships AFTER Phase 0 (Play launch).*

---

## 0. The honest strategy (read this first)

No product "dominates" Instagram/Facebook/Reddit/TikTok by adding the same features
with a different logo — those companies have billions of users, network effects, and
unlimited compute. Domination happens the same way *they* did it:

1. **Be different, not better-at-something-small.** IG does images, TT does
   passive video, Reddit does anonymous discussion. **Nobody owns "serious thought."**
   ThoughtDrop's identity: **the platform where thinking is the content** —
   ideas get validated, forked, collaborated on, and *credited*, instead of
   screenshot-parasited like they are everywhere else.
2. **Own a wedge niche completely.** Sequence: students + indie builders +
   their communities first (they create content, invite friends, argue politely),
   then tastemakers, then the general audience. Reddit started as 3 subreddits.
   TikTok started as teen dancing.
3. **Build moats the incumbents structurally cannot copy:**
   - **Ownership & credit** — every idea is attributed, timestamped, fork-graphed.
     Copying someone's idea is visible; building on it is a feature, not theft.
   - **Collaboration surfaces** — co-authoring, collab requests, community drafts.
   - **Reputation for substance** — a Ripple Score earned by validated ideas and
     good criticism, not follower count. This is the anti-algorithm people are
     asking for in 2026.
   - **Creator economics** — nobody pays idea-creators today. If ThoughtDrop's
     creators earn, creators migrate, audiences follow.

Domination = v1 (this launch) → wedge niche lock-in (~6 months) → category
definition ("where do you post your ideas?") → general social scale (2–3 years).

---

## 1. What already exists (so we don't rebuild it)

- Auth (email + OAuth), profiles (username, bio, website), follow graph
- Ideas: rich-text (TipTap), categories, media bucket `idea-media`, forks
- Threaded comments (edit/delete/replies), upvotes, bookmarks
- Communities, NDA signing on ideas, admin moderation
- Notifications + FCM push, block/report system, terms acceptance
- Search API, trending ranking in feed
- Native Android app (Capacitor), deploy pipeline, legal + delete pages

**Verdict:** the *skeleton* of a social platform exists. What's missing is
everything that makes it a place people *live in*.

## 2. Phase 0 — Launch v1 (now, blocking)

Only infrastructure debt: attach `thoughtdrop.app`, migrate 0007 re-run + 0008–0014
(verify `/api/feed` non-500), rebuild AAB, Firebase for push, Play closed testing.
*Nothing product-wise here — ship what's built.*

## 3. Phase 1 — "Make it feel alive" (v1.1, weeks 1–4 after launch)

Goal: a new user gets a **non-empty, personal feed on day one** and a profile
they're proud of.

| # | Feature | Why it's first | Backend |
|---|---------|---------------|---------|
| 1.1 | **Rich profiles**: avatar, display name, header image | Profiles are identity; avatars alone double perceived quality | `0015_profile_media.sql` (avatar_url, display_name on users; profile-media bucket) + reuse `/api/upload` |
| 1.2 | **Interest-based onboarding**: pick 3+ interests → auto-follow matching communities/creators | Empty feed = uninstall. This is the single highest-ROI item | seed follows in `users` insert flow; interests column |
| 1.3 | **Feed tabs: For You / Following / Trending** | Followed-only feed is a ghost town early; trending exists today | `/api/feed` gets `tab` param; Following = joins on follows |
| 1.4 | **@mentions and #hashtags** in ideas + comments with links & notification | The two primitives of every social platform | `0016_mentions_hashtags.sql` (+ mention-notif trigger), parse in editor |
| 1.5 | **Notification depth**: mentioned-you, liked-your-idea, followed-you bundling, weekly digest push | Retention driver; push pipeline already exists | extend 0013 triggers + daily digest cron |
| 1.6 | **Media-forward feed cards** (images visible in feed, not behind click) | Visual feed = feel of real social app | client-side, bucket already live |
| 1.7 | **Better search**: tabs People/Topics/Ideas, recent searches, debounce | People can't find each other today | extend `/api/search` |
| 1.8 | **Share sheet + profile deep links** in-app | Cheapest growth loop; routes already exist | client + assetlinks |

## 4. Phase 2 — "Give people a reason to post daily" (v1.2–1.3, months 2–3)

Goal: daily habit loops. This is where we take on TikTok/IG on their own turf,
on ThoughtDrop's terms.

| # | Feature | Notes |
|---|---------|-------|
| 2.1 | **Drops — 30-second vertical thought videos** | The TikTok-format primitive, reframed: talking about an *idea*, not yourself. New `drops` table + video storage + player; Android record via camera swipe. Biggest single-engineering lift. Consider Cloudflare Stream (user already has Cloudflare) for transcode+CDN |
| 2.2 | **Reactions beyond upvote** (5-emoji bar) | Cheap, proven (FB/LinkedIn); gives posters signal variety |
| 2.3 | **Ripples — quote-shares with attribution chain** | The product's own name. Repost another idea with your take; visible "rippled from" provenance line. *This is a ThoughtDrop-native differentiator, not a clone* |
| 2.4 | **Whispers — 1:1 DMs** (groups later) | Social platform without DMs is dead; Supabase Realtime channels; heavy RLS; ship after 2.1–2.3 |
| 2.5 | **Pinned ideas + profile highlights** | Low cost, high profile value |
| 2.6 | **Collab requests** ("Ride along") on ideas | Turn the NDA/fork features from Phase-0 leftovers into an actual mechanism: request → accept → co-author credit |
| 2.7 | **Idea views + creator stat cards** (`idea_views` table) | Posters need numbers; feeds the Phase-3 ranking too |

## 5. Phase 3 — "The algorithm & the economics" (months 3–6)

Goal: defense + money. This is what makes the wedge un-stealable.

1. **For-You ranking** — dwell time, saves, shares, ripple-rate + pgvector
   semantic similarity on idea content. Hybrid rank, never pure engagement
   (engagement-maximizing feeds are the *weakness* of incumbents — advertised
   as such).
2. **Ripple Score (reputation)** — anonymous-weighted validation from credible
   accounts; shown next to names. Anti-clout positioning.
3. **Creator monetization, in order:**
   a. Tips on ideas (Stripe/PMoney for India market)
   b. Paid community membership (monthly, creator keeps majority)
   c. Ad revenue share once ads exist
   → *None of the 5 incumbents monetize idea-writers. This migrates them.*
4. **Communities 2.0** — mod tools (queue, slow mode, bans, appeal), community
   styles, scheduled **Salons** (live audio/text discussion around one posted idea).
5. **Idea ownership proof** — content hashing + timestamped "registered at"
   display. Turn the scraped-content complaint into a moat.
6. **Explore** — topic pages, city/local, trending communities; localization
   (en → hi first; India-first GTM is a genuinely under-served social market).

## 6. Phase 4 — "Scale & lock-in" (6–12 months)

- **ThoughtDrop Copilot (AI)** — not a content generator; an *idea developer*:
  stress-tests your idea, finds related ideas, suggests collaborators.
  This is the differentiator no social platform has shipped seriously.
- Live audio (Salons live), cross-posting tools, iOS app (after Android is stable),
  ML auto-moderation + appeals, B2B idea-marketplace ("hire the thinker").
- Data ownership export (GDPR-grade) — trust positioning.

## 7. Explicitly NOT building (scope killers)

E2E-encrypted DMs (v1), blockchain tokens/NFTs, our own ad-network, editing
published video, multi-region DB, rebuilding the web app, anything not listable
inside a 4-week phase.

## 8. Cross-cutting enablers (start small, grow with scale)

| Area | Now | Phase 3+ |
|------|-----|----------|
| Media | Supabase Storage | Cloudflare Stream (video) + image CDN transforms |
| Realtime | Supabase Realtime (DMs, notif badges) | dedicated presence service |
| Search | Postgres FTS | pgvector + typed search service |
| Ranking | SQL trending | hybrid recsys in Postgres + Redis hot cache |
| Abuse | manual admin + reputation triggers | ML moderation stub, Upstash-style rate limiting |
| Analytics | none | self-hosted Plausible + app event table |
| Deploy discipline | bump versionCode every upload, tag releases, keep migrations additive & replayable (0007-style lessons) | CI builds the AAB in GitHub Actions |

## 9. Migration sequence (continuing from 0014)

```
0015 profile media (avatars, display names, headers)
0016 mentions + hashtags + interest topics
0017 reactions, ripples (quote-share provenance)
0018 drops (video + fact flags)
0019 whispers (DM schema, RLS-first)
0020 idea_views + creator stats
0021 ripple score + monetization tables
```

Every migration: additive, `IF NOT EXISTS`, replayable; new RLS policies declared
*before* column drops (lesson from 0007).

## 10. Immediate next actions (in order)

1. **Ship Phase 0** — attach domain, finish testing, Play submission.
2. After Play submission: start Phase 1 item 1.1 + 1.2 (they're the fastest wins
   and biggest retention deltas).
3. Re-snapshot metrics at every phase: DAU/WAU, D7 retention, ideas-posted-per-user.
   Phase 2's strategy assumes Phase-1 retention data — measure before building daily
   loops on guesses.

## 11. Feed & social graph design (adopted — Nov 2026)

*Director's notes from the Nov 8, 2026 design session, captured verbatim where
the reasoning was load-bearing, then translated into the implementation plan.*

### 11.1 Product positions decided

1. **Friend graph first, interest graph second.** Cold-start for new users comes
   from friends/communities they already know; interests only accelerate.
2. **Interest/context graph first, social layer later.** Don't wait for the social
   layer to bootstrap discovery — the context graph (topics, session intent, timing)
   carries early value.
3. **One endless feed per context.** A single ranked stream that shifts meaning
   (commute → news/tips, lunch → light entertainment, night → wind-down), rather
   than separate "Home / Explore / Following" silos that fragment the product.
4. **Explore = controlled serendipity.** 70/30 split, personalized vs. "safe
   surprises" from adjacent interest clusters / rising local creators.

### 11.2 Black-box feed strategy (trust > transparency, for now)

- Feed should learn from **more than watch history**:
  - **Explicit:** likes, shares, saves, "show me less of this", follow/unfollow,
    onboarding topic tags.
  - **Implicit:** watch time, re-watch, swipe-away speed, time-of-day, day-of-week,
    location (city/neighborhood), device, network speed, session length, outcome of
    the app session ("what did you do next").
  - **Contextual:** 8 AM commute → news/short tips; 1 PM lunch → light entertainment;
    10 PM wind-down → calming/nostalgic.
  - **Session intent:** user picks a mode when opening (Distract me / Inspire me /
    Catch up with friends / Learn something). Cold-start signal #1.
- Architecture without a 50-person ML team: **contextual bandit or simple
  two-tower model** (user embedding × content embedding × context embedding).
  Bandit beats pure collaborative filtering for cold start because it doesn't need
  historical co-occurrence. Practical first implementation: logistic regression /
  Thompson sampling bandit over pre-computed content embeddings (e.g., 384-dim
  text embeddings via a small embedder — no custom training loop needed) + contextual
  feature vector per session.

### 11.3 Feed behavior rules

- Exploration/exploitation split: **70% personalized, 30% safe surprise**.
- Adjacent interest clusters / rising local creators as the exploration source.
- Labels communicated to users ("we're mixing familiar + surprising for you") to
  preserve trust in a black-box feed.

### 11.4 Friend suggestions (beyond mutual friends)

Signals, ranked:
1. Shared context — same city, same event, same school/workplace, same niche interest tags.
2. Behavioral similarity — similar swipe patterns/tastes, similar active hours.
3. Proximity — optional location-based "people near you" with strict privacy controls.
4. Contact import — from WhatsApp/Instagram contacts, ranked by *likelihood you'd
   enjoy their content*, not just existence. No auto-follow-all (high noise kills
   retention). Let users subscribe to lightweight updates before becoming friends.

### 11.5 Implementation footprint estimate (small team)

| Item | Effort | Notes |
|------|--------|-------|
| Signals tables + event writes (app + web) | S | additive migrations; events: likes/shares/saves/scrolls/watch-times |
| Context feature capture (time-of-day intent, topic tags, session mode) | S | user profile columns + session table |
| Content embeddings + user/content/context vectors | M | managed embedder (OpenAI text-embedding or local model); pgvector |
| Bandit / two-tower scoring | M | start with logistic bandit (contextual) — no training infra |
| 70/30 exploration rollout + UI label | S | feed query param / config |
| Friend suggestion signals | M | affinity score over shared context + behavioral vectors |
| Location/privacy layers | M | coarse geo only, strict consent |

### 11.6 Verdicts — what is must-have vs. good-to-have vs. drop

Analysis against the current codebase (Nov 8, 2026). **Must-have** = build, in order,
no debate. **Good** = valuable, sequence after must-haves. **Later** = needs scale
or trust. **Drop** = gimmick / policy risk / no user value.

| Feature | Verdict | Effort | Why |
|---|---|---|---|
| **Event instrumentation** (explicit + implicit signals) | **MUST** | S | Without this table, every algorithm below is blind. Instrument *before* ranking. |
| **Session intent modes** (Distract / Inspire / Catch up / Learn) | **MUST** | S | Best cold-start signal per hour of work. One modal + one column + one feed param. |
| **Feed with 70/30 exploration, labelled** ("safe surprise") | **MUST** | S | Differentiator vs. "more of the same" feeds; cheap on top of current ranking. |
| **"Why am I seeing this" label** | **MUST** | S | Trust + EU DSA / India IT-rules recommender transparency. No incumbent does it well. |
| **Feed tabs / one feed by context** (time-of-day first) | **MUST** | M | Start with time-of-day only; location/battery later or never. |
| **Contextual bandit (lite) on pgvector embeddings** | **MUST (phased)** | M | Start: logistic/Thompson bandit over precomputed text embeddings. Upgrade path to two-tower. Do not start with collaborative filtering — no co-occurrence at cold start. |
| **Friend suggestions v1** (shared communities/topics + mutual follows) | **GOOD** | M | Signals exist today (`follows`, `communities`). Proximity/contact import come later. |
| **Similar content via connected people** | **GOOD** | M | Nice tab ("Because you follow X"); emerges from embeddings + follow graph. |
| **Direct Messages** | **MUST for the platform vision, but Phase 2** | L | Retention/social graph, but it is a product in itself (realtime, RLS, abuse, reports). Do not bolt it onto launch. |
| **Chat groups** | **GOOD** | L | Build as group-DM extension of Whispers; don't build separately. |
| **Communities 2.0** (mod tools, discovery) | **GOOD** (community base already shipped) | M | Enhance what exists rather than new tables. |
| **Location-aware context** | **LATER** | M | Requires consent UX + Play Data Safety + privacy-policy updates. High risk if rushed. |
| **Contact import (WhatsApp/Instagram)** | **LATER** | L | Play policy surface (contacts permission, Data Safety), legal exposure; needs strict opt-in + local-only hashing. |
| **"People near you"** | **LATER** | M | Same privacy/regulatory cost as location. Only after moderation maturity. |
| **Battery-level adaptation** | **DROP** | — | Zero user-perceivable value, creepy signal, drains trust. Gimmick. |
| **Network-speed adaptation** | **LOW / SKIP** | S | Marginal; video bitrate handling (Phase 2 Drops) covers the real use case. |
| **"What they do after the app"** | **DROP** | — | Not technically possible on Android without surveillance SDKs; Play policy violation risk. Never collect. |

**Privacy/legal guardrail (applies to every signal):** any implicit/contextual signal
must be (a) listed in the privacy policy and Play Data Safety form, (b) deletable with
the account (extend `/api/account/delete` to wipe event rows), (c) coarse/anonymized
where possible (city not GPS pin), (d) switchable off in settings. DPDP (India) and
GDPR both treat behavioural profiles as personal data.

### 11.7 Implementation batches (must-haves first)

**Batch A — "See and learn" (1–2 weeks, no ML infra):**
1. `0015_feed_signals.sql`: `feed_events` (user, idea, event type, dwell ms, surface,
   session_id, created_at), `session_intents` (user, session_id, intent, created_at),
   user `interest_topics` + `consent_personalization` columns. RLS: own-events
   insert/select, delete cascade on user delete.
2. Instrument client surfaces: impression, click, dwell, like/save/share/skip,
   follow/unfollow, plus intent selection. Fire-and-forget batching to one API route.
3. Session-intent modal on first open per session → stored, passed into feed query.
4. Feed response improvements: explicit ranking factors (graph, recency, quality),
   70/30 exploration split, per-card reasons (`Because you follow …`, `Safe surprise`).
5. "Show me less like this" action → negative event + immediate feed exclusion.

**Batch B — "Similarity" (2–3 weeks):**
6. `0016_content_embeddings.sql` (pgvector) + backfill job for existing ideas;
   incremental embedding on idea create/update.
7. Similar-idea endpoint ("More like this" on idea page) + "Because you follow X" rows.
8. Friend suggestions v1: score = shared communities/topics + mutual follows +
   recency/activity, exposed in a `People you may know` module. No auto-follow.

**Batch C — "Daily loops" (Drops, DMs):** Phase 2 features (whispers 1:1 → groups)
after A/B are measured. Ranking upgrades to Thompson sampling bandit once A provides
a few weeks of events.

**Measurement gate:** ship Batch A behind a config flag; compare D7 retention and
ideas-per-user before/after. If exploration hurts retention, tune the split, don't
abandon transparency.

---

