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

const FPS = 24;
// 1000 / 24 = 41.67ms. img2webp accepts integer milliseconds, so use 42ms.
const FRAME_DELAY_MS = 42;
const STILL_FRAME = 0.18;

const SCENES = [
  {
    key: 'hero',
    label: '3D hero',
    url: '/scripts/hero-scene.html?layout=hero',
    width: 1200,
    height: 450,
    frames: 144,
    quality: 86,
    webp: 'dikaofc-hero.webp',
    still: 'dikaofc-hero.png',
    settleMs: 250,
  },
  {
    key: 'identity',
    label: 'identity panel',
    url: '/scripts/identity-scene.html',
    width: 1200,
    height: 620,
    frames: 120,
    quality: 88,
    webp: 'dikaofc-identity.webp',
    still: 'dikaofc-identity.png',
  },
  {
    key: 'focus',
    label: 'capability map',
    url: '/scripts/focus-scene.html',
    width: 1200,
    height: 520,
    frames: 120,
    quality: 88,
    webp: 'dikaofc-focus.webp',
    still: 'dikaofc-focus.png',
  },
  {
    key: 'now',
    label: 'now panel',
    url: '/scripts/now-scene.html',
    width: 1200,
    height: 480,
    frames: 120,
    quality: 88,
    webp: 'dikaofc-now.webp',
    still: 'dikaofc-now.png',
  },
  {
    key: 'principles',
    label: 'principles wall',
    url: '/scripts/principles-scene.html',
    width: 1200,
    height: 520,
    frames: 144,
    quality: 88,
    webp: 'dikaofc-principles.webp',
    still: 'dikaofc-principles.png',
  },
  {
    key: 'contact',
    label: 'contact gate',
    url: '/scripts/contact-scene.html',
    width: 1200,
    height: 340,
    frames: 120,
    quality: 88,
    webp: 'dikaofc-contact.webp',
    still: 'dikaofc-contact.png',
  },
];

const STATIC_STILLS = [
  {
    key: 'og',
    label: 'Open Graph still',
    url: '/scripts/hero-scene.html?layout=og',
    width: 1200,
    height: 630,
    frame: 0.25,
    file: 'dikaofc-og.png',
    settleMs: 250,
  },
  {
    key: 'avatar',
    label: 'avatar still',
    url: '/scripts/hero-scene.html?layout=avatar',
    width: 1024,
    height: 1024,
    frame: 0.2,
    file: 'dikaofc-avatar.png',
    settleMs: 250,
  },
];

const SKIP_HERO = process.env.SKIP_HERO === '1';
const ONLY = (process.env.ONLY || '')
  .split(',')
  .map(name => name.trim().toLowerCase())
  .filter(Boolean);
const only = new Set(ONLY);
const wanted = key => only.size === 0 || only.has(key);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

const written = [];
let browser;
let server;
let base;
let tmpDir;
let hasWebpinfo = false;

function fail(message) {
  throw new Error(message);
}

function hasCommand(command, versionFlag = '-version') {
  return spawnSync(command, [versionFlag], { stdio: 'ignore' }).status === 0;
}

function megabytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function record(file) {
  const { size } = fs.statSync(file);
  written.push({ file: path.relative(root, file), size });
  return size;
}

function startServer() {
  return new Promise((resolve, reject) => {
    const httpServer = http.createServer((req, res) => {
      let requested;
      try {
        requested = decodeURIComponent((req.url || '/').split('?')[0]);
      } catch {
        res.writeHead(400);
        res.end('Bad request');
        return;
      }

      const file = path.resolve(root, `.${requested}`);
      if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
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
          'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        });
        res.end(data);
      });
    });

    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', () => {
      const { port } = httpServer.address();
      resolve({ httpServer, port });
    });
  });
}

async function openPage({ url, width, height, key, settleMs = 0 }) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', error => console.error(`[${key}] ${error.message}`));

  await page.goto(`${base}${url}`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForFunction(() => window.__ready === true, undefined, { timeout: 120_000 });
  await page.evaluate(() => document.fonts.ready);
  if (settleMs > 0) await page.waitForTimeout(settleMs);
  return page;
}

function frameFiles(scene, frameDir) {
  return Array.from({ length: scene.frames }, (_, i) =>
    path.join(frameDir, `frame-${String(i).padStart(3, '0')}.png`),
  );
}

function encodeWebp(scene, frameDir) {
  const output = path.join(assetsDir, scene.webp);
  const args = [
    '-loop', '0',
    '-lossy',
    '-q', String(scene.quality),
    '-m', '6',
    '-d', String(FRAME_DELAY_MS),
    ...frameFiles(scene, frameDir),
    '-o', output,
  ];

  const result = spawnSync('img2webp', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`img2webp failed for ${scene.key}${detail ? `: ${detail}` : ''}`);
  }
  return output;
}

