import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPush, isPushConfigured } from "@/lib/push";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  reference_type: string | null;
  pushed_at: string | null;
}

/**
 * Sends native push messages for notifications that have not been delivered yet.
 *
 * Called from the notifications API (so an open app pushes immediately) and from
 * the cron dispatch route (so closed apps still get notified).
 */
export async function dispatchPendingPushes(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  if (!isPushConfigured()) return 0;

  const { data: pending } = await supabase
    .from("notifications")
    .select("id, type, title, message, reference_id, reference_type, pushed_at")
    .eq("user_id", userId)
    .is("pushed_at", null)
    .order("created_at", { ascending: true })
    .limit(20);

  if (!pending || pending.length === 0) return 0;

  const { data: tokenRows } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);

  const tokens = (tokenRows ?? []).map((row) => row.token as string);
  if (tokens.length === 0) return 0;

  let sent = 0;

  for (const notification of pending as NotificationRow[]) {
    try {
      const path = await resolvePath(supabase, notification);
      const result = await sendPush(tokens, {
        title: notification.title,
        body: notification.message,
        path,
        notificationId: notification.id,
      });

      if (result.invalidTokens.length > 0) {
        await supabase.from("push_tokens").delete().in("token", result.invalidTokens);
      }

      await supabase
        .from("notifications")
        .update({ pushed_at: new Date().toISOString() })
        .eq("id", notification.id);

      sent += result.sent;
    } catch (error) {
      console.error("[push] failed to dispatch notification:", error);
    }
  }

  return sent;
}

async function resolvePath(
  supabase: SupabaseClient,
  notification: NotificationRow
): Promise<string> {
  if (!notification.reference_id) return "/";

  if (notification.reference_type === "idea") {
    return `/idea/${notification.reference_id}`;
  }

  if (notification.reference_type === "user") {
    const { data } = await supabase
      .from("users")
      .select("username")
      .eq("id", notification.reference_id)
      .maybeSingle();
    return data?.username ? `/profile/${data.username}` : "/";
  }

  return "/";
}
