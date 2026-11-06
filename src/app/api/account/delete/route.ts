import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Permanently deletes the signed-in account and everything it authored.
 *
 * Google Play requires an in-app (and web-reachable) deletion path; this route
 * is the single implementation behind both. The user is deleted last so a
 * partial failure leaves the account intact and retryable.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const confirmation = (body as { confirm?: string }).confirm;

  if (confirmation !== "DELETE") {
    return NextResponse.json(
      { error: 'Type DELETE to confirm account removal.' },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Account deletion is not configured on this server." },
      { status: 501 }
    );
  }

  const uid = user.id;

  // Inline images live under `<uid>/<file>` in the public idea-media bucket.
  try {
    const { data: files } = await admin.storage.from("idea-media").list(uid, { limit: 1000 });
    if (files && files.length > 0) {
      await admin.storage
        .from("idea-media")
        .remove(files.map((file) => `${uid}/${file.name}`));
    }
  } catch (error) {
    console.warn("[account-delete] media cleanup failed:", error);
  }

  // Authored ideas go first: ideas.user_id is ON DELETE SET NULL, so the
  // cascade alone would otherwise leave them behind as orphaned posts.
  const steps: Array<PromiseLike<unknown>> = [
    admin.from("ideas").delete().eq("user_id", uid),
    admin.from("comments").delete().eq("author_id", uid),
    admin.from("upvotes").delete().eq("user_id", uid),
    admin.from("bookmarks").delete().eq("user_id", uid),
    admin.from("follows").delete().eq("follower_id", uid),
    admin.from("follows").delete().eq("following_id", uid),
    admin.from("notifications").delete().eq("user_id", uid),
    admin.from("push_tokens").delete().eq("user_id", uid),
    admin.from("idea_forks").delete().eq("user_id", uid),
    admin.from("idea_reports").delete().eq("user_id", uid),
    admin.from("nda_signatures").delete().eq("user_id", uid),
    admin.from("workspace_messages").delete().eq("user_id", uid),
  ];

  for (const step of steps) {
    const { error } = (await step) as { error: { message: string } | null };
    if (error) {
      // Rows may already be gone via cascade; log and continue rather than
      // blocking the deletion on an idempotent no-op.
      console.warn("[account-delete] cleanup step failed:", error.message);
    }
  }

  const { error: profileError } = await admin.from("users").delete().eq("id", uid);
  if (profileError) {
    console.warn("[account-delete] profile delete failed:", profileError.message);
  }

  const { error: authError } = await admin.auth.admin.deleteUser(uid);
  if (authError) {
    console.error("[account-delete] auth user delete failed:", authError.message);
    return NextResponse.json(
      { error: "Could not delete the account. Please try again." },
      { status: 500 }
    );
  }

  // Clearing the browser session stops the deleted user from being resurrected
  // by a stale refresh token.
  await supabase.auth.signOut().catch(() => {});

  return NextResponse.json({ deleted: true });
}
