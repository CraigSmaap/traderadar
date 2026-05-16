import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TradeRadar — Live Forex & Gold Signals for Beginners";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Emerald radial glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "700px",
            height: "700px",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 65%)",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: "24px",
              padding: "8px 20px",
              color: "#10b981",
              fontSize: "15px",
              fontWeight: "700",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            TradeRadar
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "68px",
            fontWeight: "900",
            color: "#ffffff",
            lineHeight: 1.05,
            marginBottom: "22px",
            maxWidth: "880px",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          Live Forex &amp; Gold Signals for Beginners
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontSize: "26px",
            color: "#a1a1aa",
            maxWidth: "660px",
            lineHeight: 1.45,
            marginBottom: "44px",
            display: "flex",
          }}
        >
          Clear BUY/SELL trade plans. No charts required.
        </div>

        {/* Asset chips */}
        <div style={{ display: "flex", gap: "12px" }}>
          {["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"].map((a) => (
            <div
              key={a}
              style={{
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "12px",
                padding: "10px 22px",
                color: "#71717a",
                fontSize: "15px",
                fontWeight: "600",
                display: "flex",
              }}
            >
              {a}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "44px",
            right: "80px",
            fontSize: "20px",
            color: "#10b981",
            fontWeight: "700",
            display: "flex",
          }}
        >
          traderadar.co.za
        </div>
      </div>
    ),
    { ...size }
  );
}
