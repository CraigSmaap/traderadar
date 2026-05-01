export type SessionType =
  | "overlap"
  | "london"
  | "newyork"
  | "off";

export function getCurrentSession(): SessionType {
  // Always use SA time explicitly
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const hour = Number(parts.find(p => p.type === "hour")?.value);
  const minute = Number(parts.find(p => p.type === "minute")?.value);

  const minutes = hour * 60 + minute;

  // Sessions (SA time)
  const londonOpen = 10 * 60;       // 10:00
  const nyOpen = 15 * 60 + 30;      // 15:30
  const overlapEnd = 19 * 60;       // 19:00
  const nyClose = 22 * 60;          // 22:00

  if (minutes >= nyOpen && minutes < overlapEnd) {
    return "overlap";
  }

  if (minutes >= londonOpen && minutes < nyOpen) {
    return "london";
  }

  if (minutes >= overlapEnd && minutes < nyClose) {
    return "newyork";
  }

  return "off";
}

export function getSessionBoost(session: SessionType) {
  switch (session) {
    case "overlap":
      return 2;
    case "london":
    case "newyork":
      return 1;
    default:
      return 0;
  }
}