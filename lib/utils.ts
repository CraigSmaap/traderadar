export const getTradeLink = (assets: string[]) => {
  const primary = assets[0]?.toLowerCase();

  if (!primary) return "#";

  if (primary.includes("usd/zar")) {
    return "https://example-broker.com/trade/usdzar";
  }

  if (primary.includes("gold")) {
    return "https://example-broker.com/trade/gold";
  }

  if (primary.includes("oil") || primary.includes("brent")) {
    return "https://example-broker.com/trade/oil";
  }

  if (primary.includes("jse")) {
    return "https://example-broker.com/trade/jse";
  }

  return "https://example-broker.com";
};