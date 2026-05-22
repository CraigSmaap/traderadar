import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Possible Chrome paths on Windows
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
];

const chromePath = chromePaths.find(p => existsSync(p));
if (!chromePath) {
  console.error('Chrome not found. Tried:', chromePaths);
  process.exit(1);
}
console.log('Using Chrome at:', chromePath);

const docs = [
  {
    input: join(__dirname, 'TradeRadar-Complete.html'),
    output: join(__dirname, 'TradeRadar-Complete.pdf'),
    label: 'Complete Document',
    landscape: false,
    format: 'A4',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  },
];

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

for (const doc of docs) {
  console.log(`Generating ${doc.label}...`);
  const page = await browser.newPage();

  // Load local HTML file
  await page.goto(`file:///${doc.input.replace(/\\/g, '/')}`, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // Wait for fonts/images to settle
  await new Promise(r => setTimeout(r, 2000));

  await page.pdf({
    path: doc.output,
    format: doc.format,
    landscape: doc.landscape,
    margin: doc.margin,
    printBackground: true,
    preferCSSPageSize: false,
  });

  console.log(`  ✓ Saved: ${doc.output}`);
  await page.close();
}

await browser.close();
console.log('\nAll PDFs generated successfully!');
