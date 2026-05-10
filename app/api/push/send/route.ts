import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotification, type PushSubscriptionRecord } from "@/lib/webpush";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-push-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, message, url, tag } = body ?? {};

  if (!title || !message) {
    return NextResponse.json({ error: "Missing title or message" }, { status: 400 });
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const subscriptions = (subs || []) as PushSubscriptionRecord[];
  const expiredEndpoints: string[] = [];
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(sub, {
        title,
        body: message,
        url: url || "/live",
        tag: tag || "signal",
      });
      if (result.gone) {
        expiredEndpoints.push(sub.endpoint);
      } else if (result.ok) {
        sent++;
      }
    }),
  );

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  return NextResponse.json({
    ok: true,
    sent,
    expired: expiredEndpoints.length,
    total: subscriptions.length,
  });
}
