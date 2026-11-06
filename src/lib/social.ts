import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ids of the users the current session has blocked. RLS on user_blocks only
 * ever returns the blocker's own rows, so this is safe on the server and the
 * browser, and anonymous visitors get an empty list.
 */
export async function getBlockedUserIds(supabase: SupabaseClient): Promise<string[]> {
  try {
    const { data } = await supabase.from("user_blocks").select("blocked_id");
    return (data ?? []).map((row) => row.blocked_id as string);
  } catch {
    return [];
  }
}
