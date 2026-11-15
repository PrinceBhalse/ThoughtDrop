import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Discovery helpers (Batch B).
 *
 * Everything here is computed from data the app already owns — follows,
 * upvotes, categories and recency — so it works with no embedding provider,
 * no background job and no extra table. When `0016`/pgvector lands, the
 * similarity function can be swapped for a vector lookup without touching the
 * UI that consumes it.
 *
 * Both helpers degrade to an empty list instead of throwing: a missing table
 * or a cold database should never break the page they are rendered on.
 */

const DAY = 86_400_000;

export interface SuggestedPerson {
  id: string;
  username: string;
  bio: string | null;
  /** Why this person is being suggested, shown verbatim in the UI. */
  reason: string;
  mutualCount: number;
}

export interface SimilarIdea {
  id: string;
  title: string;
  category: string;
  upvotes_count: number;
  created_at: string;
  reason: "similar" | "community";
  profiles?: { username: string } | null;
  communities?: { name: string } | null;
}

/** Same time-decay curve the feed uses, so ordering feels consistent. */
function trendingScore(upvotes: number, createdAt: string): number {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  return Math.log10(upvotes + 1) / Math.pow(hours + 2, 1.5);
}

function toBlockedSet(blockedIds: string[]): Set<string> {
  return new Set(blockedIds);
}

/**
 * "People you may know" v1.
 *
 * score = mutual follows x2 + ideas in your categories x1 + recent activity x0.3
 *
 * Never suggests yourself, anyone you already follow, or anyone you blocked.
 * No auto-follow: the UI renders a normal follow button.
 */
export async function getSuggestedPeople(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
  blockedIds: string[] = []
): Promise<SuggestedPerson[]> {
  const blocked = toBlockedSet(blockedIds);

  try {
    const [{ data: myFollows }, { data: myIdeas }, { data: profile }] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", userId),
      supabase.from("ideas").select("category").eq("user_id", userId).limit(200),
      supabase.from("users").select("interest_topics").eq("id", userId).single(),
    ]);

    const following = new Set<string>(
      ((myFollows ?? []) as Array<{ following_id: string }>).map((row) => row.following_id)
    );

    // Interests come from what the reader writes plus what they picked at
    // onboarding, so a brand-new account still gets a sensible signal.
    const categories = new Set<string>(
      ((myIdeas ?? []) as Array<{ category: string }>).map((row) => row.category)
    );
    for (const topic of ((profile?.interest_topics ?? []) as string[])) {
      categories.add(topic);
    }

    const mutualCounts = new Map<string, number>();

    // 1. Second-degree follows.
    const seedIds = [...following].slice(0, 50);
    if (seedIds.length > 0) {
      const { data: secondDegree } = await supabase
        .from("follows")
        .select("following_id")
        .in("follower_id", seedIds)
        .limit(2000);

      for (const row of (secondDegree ?? []) as Array<{ following_id: string }>) {
        const id = row.following_id;
        if (id === userId || following.has(id) || blocked.has(id)) continue;
        mutualCounts.set(id, (mutualCounts.get(id) ?? 0) + 1);
      }
    }

    // 2. Topic affinity + recent activity, from the last 90 days of ideas.
    const topicCounts = new Map<string, number>();
    const activeCounts = new Map<string, number>();

    const since = new Date(Date.now() - 90 * DAY).toISOString();
    const { data: recentIdeas } = await supabase
      .from("ideas")
      .select("user_id, category")
      .gte("created_at", since)
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);

    for (const row of (recentIdeas ?? []) as Array<{ user_id: string | null; category: string }>) {
      const id = row.user_id;
      if (!id || id === userId || following.has(id) || blocked.has(id)) continue;
      activeCounts.set(id, (activeCounts.get(id) ?? 0) + 1);
      if (categories.has(row.category)) {
        topicCounts.set(id, (topicCounts.get(id) ?? 0) + 1);
      }
    }

    const candidateIds = new Set<string>([...mutualCounts.keys(), ...topicCounts.keys(), ...activeCounts.keys()]);
    if (candidateIds.size === 0) return [];

    const scored = [...candidateIds]
      .map((id) => {
        const mutual = mutualCounts.get(id) ?? 0;
        const topic = topicCounts.get(id) ?? 0;
        const active = activeCounts.get(id) ?? 0;
        return { id, mutual, topic, active, score: mutual * 2 + topic + active * 0.3 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(limit * 3, 12));

    const { data: people } = await supabase
      .from("users")
      .select("id, username, bio")
      .in("id", scored.map((row) => row.id))
      .limit(scored.length);

    const byId = new Map<string, { id: string; username: string | null; bio: string | null }>();
    for (const row of (people ?? []) as Array<{ id: string; username: string | null; bio: string | null }>) {
      if (row.username) byId.set(row.id, row);
    }

    return scored
      .filter((row) => byId.has(row.id))
      .slice(0, limit)
      .map((row) => {
        const person = byId.get(row.id)!;
        const reason =
          row.mutual >= 2
            ? `Followed by ${row.mutual} people you follow`
            : row.mutual === 1
              ? "Followed by someone you follow"
              : row.topic > 0
                ? "Shares your interests"
                : "Active recently";

        return {
          id: person.id,
          username: person.username as string,
          bio: person.bio,
          reason,
          mutualCount: row.mutual,
        };
      });
  } catch {
    return [];
  }
}

