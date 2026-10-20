import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = '/workspaces/dikaglorya';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent((req.url || '/').split('?')[0]));
  fs.readFile(file, (e, data) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

const variants = {
  baseline: '',
  noFilter: '.tunnel-ring,.portal-glow,.portal-core{filter:none!important}',
  noRays: '.portal-rays{display:none!important}',
  noRings: '.tunnel-ring{display:none!important}',
  noCopy: '.copy{display:none!important}',
  noAura: '.copy-aura,.portal-glow{display:none!important}',
  noShadows: '.tunnel-ring,.portal-core,.front-arc{box-shadow:none!important}',
  noParticles: '.particles,.shard{display:none!important}',
  lean: '.tunnel-ring,.portal-glow,.portal-core,.copy-aura{filter:none!important}.tunnel-ring,.portal-core,.front-arc{box-shadow:none!important}.portal-rays{display:none!important}.particles,.shard{display:none!important}',
};

for (const [name, css] of Object.entries(variants)) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 340 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/scripts/contact-scene.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 60000 });
  if (css) await page.addStyleTag({ content: css });
  await page.evaluate(() => window.__setFrame(0.18));
  await page.waitForTimeout(100);
  const times = [];
  for (let i = 0; i < 3; i++) {
    const t0 = Date.now();
    await page.screenshot({ path: `/tmp/bench-${name}-${i}.png` });
    times.push(Date.now() - t0);
    await page.evaluate(v => window.__setFrame(v), 0.18 + i * 0.1);
  }
  console.log(name.padEnd(12), times.join(' / '), 'ms');
  await page.close();
}
await browser.close();
server.close();
