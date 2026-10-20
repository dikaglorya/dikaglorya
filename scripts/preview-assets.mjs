import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'assets');
const previewDir = path.join(root, 'preview');

const ASSETS = [
  'hero-dark.svg',
  'hero-light.svg',
  'about-3d.svg',
  'about-3d-light.svg',
  'skills-3d.svg',
  'skills-3d-light.svg',
  'stats-3d.svg',
  'stats-3d-light.svg',
  'divider.svg',
  'divider-light.svg',
  'footer-dark.svg',
  'footer-light.svg',
];

const WIDTH = 1200;
const SETTLE_MS = 900;

function naturalHeight(text, name) {
  const viewBox = text.match(/\bviewBox\s*=\s*(["'])([^"']*)\1/);
  if (!viewBox) throw new Error('missing viewBox');

  const values = viewBox[2].trim().split(/[\s,]+/).map(Number);
  if (values.length !== 4 || values.some(value => !Number.isFinite(value))) {
    throw new Error(`invalid viewBox "${viewBox[2]}"`);
  }

  const [, , viewWidth, viewHeight] = values;
  if (viewWidth <= 0 || viewHeight <= 0) {
    throw new Error(`non-positive viewBox size "${viewBox[2]}"`);
  }

  return Math.max(1, Math.round((WIDTH * viewHeight) / viewWidth));
}

async function main() {
  fs.mkdirSync(previewDir, { recursive: true });

  const browser = await chromium.launch();
  let failed = 0;
  let written = 0;

  try {
    for (const name of ASSETS) {
      const source = path.join(assetsDir, name);
      const target = path.join(previewDir, `${path.basename(name, '.svg')}.png`);

      try {
        const svg = fs.readFileSync(source, 'utf8');
        const height = naturalHeight(svg, name);
        const page = await browser.newPage({
          viewport: { width: WIDTH, height },
          deviceScaleFactor: 1,
        });

        try {
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await page.setContent(
            `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
  svg { display: block; width: ${WIDTH}px !important; height: ${height}px !important; }
</style>
</head>
<body>${svg}</body>
</html>`,
            { waitUntil: 'load' },
          );

          await page.evaluate(async () => {
            if (document.fonts?.ready) await document.fonts.ready;
          });
          await page.waitForTimeout(SETTLE_MS);

          // Hold a representative frame while capturing, so CSS and SMIL
          // animations do not produce a partially composited screenshot.
          await page.evaluate(() => {
            for (const animation of document.getAnimations()) {
              try {
                animation.pause();
              } catch {
                // Ignore animations that cannot be paused.
              }
            }
            for (const svgElement of document.querySelectorAll('svg')) {
              try {
                svgElement.pauseAnimations?.();
              } catch {
                // Ignore SVGs that do not support SMIL control.
              }
            }
          });

          await page.screenshot({ path: target, type: 'png', omitBackground: true });
        } finally {
          await page.close();
        }

        const { size } = fs.statSync(target);
        if (size === 0) throw new Error('screenshot is zero bytes');

        written++;
        console.log(`OK ${path.relative(root, target)} (${WIDTH}x${height})`);
      } catch (error) {
        failed++;
        console.log(`FAIL ${name}: ${error.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\nPreview summary: ${written} written, ${failed} failed, ${ASSETS.length} total`);
  console.log(`Output: ${path.relative(root, previewDir)}/`);
  if (failed > 0) process.exitCode = 1;
}

main().catch(error => {
  console.error(`Preview crashed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
