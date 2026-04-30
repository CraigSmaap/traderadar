export type SessionType =
  | "overlap"
  | "london"
  | "newyork"
  | "off";

export function getCurrentSession(): SessionType {
  const now = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Africa/Johannesburg",
    })
  );

  const minutes = now.getHours() * 60 + now.getMinutes();

  const londonOpen = 10 * 60;
  const nyOpen = 15 * 60 + 30;
  const overlapStart = 15 * 60 + 30;
  const overlapEnd = 19 * 60;
  const nyClose = 22 * 60;

  if (minutes >= overlapStart && minutes < overlapEnd) {
    return "overlap";
  }

  if (minutes >= londonOpen && minutes < nyOpen) {
    return "london";
  }

  if (minutes >= nyOpen && minutes < nyClose) {
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