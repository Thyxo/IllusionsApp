// Genererer app-ikoner (PNG) fra SVG med Playwright/Chromium.
// Kør: node tools/make-icons.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  const globalRoot = execSync('npm root -g').toString().trim();
  ({ chromium } = createRequire(`${globalRoot}/`)('playwright'));
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'icons');

// Tryllehat med gnist. Tegnet i 512-koordinater, centreret omkring (256, 256).
const glyph = `
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7dc95"/>
      <stop offset="1" stop-color="#c9952f"/>
    </linearGradient>
  </defs>
  <g transform="translate(-21 70)">
    <path d="M183 128 H329 Q338 128 337 137 L321 312 H191 L175 137 Q174 128 183 128 Z" fill="url(#gold)"/>
    <path d="M187.5 270 H324.5 L321 312 H191 Z" fill="#6c3fb0"/>
    <ellipse cx="256" cy="318" rx="132" ry="27" fill="url(#gold)"/>
    <path d="M372 26 C377 70 390 83 434 88 C390 93 377 106 372 150 C367 106 354 93 310 88 C354 83 367 70 372 26 Z" fill="#fbe7b0"/>
    <path d="M150 60 C152 78 158 84 176 86 C158 88 152 94 150 112 C148 94 142 88 124 86 C142 84 148 78 150 60 Z" fill="#c9a7ff"/>
    <circle cx="414" cy="182" r="7" fill="#c9a7ff"/>
  </g>`;

const bg = `
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.28" r="0.85">
      <stop offset="0" stop-color="#3d2266"/>
      <stop offset="0.55" stop-color="#1f1235"/>
      <stop offset="1" stop-color="#120b1c"/>
    </radialGradient>
  </defs>`;

function svg({ maskable, scale }) {
  const shape = maskable
    ? '<rect width="512" height="512" fill="url(#bg)"/>'
    : '<rect width="512" height="512" rx="112" fill="url(#bg)"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}${shape}
    <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${glyph}</g></svg>`;
}

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false, scale: 1 },
  { file: 'icon-512.png', size: 512, maskable: false, scale: 1 },
  { file: 'maskable-192.png', size: 192, maskable: true, scale: 0.78 },
  { file: 'maskable-512.png', size: 512, maskable: true, scale: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, maskable: true, scale: 0.9 },
];

await mkdir(out, { recursive: true });
await writeFile(path.join(out, 'favicon.svg'), svg({ maskable: false, scale: 1 }));

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(t).replace('<svg ', `<svg width="${t.size}" height="${t.size}" `)}</body></html>`);
  const buf = await page.screenshot({ omitBackground: !t.maskable, clip: { x: 0, y: 0, width: t.size, height: t.size } });
  await writeFile(path.join(out, t.file), buf);
  console.log('skrev', t.file);
}
await browser.close();
