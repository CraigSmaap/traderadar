export const getTradeLink = (assets: string[]) => {
  // 🔥 key fix: combine ALL assets instead of only first
  const primary = assets.join(" ").toLowerCase();

  if (!primary) {
    return "https://www.tradingview.com";
  }

  if (
    primary.includes("usd/zar") ||
    primary.includes("usdzar") ||
    primary.includes("usd zar") ||
    primary.includes("rand") ||
    primary.includes("zar")
  ) {
    return "https://www.tradingview.com/chart/?symbol=OANDA%3AUSDZAR";
  }

  if (
    primary.includes("xauusd") ||
    primary.includes("xau/usd") ||
    primary.includes("gold") ||
    primary.includes("gold spot") ||
    primary.includes("bullion")
  ) {
    return "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD";
  }

  if (
    primary.includes("j200") ||
    primary.includes("top 40") ||
    primary.includes("jse top 40") ||
    primary.includes("jse40") ||
    primary.includes("top40")
  ) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3AJ200";
  }

  if (primary.includes("npn") || primary.includes("naspers")) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3ANPN";
  }

  if (primary.includes("prx") || primary.includes("prosus")) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3APRX";
  }

  if (
    primary.includes("agl") ||
    primary.includes("anglo american") ||
    primary.includes("anglo")
  ) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3AAGL";
  }

  if (
    primary.includes("bhg") ||
    primary.includes("bhp") ||
    primary.includes("bhp group")
  ) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3ABHG";
  }

  if (primary.includes("gfi") || primary.includes("gold fields")) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3AGFI";
  }

  if (
    primary.includes("har") ||
    primary.includes("harmony") ||
    primary.includes("harmony gold")
  ) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3AHAR";
  }

  if (primary.includes("sol") || primary.includes("sasol")) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3ASOL";
  }

  if (primary.includes("mtn") || primary.includes("mtn group")) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3AMTN";
  }

  if (primary.includes("vod") || primary.includes("vodacom")) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3AVOD";
  }

  if (primary.includes("shp") || primary.includes("shoprite")) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3ASHP";
  }

  if (
    primary.includes("fsr") ||
    primary.includes("firstrand") ||
    primary.includes("first rand")
  ) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3AFSR";
  }

  if (primary.includes("sbk") || primary.includes("standard bank")) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3ASBK";
  }

  if (
    primary.includes("abg") ||
    primary.includes("absa") ||
    primary.includes("absa group")
  ) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3AABG";
  }

  if (primary.includes("ned") || primary.includes("nedbank")) {
    return "https://www.tradingview.com/chart/?symbol=JSE%3ANED";
  }

  return "https://www.tradingview.com";
};