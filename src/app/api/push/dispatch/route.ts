import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchPendingPushes } from "@/lib/push-dispatch";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint that pushes notifications to devices whose app is closed.
 *
 * Triggered by `.github/workflows/push-dispatch.yml` (every 10 minutes) or a
 * Vercel cron. Requires CRON_SECRET; the caller sends
 * `Authorization: Bearer $CRON_SECRET`.
 *
 * This runs with the service-role client on purpose: a cron request carries no
 * user session, so the cookie-scoped client would see zero rows under RLS and
 * silently deliver nothing.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 500 }
    );
  }

  const { data: pending } = await supabase
    .from("notifications")
    .select("user_id")
    .is("pushed_at", null)
    .limit(500);

  const userIds = Array.from(new Set((pending ?? []).map((row) => row.user_id as string)));

  let pushed = 0;
  for (const userId of userIds) {
    pushed += await dispatchPendingPushes(supabase, userId);
  }

  return NextResponse.json({ users: userIds.length, pushed });
}