/**
 * "More like this" for an idea page.
 *
 * Similarity = same category (required) + same community + shared upvoters,
 * ordered by the same recency/quality curve as the feed.
 */
export async function getSimilarIdeas(
  supabase: SupabaseClient,
  ideaId: string,
  limit: number,
  blockedIds: string[] = []
): Promise<SimilarIdea[]> {
  const blocked = toBlockedSet(blockedIds);

  try {
    const { data: source } = await supabase
      .from("ideas")
      .select("id, category, community_id, user_id")
      .eq("id", ideaId)
      .single();

    if (!source) return [];

    let candidateQuery = supabase
      .from("ideas")
      .select("id, title, category, upvotes_count, created_at, community_id, is_hidden, profiles:users(username), communities(name)")
      .eq("category", source.category as string)
      .neq("id", ideaId)
      .order("created_at", { ascending: false })
      .limit(120);

    if (blocked.size > 0) {
      candidateQuery = candidateQuery.not("user_id", "in", `(${[...blocked].join(",")})`);
    }

    const { data: candidates } = await candidateQuery;
    const rows = ((candidates ?? []) as unknown as Array<{
      id: string;
      title: string;
      category: string;
      upvotes_count: number | null;
      created_at: string;
      community_id: string | null;
      is_hidden?: boolean;
      profiles?: { username: string } | null;
      communities?: { name: string } | null;
    }>).filter((row) => row.is_hidden !== true);

    if (rows.length === 0) return [];

    // Narrow to a shortlist before the vote lookup: REST `in()` filters travel
    // in the query string, so keep the id lists small.
    const shortlist = rows
      .map((row) => ({
        row,
        base:
          trendingScore(row.upvotes_count ?? 0, row.created_at) +
          (row.community_id && row.community_id === source.community_id ? 0.4 : 0),
      }))
      .sort((a, b) => b.base - a.base)
      .slice(0, 40);

    // Shared upvoters: readers who liked this idea probably like the same ones.
    const sharedVoters = new Map<string, number>();
    const { data: sourceVotes } = await supabase
      .from("upvotes")
      .select("user_id")
      .eq("idea_id", ideaId)
      .limit(300);

    const voterIds = new Set(
      ((sourceVotes ?? []) as Array<{ user_id: string }>).map((vote) => vote.user_id)
    );

    if (voterIds.size > 0) {
      const { data: votes } = await supabase
        .from("upvotes")
        .select("idea_id, user_id")
        .in("idea_id", shortlist.map((entry) => entry.row.id))
        .limit(3000);

      for (const vote of (votes ?? []) as Array<{ idea_id: string; user_id: string }>) {
        if (!voterIds.has(vote.user_id)) continue;
        sharedVoters.set(vote.idea_id, (sharedVoters.get(vote.idea_id) ?? 0) + 1);
      }
    }

    return shortlist
      .map(({ row, base }) => {
        const sameCommunity = row.community_id && row.community_id === source.community_id;
        const shared = sharedVoters.get(row.id) ?? 0;
        const score = base + Math.min(0.6, shared * 0.12);

        return {
          idea: {
            id: row.id,
            title: row.title,
            category: row.category,
            upvotes_count: row.upvotes_count ?? 0,
            created_at: row.created_at,
            reason: (sameCommunity ? "community" : "similar") as SimilarIdea["reason"],
            profiles: row.profiles ?? null,
            communities: row.communities ?? null,
          },
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.idea);
  } catch {
    return [];
  }
}
