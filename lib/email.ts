import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "TradeRadar <noreply@traderadar.co.za>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://traderadar.app";

function trialDay1Html(email: string) {
  return `
<div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#09090b;color:#e4e4e7;padding:32px;border-radius:16px">
  <p style="color:#34d399;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0">TradeRadar</p>
  <h1 style="font-size:24px;font-weight:900;color:#fff;margin:16px 0 8px">Your first trade setup is live.</h1>
  <p style="color:#a1a1aa;line-height:1.7;margin:0 0 24px">
    Your 7-day free trial just started. Open the app and look for the top-ranked signal — it has a full trade plan including entry zone, stop loss, TP1, TP2, and TP3.
  </p>
  <a href="${APP_URL}/live" style="display:inline-block;background:#34d399;color:#000;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:14px">
    See my first signal →
  </a>
  <p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.7">
    Not financial advice. Always use small risk. Recommended: 1–2% per trade.
  </p>
</div>`;
}

function trialDay5Html(daysLeft: number) {
  return `
<div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#09090b;color:#e4e4e7;padding:32px;border-radius:16px">
  <p style="color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0">Trial ending soon</p>
  <h1 style="font-size:24px;font-weight:900;color:#fff;margin:16px 0 8px">You have ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left.</h1>
  <p style="color:#a1a1aa;line-height:1.7;margin:0 0 16px">
    After your trial ends, you'll lose access to:
  </p>
  <ul style="color:#a1a1aa;line-height:2;padding-left:20px;margin:0 0 24px">
    <li>All live trade signals</li>
    <li>Full trade plans (TP2 & TP3)</li>
    <li>Lot size calculator</li>
    <li>Broker execution tools</li>
  </ul>
  <a href="${APP_URL}/pricing" style="display:inline-block;background:#34d399;color:#000;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:14px">
    Upgrade to Pro — R299/mo
  </a>
  <p style="margin:16px 0 0;color:#71717a;font-size:12px">WhatsApp us to activate: just click the button above.</p>
</div>`;
}

function trialExpiredHtml() {
  return `
<div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#09090b;color:#e4e4e7;padding:32px;border-radius:16px">
  <p style="color:#f87171;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0">Trial ended</p>
  <h1 style="font-size:24px;font-weight:900;color:#fff;margin:16px 0 8px">Your free trial has expired.</h1>
  <p style="color:#a1a1aa;line-height:1.7;margin:0 0 24px">
    Your access to TradeRadar signals and trade plans has been paused. Upgrade to Pro to continue — it takes less than a minute.
  </p>
  <a href="${APP_URL}/pricing" style="display:inline-block;background:#34d399;color:#000;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:14px">
    Upgrade now — R299/mo
  </a>
  <p style="margin:16px 0 0;color:#71717a;font-size:12px">No card needed to start. WhatsApp us to activate.</p>
</div>`;
}

export async function sendTrialDay1Email(email: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your first TradeRadar signal is live",
    html: trialDay1Html(email),
  });
}

export async function sendTrialDay5Email(email: string, daysLeft: number) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your TradeRadar trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
    html: trialDay5Html(daysLeft),
  });
}

export async function sendTrialExpiredEmail(email: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your TradeRadar trial has expired",
    html: trialExpiredHtml(),
  });
}
