import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const svgBuffer = readFileSync(resolve(root, "public/traderadar-mark.svg"));

// Add black background before rasterising so the emerald mark shows on any bg
function withBackground(svg, size) {
  const str = svg.toString();
  const patched = str.replace(
    /<svg([^>]*)>/,
    `<svg$1><rect width="${size}" height="${size}" fill="#09090b"/>`,
  );
  return Buffer.from(patched);
}

async function generate(size, outName) {
  await sharp(withBackground(svgBuffer, size))
    .resize(size, size)
    .png()
    .toFile(resolve(root, `public/${outName}`));
  console.log(`✓ public/${outName}`);
}

await generate(192, "icon-192x192.png");
await generate(512, "icon-512x512.png");
