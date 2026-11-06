import { createClient } from '@/utils/supabase/server';
import { NextResponse, type NextRequest } from "next/server";
import { dispatchPendingPushes } from "@/lib/push-dispatch";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint that pushes notifications to devices whose app is closed.
 *
 * Vercel cron (vercel.json):
 *   { "crons": [{ "path": "/api/push/dispatch", "schedule": "every 5 minutes" }] }
 *
 * Requires CRON_SECRET to be set; Vercel sends it as
 * `Authorization: Bearer $CRON_SECRET`.
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

  const supabase = await createClient();

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
