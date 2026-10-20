import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = '/workspaces/dikaglorya';
const outDir = '/tmp/dika-assets/review/hero-new';
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(root, requested);
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

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

try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 450 }, deviceScaleFactor: 1 });
  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('[pageerror]', error.stack));
  await page.goto(`http://127.0.0.1:${port}/scripts/hero-scene.html?layout=hero`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 120000 });
  console.log('ready');
  for (const [name, t] of [['t00', 0.0], ['t15', 0.15], ['t30', 0.3], ['t50', 0.5], ['t70', 0.7]]) {
    await page.evaluate(t => window.__setFrame(t), t);
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(outDir, `${name}.png`) });
    console.log('captured', name);
  }
  await page.close();
} finally {
  await browser.close();
  server.close();
}
