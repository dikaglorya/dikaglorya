// Quick QA: open every scene, step to a few loop positions, screenshot.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const out = '/tmp/opencode/qa';
fs.mkdirSync(out, { recursive: true });

const scenes = [
  ['hero', '/scripts/hero-scene.html?layout=hero', 1440, 540],
  ['intro', '/scripts/intro-scene.html', 1200, 360],
  ['identity', '/scripts/identity-scene.html', 960, 600],
  ['focus', '/scripts/focus-scene.html', 1200, 440],
  ['focuslist', '/scripts/focus-list-scene.html', 1200, 420],
  ['principles', '/scripts/principles-scene.html', 1200, 460],
  ['cta', '/scripts/cta-scene.html', 1200, 260],
  ['button', '/scripts/button-scene.html?text=PORTFOLIO&idx=01&total=05', 420, 110],
];

const mime = { '.html': 'text/html; charset=utf-8', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css; charset=utf-8' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent((req.url || '/').split('?')[0]));
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (e, data) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const only = process.argv[2];
const wanted = ([name]) => !only || name === only || only === 'all';

for (const [name, url, w, h] of scenes.filter(wanted)) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', e => console.error(`[${name}] ERROR: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') console.error(`[${name}] console: ${m.text()}`); });
  await page.goto(base + url, { waitUntil: 'networkidle' });
  try {
    await page.waitForFunction(() => window.__ready === true, { timeout: 45000 });
    for (const t of [0.05, 0.34, 0.71]) {
      await page.evaluate(v => window.__setFrame(v), t);
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(out, `${name}-t${t}.png`) });
    }
    console.log(`OK   ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}: ${e.message.split('\n')[0]}`);
  }
  await page.close();
}
await browser.close();
server.close();
console.log('QA frames in', out);
