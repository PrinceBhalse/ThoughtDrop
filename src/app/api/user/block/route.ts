import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getBlockedUserIds } from "@/lib/social";

export const dynamic = "force-dynamic";

/**
 * Toggle a block. Blocking severs follows and suppresses notifications (DB
 * trigger, migration 0014); the feed, comments and the blocked user's profile
 * hide their content for the person who blocked them.
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
  const target = (body as { target?: string }).target;

  if (!target || target === user.id) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  // Staff accounts (admin console) cannot be blocked.
  if (isAdminEmail(user.email)) {
    return NextResponse.json({ error: "You cannot block this account" }, { status: 400 });
  }

  const { data: targetProfile } = await supabase
    .from("users")
    .select("id")
    .eq("id", target)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const blocked = await getBlockedUserIds(supabase);
  const isBlocked = blocked.includes(target);

  if (isBlocked) {
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", target);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ blocked: false });
  }

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: user.id,
    blocked_id: target,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ blocked: true });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ blocked: [] });
  }

  return NextResponse.json({ blocked: await getBlockedUserIds(supabase) });
}
