export type AccessTier = "free" | "pro" | "admin";

export function normalizeAccessTier(role?: string | null): AccessTier {
  if (role === "pro" || role === "admin") {
    return role;
  }

  return "free";
}

export function getVisibleSignalLimit(tier: AccessTier) {
  return tier === "pro" || tier === "admin" ? 10 : 3;
}

export function canViewFullTradePlan(tier: AccessTier) {
  return tier === "pro" || tier === "admin";
}

export function canUseLotCalculator(tier: AccessTier) {
  return tier === "pro" || tier === "admin";
}

export function canUseBrokerActions(tier: AccessTier) {
  return tier === "pro" || tier === "admin";
}