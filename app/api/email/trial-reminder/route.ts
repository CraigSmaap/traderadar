import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendTrialDay1Email,
  sendTrialDay5Email,
  sendTrialExpiredEmail,
} from "@/lib/email";
import { TRIAL_DAYS } from "@/lib/access";

// Protect this endpoint — only callable with a secret header or cron service
const CRON_SECRET = process.env.CRON_SECRET;

type Profile = {
  id: string;
  email: string;
  role: string | null;
  created_at: string;
};

function daysSinceCreation(createdAt: string) {
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
}

export async function POST(request: Request) {
  // Verify secret if set
  if (CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all trial users (role is not pro/admin)
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .not("role", "in", "(pro,admin)")
    .not("created_at", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = (data || []) as Profile[];

  const results = { day1: 0, day5: 0, expired: 0, skipped: 0 };

  for (const profile of profiles) {
    if (!profile.email || !profile.created_at) {
      results.skipped++;
      continue;
    }

    const days = daysSinceCreation(profile.created_at);
    const daysLeft = TRIAL_DAYS - days;

    try {
      if (days >= 1 && days < 2) {
        // Day 1 welcome email
        await sendTrialDay1Email(profile.email);
        results.day1++;
      } else if (daysLeft >= 1.5 && daysLeft < 2.5) {
        // ~2 days left
        await sendTrialDay5Email(profile.email, Math.ceil(daysLeft));
        results.day5++;
      } else if (days >= TRIAL_DAYS && days < TRIAL_DAYS + 1) {
        // Just expired (within the expiry day)
        await sendTrialExpiredEmail(profile.email);
        results.expired++;
      } else {
        results.skipped++;
      }
    } catch (err) {
      console.error(`Email failed for ${profile.email}:`, err);
      results.skipped++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
