import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const svgRaw = readFileSync(resolve(root, "public/traderadar-mark.svg"), "utf8");

// Patch SVG to a given render size
function svgAt(size) {
  return Buffer.from(
    svgRaw
      .replace(/width="128"/, `width="${size}"`)
      .replace(/height="128"/, `height="${size}"`)
  );
}

// icon.png — 1024x1024 with dark background, logo centred at 640px
async function genIcon() {
  const logoSize = 640;
  const canvasSize = 1024;
  const offset = Math.round((canvasSize - logoSize) / 2);

  const logoPng = await sharp(svgAt(logoSize)).resize(logoSize, logoSize).png().toBuffer();

  await sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: "#09090b" },
  })
    .composite([{ input: logoPng, top: offset, left: offset }])
    .png()
    .toFile(resolve(root, "mobile/assets/icon.png"));

  console.log("✓ mobile/assets/icon.png");
}

// adaptive-icon.png — 1024x1024, logo in safe zone (66%), transparent background
async function genAdaptive() {
  const logoSize = 512; // ~50% of 1024 — well inside the 66% safe zone
  const canvasSize = 1024;
  const offset = Math.round((canvasSize - logoSize) / 2);

  const logoPng = await sharp(svgAt(logoSize)).resize(logoSize, logoSize).png().toBuffer();

  await sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logoPng, top: offset, left: offset }])
    .png()
    .toFile(resolve(root, "mobile/assets/adaptive-icon.png"));

  console.log("✓ mobile/assets/adaptive-icon.png");
}

// splash-icon.png — same as icon but smaller logo on dark bg
async function genSplash() {
  const logoSize = 400;
  const canvasSize = 1024;
  const offset = Math.round((canvasSize - logoSize) / 2);

  const logoPng = await sharp(svgAt(logoSize)).resize(logoSize, logoSize).png().toBuffer();

  await sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: "#09090b" },
  })
    .composite([{ input: logoPng, top: offset, left: offset }])
    .png()
    .toFile(resolve(root, "mobile/assets/splash-icon.png"));

  console.log("✓ mobile/assets/splash-icon.png");
}

await genIcon();
await genAdaptive();
await genSplash();
