import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveAccessTier } from "@/lib/access";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const PRIVATE_CHAT_ID =
  process.env.TELEGRAM_PRIVATE_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://traderadar.co.za")
).replace(/\/$/, "");

type TelegramMessage = {
  chat: { id: number };
  text?: string;
};

type TelegramUpdate = {
  message?: TelegramMessage;
};

async function reply(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
}

async function createInviteLink(): Promise<string | null> {
  const expireDate = Math.floor(Date.now() / 1000) + 86400; // 24 hours

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/createChatInviteLink`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: PRIVATE_CHAT_ID,
        member_limit: 1,
        expire_date: expireDate,
        name: "Verified subscriber",
      }),
    }
  );

  const data = (await res.json()) as { result?: { invite_link: string } };
  return data.result?.invite_link ?? null;
}

export async function POST(request: Request) {
  if (WEBHOOK_SECRET) {
    const secret = request.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message?.chat?.id) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();

  // /start greeting
  if (!text || text.startsWith("/start")) {
    await reply(
      chatId,
      `👋 *Welcome to TradeRadar!*\n\nSend me the email address you used to sign up and I'll verify your subscription and send you an invite to the private signals channel.`
    );
    return NextResponse.json({ ok: true });
  }

  // Must look like an email
  if (!text.includes("@") || !text.includes(".")) {
    await reply(chatId, "Please send your TradeRadar email address to verify access.");
    return NextResponse.json({ ok: true });
  }

  const email = text.toLowerCase();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, created_at")
    .ilike("email", email)
    .single();

  if (!profile) {
    await reply(
      chatId,
      `❌ No account found for *${email}*.\n\nSign up at [${APP_URL}](${APP_URL}/login) to get started with your 7-day free trial.`
    );
    return NextResponse.json({ ok: true });
  }

  const tier = resolveAccessTier(profile.role, profile.created_at);

  if (tier === "expired") {
    await reply(
      chatId,
      `⏰ *Your trial has expired.*\n\nUpgrade to Pro to get channel access:\n[${APP_URL}/pricing](${APP_URL}/pricing)`
    );
    return NextResponse.json({ ok: true });
  }

  const inviteLink = await createInviteLink();

  if (!inviteLink) {
    await reply(
      chatId,
      "❌ Could not generate an invite link right now. Please try again in a minute."
    );
    return NextResponse.json({ ok: true });
  }

  const tierLabel =
    tier === "pro" || tier === "admin" ? "Pro subscriber ✅" : "Free trial ✅";

  await reply(
    chatId,
    `*${tierLabel}*\n\nHere's your private channel invite:\n${inviteLink}\n\n⚠️ This link is single-use and expires in 24 hours. Don't share it.`
  );

  return NextResponse.json({ ok: true });
}
