import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [urlPath = '/scripts/identity-scene.html', widthArg = '1200', heightArg = '620', outName = 'panel'] = process.argv.slice(2);
const width = Number(widthArg);
const height = Number(heightArg);
const root = '/workspaces/dikaglorya';
const outDir = `/tmp/dika-assets/review/${outName}`;
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.css': 'text/css; charset=utf-8',
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
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('[pageerror]', error.stack));
  await page.goto(`http://127.0.0.1:${port}${urlPath}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 60000 });
  if (process.env.NO_PLATE === '1') {
    await page.addStyleTag({ content: '.principle.plate::before{display:none!important}' });
  }
  if (process.env.HIDE_LAYERS === '1') {
    await page.addStyleTag({ content: '.headline-line .ext-layer{display:none!important}' });
  }
  if (process.env.NO_TEXT_SHADOW === '1') {
    await page.addStyleTag({ content: '.headline-line .ext-face{text-shadow:none!important}' });
  }
  if (process.env.HIDE_PORTAL === '1') {
    await page.addStyleTag({ content: '.portal{display:none!important}' });
  }
  if (process.env.HIDE_AURA === '1') {
    await page.addStyleTag({ content: '.copy-aura{display:none!important}' });
  }
  if (process.env.NO_META_SHADOW === '1') {
    await page.addStyleTag({ content: '.copy .meta{text-shadow:none!important}' });
  }
  if (process.env.HIDE_HEADLINE === '1') {
    await page.addStyleTag({ content: '.headline{display:none!important}' });
  }
  if (process.env.GHOST === '1') {
    await page.addStyleTag({ content: `
      .bg, .grid-floor, .horizon-glow, .principle, .principle::before, .principle::after,
      .core, .core-halo, .core-sphere, .core-ring, .ring-back, .giant-six, .frame {
        background: transparent !important;
        border-color: rgba(255,255,255,.2) !important;
        box-shadow: none !important;
        filter: none !important;
      }
      .principle .p-copy b { color: #ff0 !important; }
    ` });
  }
  console.log('ready');
  if (urlPath.includes('contact')) {
    const info = await page.evaluate(() => {
      const meta = document.querySelector('.copy .meta');
      const rect = x => { const r = x.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
      return {
        meta: rect(meta), text: meta.textContent,
        children: [...meta.children].map(el => ({ tag: el.tagName, text: el.textContent, rect: rect(el), overflow: getComputedStyle(el).overflow })),
        metaStyle: { overflow: getComputedStyle(meta).overflow, display: getComputedStyle(meta).display, width: getComputedStyle(meta).width, color: getComputedStyle(meta).color, textShadow: getComputedStyle(meta).textShadow },
        scrollW: meta.scrollWidth, clientW: meta.clientWidth,
        copy: rect(document.querySelector('.copy')),
      };
    });
    console.log(JSON.stringify(info, null, 2));
  }
  if (urlPath.includes('principles')) {
    const info = await page.evaluate(() => {
      const el = document.querySelectorAll('.principle')[1];
      const copy = el.querySelector('.p-copy');
      const b = copy.querySelector('b');
      const rect = x => { const r = x.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
      return {
        tag: rect(el), copy: rect(copy), b: rect(b),
        text: b.textContent,
        bScrollW: b.scrollWidth, bClientW: b.clientWidth,
        copyScrollW: copy.scrollWidth, copyClientW: copy.clientWidth,
        tagOverflow: getComputedStyle(el).overflow,
        copyOverflow: getComputedStyle(copy).overflow,
        bOverflow: getComputedStyle(b).overflow,
        bWhiteSpace: getComputedStyle(b).whiteSpace,
      };
    });
    console.log(info);
  }
  for (const [name, t] of [['t00', 0.0], ['t18', 0.18], ['t42', 0.42], ['t68', 0.68]]) {
    await page.evaluate(t => window.__setFrame(t), t);
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(outDir, `${name}.png`) });
    if (urlPath.includes('principles') && name === 't18') {
      await page.locator('.principle').nth(1).screenshot({ path: path.join(outDir, 'tag02.png') });
      const stack = await page.evaluate(() => [1120, 270].map((x, idx) => ({
        point: x,
        els: document.elementsFromPoint(x, 270).slice(0, 8).map(el => ({
          tag: el.tagName,
          cls: typeof el.className === 'string' ? el.className : '',
          text: (el.textContent || '').trim().slice(0, 40),
        })),
      })));
      console.log(JSON.stringify(stack, null, 2));
    }
    console.log('captured', name);
  }
  await page.close();
} finally {
  await browser.close();
  server.close();
}