function describeWebp(file, hasWebpinfo) {
  if (!hasWebpinfo) return '';
  const result = spawnSync('webpinfo', [file], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) return '';

  const text = `${result.stdout || ''}\n${result.stderr || ''}`;
  const frameCount = (text.match(/^\s*Chunk ANMF\b/gm) || []).length;
  const canvas = text.match(/Canvas size\s+(\d+)\s*x\s+(\d+)/i);
  const animation = text.match(/^\s*Animation:\s*\d+\s*$/m);
  const parts = [];
  if (frameCount > 0) parts.push(`${frameCount} frames`);
  if (canvas) parts.push(`${canvas[1]}x${canvas[2]}`);
  if (animation) parts.push(animation[0].trim().replace(/\s+/g, ' '));
  return parts.join(' · ');
}

async function renderScene(scene) {
  const frameDir = path.join(tmpDir, scene.key);
  fs.mkdirSync(frameDir, { recursive: true });

  console.log(
    `\nRendering ${scene.label} — ${scene.width}x${scene.height}, ${scene.frames} frames @ ${FPS} fps…`,
  );

  const page = await openPage(scene);
  try {
    for (let i = 0; i < scene.frames; i++) {
      // t = i / frames, never 1: the last frame is frames-1, keeping the loop seamless.
      await page.evaluate(t => window.__setFrame(t), i / scene.frames);
      await page.screenshot({
        path: path.join(frameDir, `frame-${String(i).padStart(3, '0')}.png`),
      });
      if (i === 0 || (i + 1) % 24 === 0 || i === scene.frames - 1) {
        console.log(`  frames ${i + 1}/${scene.frames}`);
      }
    }

    const stillPath = path.join(assetsDir, scene.still);
    await page.evaluate(t => window.__setFrame(t), STILL_FRAME);
    await page.screenshot({ path: stillPath });
    const stillSize = record(stillPath);
    console.log(`  still  assets/${scene.still} — ${megabytes(stillSize)}`);
  } finally {
    await page.close();
  }

  console.log(`Encoding assets/${scene.webp} (quality ${scene.quality})…`);
  const webpPath = encodeWebp(scene, frameDir);
  const webpSize = record(webpPath);
  const info = describeWebp(webpPath, hasWebpinfo);
  console.log(`  webp   assets/${scene.webp} — ${megabytes(webpSize)}${info ? ` (${info})` : ''}`);
}

async function renderStatic(still) {
  console.log(`\nRendering ${still.label} — ${still.width}x${still.height} at t=${still.frame}…`);
  const page = await openPage(still);
  try {
    await page.evaluate(t => window.__setFrame(t), still.frame);
    const output = path.join(assetsDir, still.file);
    await page.screenshot({ path: output });
    const size = record(output);
    console.log(`  still  assets/${still.file} — ${megabytes(size)}`);
  } finally {
    await page.close();
  }
}

async function main() {
  if (!fs.existsSync(path.join(root, 'node_modules', 'three'))) {
    fail('Missing dependencies. Run: npm install');
  }
  if (!hasCommand('img2webp')) {
    fail('img2webp is required to encode the animated WebP assets. Install the WebP tools (for example: apt-get install webp, or brew install webp).');
  }
  hasWebpinfo = hasCommand('webpinfo');
  if (!hasWebpinfo) {
    console.warn('webpinfo not found; WebP frame details will be omitted from the report.');
  }

  fs.mkdirSync(assetsDir, { recursive: true });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dikaofc-render-'));

  const scenePlan = SCENES.filter(scene =>
    scene.key === 'hero' ? !SKIP_HERO && wanted('hero') : wanted(scene.key),
  );
  const staticPlan = STATIC_STILLS.filter(
    still => !SKIP_HERO && (only.size === 0 || wanted('hero') || wanted(still.key)),
  );

  const unknown = ONLY.filter(
    name => !SCENES.some(scene => scene.key === name) && !STATIC_STILLS.some(still => still.key === name),
  );
  if (unknown.length > 0) {
    console.warn(`Ignoring unknown ONLY value(s): ${unknown.join(', ')}`);
  }
  if (SKIP_HERO) console.log('SKIP_HERO=1 — skipping hero animation, OG still, and avatar still.');
  if (ONLY.length > 0) console.log(`ONLY=${ONLY.join(',')} — rendering selected assets.`);
  if (scenePlan.length === 0 && staticPlan.length === 0) {
    console.log('Nothing selected to render.');
    return;
  }

  const started = await startServer();
  server = started.httpServer;
  base = `http://127.0.0.1:${started.port}`;

  browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
    ],
  });

  for (let i = 0; i < scenePlan.length; i++) {
    console.log(`\n[${i + 1}/${scenePlan.length}] ${scenePlan[i].key}`);
    await renderScene(scenePlan[i]);
  }

  for (const still of staticPlan) await renderStatic(still);

  if (written.length > 0) {
    console.log('\nAssets written:');
    for (const entry of written) {
      console.log(`  ${entry.file.padEnd(32)} ${megabytes(entry.size).padStart(9)}`);
    }
    const total = written.reduce((sum, entry) => sum + entry.size, 0);
    console.log(`  ${'Total'.padEnd(32)} ${megabytes(total).padStart(9)}`);
  }
  console.log('');
}

try {
  await main();
} catch (error) {
  console.error(`\nAsset render failed: ${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) {
    await new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections?.();
    });
  }
  if (tmpDir) {
    if (process.env.KEEP_RENDERS === '1') {
      console.log(`Intermediate frames kept at ${tmpDir}`);
    } else {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}
