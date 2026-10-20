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
const panelFramesDir = path.join(tmpDir, 'panel-frames');
const focusFramesDir = path.join(tmpDir, 'focus-frames');
const ctaFramesDir = path.join(tmpDir, 'cta-frames');
for (const dir of [framesDir, panelFramesDir, focusFramesDir, ctaFramesDir]) {
  fs.mkdirSync(dir, { recursive: true });
}
fs.mkdirSync(assetsDir, { recursive: true });

const HERO_W = 1440;
const HERO_H = 540;
const HERO_FRAMES = 90;
const FPS = 15;
const PANEL_FRAMES = 48;
const PANEL_FPS = 12;
const FOCUS_W = 1200;
const FOCUS_H = 440;
const FOCUS_FRAMES = 72;
const FOCUS_FPS = 15;
const CTA_W = 1200;
const CTA_H = 260;
const CTA_FRAMES = 48;
const CTA_FPS = 12;
const SKIP_HERO = process.env.SKIP_HERO === '1';

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
    '--disable-dev-shm-usage',
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

function encodeGif(framePattern, output, fps, options) {
  const {
    lossy = 15,
    paletteName = 'palette',
    scale = '1200:450',
    colors = 160,
    dither = 'bayer:bayer_scale=5',
  } = options;
  const palette = path.join(tmpDir, `${paletteName}.png`);
  const rawGif = path.join(tmpDir, `${paletteName}.gif`);
  const scaleFilter = `scale=${scale}:flags=lanczos`;
  let result = spawnSync('ffmpeg', [
    '-y', '-framerate', String(fps), '-i', framePattern,
    '-vf', `${scaleFilter},palettegen=max_colors=${colors}:stats_mode=full`,
    '-update', '1', palette,
  ], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('ffmpeg palette generation failed');

  result = spawnSync('ffmpeg', [
    '-y', '-framerate', String(fps), '-i', framePattern, '-i', palette,
    '-lavfi', `[0:v]${scaleFilter}[x];[x][1:v]paletteuse=dither=${dither}:diff_mode=rectangle`,
    '-loop', '0', rawGif,
  ], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('ffmpeg GIF encoding failed');

  result = spawnSync('gifsicle', ['-O3', `--lossy=${lossy}`, rawGif, '-o', output], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('gifsicle optimization failed');
}

async function renderPanelScene(url, width, height, frames, frameDir, prefix) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', error => console.error(`[${prefix}] ${error.message}`));
  await page.goto(`${base}${url}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 60_000 });
  await page.waitForTimeout(200);
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.__setFrame(t), i / frames);
    await page.screenshot({
      path: path.join(frameDir, `${prefix}-${String(i).padStart(3, '0')}.png`),
    });
  }
  return page;
}


try {
  if (!SKIP_HERO) {
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
  } else {
    console.log('Skipping 3D hero / OG / avatar render (SKIP_HERO=1).');
  }

  console.log('Rendering editorial panels…');
  await renderSvgAsset('dikaofc-identity.svg', 960, 600);
  await renderSvgAsset('dikaofc-projects.svg', 1200, 350);

  console.log('Rendering animated identity panel…');
  const identity = await renderPanelScene(
    '/scripts/identity-scene.html',
    960,
    600,
    PANEL_FRAMES,
    panelFramesDir,
    'panel',
  );
  await identity.close();

  console.log('Rendering capability map…');
  const focus = await renderPanelScene(
    '/scripts/focus-scene.html',
    FOCUS_W,
    FOCUS_H,
    FOCUS_FRAMES,
    focusFramesDir,
    'focus',
  );
  await focus.evaluate(() => window.__setFrame(0.15));
  await focus.screenshot({ path: path.join(assetsDir, 'dikaofc-focus.png') });
  await focus.close();

  console.log('Rendering contact gate…');
  const cta = await renderPanelScene(
    '/scripts/cta-scene.html',
    CTA_W,
    CTA_H,
    CTA_FRAMES,
    ctaFramesDir,
    'cta',
  );
  await cta.evaluate(() => window.__setFrame(0.25));
  await cta.screenshot({ path: path.join(assetsDir, 'dikaofc-contact.png') });
  await cta.close();

  if (!SKIP_HERO) {
    console.log('Encoding hero GIF…');
    encodeGif(
      path.join(framesDir, 'frame-%03d.png'),
      path.join(assetsDir, 'dikaofc-hero.gif'),
      FPS,
      {
        lossy: 30,
        paletteName: 'hero-palette',
        scale: '1200:450',
        colors: 160,
        dither: 'bayer:bayer_scale=5',
      },
    );
  } else {
    console.log('Skipping hero GIF encoding (SKIP_HERO=1).');
  }

  console.log('Encoding identity GIF…');
  encodeGif(
    path.join(panelFramesDir, 'panel-%03d.png'),
    path.join(assetsDir, 'dikaofc-identity.gif'),
    PANEL_FPS,
    {
      lossy: 35,
      paletteName: 'panel-palette',
      scale: '800:500',
      colors: 96,
      dither: 'bayer:bayer_scale=5',
    },
  );

  console.log('Encoding capability map GIF…');
  encodeGif(
    path.join(focusFramesDir, 'focus-%03d.png'),
    path.join(assetsDir, 'dikaofc-focus.gif'),
    FOCUS_FPS,
    {
      lossy: 30,
      paletteName: 'focus-palette',
      scale: '1200:440',
      colors: 128,
      dither: 'bayer:bayer_scale=5',
    },
  );

  console.log('Encoding contact gate GIF…');
  encodeGif(
    path.join(ctaFramesDir, 'cta-%03d.png'),
    path.join(assetsDir, 'dikaofc-contact.gif'),
    CTA_FPS,
    {
      lossy: 30,
      paletteName: 'cta-palette',
      scale: '1200:260',
      colors: 128,
      dither: 'bayer:bayer_scale=5',
    },
  );

  console.log('\nAssets written:');
  for (const name of [
    'dikaofc-hero.gif',
    'dikaofc-hero.png',
    'dikaofc-og.png',
    'dikaofc-avatar.png',
    'dikaofc-identity.gif',
    'dikaofc-identity.png',
    'dikaofc-focus.gif',
    'dikaofc-focus.png',
    'dikaofc-contact.gif',
    'dikaofc-contact.png',
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
