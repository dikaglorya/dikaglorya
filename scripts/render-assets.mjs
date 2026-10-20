import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'assets');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dikaofc-render-'));
const framesDir = path.join(tmpDir, 'frames');
fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });

const HERO_W = 1440;
const HERO_H = 540;
const HERO_FRAMES = 48;
const FPS = 15;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function hasCommand(command, versionFlag = '-version') {
  return spawnSync(command, [versionFlag], { stdio: 'ignore' }).status === 0;
}

if (!fs.existsSync(path.join(root, 'node_modules', 'three'))) {
  fail('Missing dependencies. Run: npm install');
}
if (!hasCommand('ffmpeg')) {
  fail('ffmpeg is required to encode the hero GIF. Install it, then run again.');
}
if (!hasCommand('gifsicle', '--version')) {
  fail('gifsicle is required to optimize the hero GIF. Install it, then run again.');
}

const server = http.createServer((req, res) => {
  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(root, requested === '/' ? '/README.md' : requested);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});

async function openScene(layout, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on('pageerror', error => console.error(`[${layout}] ${error.message}`));
  await page.goto(`${base}/scripts/hero-scene.html?layout=${layout}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 60_000 });
  await page.waitForTimeout(350);
  return page;
}

async function renderSvgAsset(name, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto(`${base}/assets/${name}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.background = '#07090c';
    document.documentElement.style.overflow = 'hidden';
    if (document.body) {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.background = '#07090c';
    }
    const svg = document.querySelector('svg');
    if (svg) {
      svg.style.display = 'block';
      svg.style.margin = '0';
    }
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(assetsDir, name.replace(/\.svg$/, '.png')),
  });
  await page.close();
}

try {
  console.log('Rendering hero frames…');
  const hero = await openScene('hero', HERO_W, HERO_H);
  for (let i = 0; i < HERO_FRAMES; i++) {
    await hero.evaluate(t => window.__setFrame(t), i / HERO_FRAMES);
    await hero.screenshot({
      path: path.join(framesDir, `frame-${String(i).padStart(3, '0')}.png`),
    });
    if (i % 8 === 0) process.stdout.write(`  ${i}/${HERO_FRAMES}\n`);
  }
  await hero.evaluate(() => window.__setFrame(0));
  await hero.screenshot({ path: path.join(assetsDir, 'dikaofc-hero.png') });
  await hero.close();

  console.log('Rendering Open Graph still…');
  const og = await openScene('og', 1200, 630);
  await og.evaluate(() => window.__setFrame(0.25));
  await og.screenshot({ path: path.join(assetsDir, 'dikaofc-og.png') });
  await og.close();

  console.log('Rendering avatar still…');
  const avatar = await openScene('avatar', 1024, 1024);
  await avatar.evaluate(() => window.__setFrame(0.2));
  await avatar.screenshot({ path: path.join(assetsDir, 'dikaofc-avatar.png') });
  await avatar.close();

  console.log('Rendering editorial panels…');
  await renderSvgAsset('dikaofc-identity.svg', 960, 600);
  await renderSvgAsset('dikaofc-projects.svg', 1200, 350);

  console.log('Encoding GIF…');
  const palette = path.join(tmpDir, 'palette.png');
  const rawGif = path.join(tmpDir, 'hero.gif');
  const input = path.join(framesDir, 'frame-%03d.png');
  let result = spawnSync('ffmpeg', [
    '-y', '-framerate', String(FPS), '-i', input,
    '-vf', 'palettegen=stats_mode=diff:max_colors=256',
    '-update', '1', palette,
  ], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('ffmpeg palette generation failed');

  result = spawnSync('ffmpeg', [
    '-y', '-framerate', String(FPS), '-i', input, '-i', palette,
    '-lavfi', 'paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle',
    '-loop', '0', rawGif,
  ], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('ffmpeg GIF encoding failed');

  const finalGif = path.join(assetsDir, 'dikaofc-hero.gif');
  result = spawnSync('gifsicle', ['-O3', '--lossy=15', rawGif, '-o', finalGif], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('gifsicle optimization failed');

  console.log('\nAssets written:');
  for (const name of [
    'dikaofc-hero.gif',
    'dikaofc-hero.png',
    'dikaofc-og.png',
    'dikaofc-avatar.png',
    'dikaofc-identity.png',
    'dikaofc-projects.png',
  ]) {
    const file = path.join(assetsDir, name);
    const { size } = fs.statSync(file);
    console.log(`  assets/${name} — ${(size / 1024).toFixed(0)} KB`);
  }
} finally {
  await browser.close();
  server.close();
  if (process.env.KEEP_RENDERS === '1') {
    console.log(`\nIntermediate frames kept at ${tmpDir}`);
  } else {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
