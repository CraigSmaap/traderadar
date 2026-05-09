import { NextResponse } from "next/server";

export async function GET() {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
  const APP_URL = (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  )?.replace(/\/$/, "");

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }

  if (!APP_URL) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL or VERCEL_URL not set" },
      { status: 500 }
    );
  }

  const webhookUrl = `${APP_URL}/api/telegram/webhook`;

  const body: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ["message"],
  };

  if (WEBHOOK_SECRET) {
    body.secret_token = WEBHOOK_SECRET;
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  return NextResponse.json({ webhookUrl, ...data });
}
