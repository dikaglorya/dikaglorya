import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '..', 'assets');

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

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_BYTES = 500 * 1024;
const FORBIDDEN_ELEMENTS = new Set(['script', 'foreignobject', 'image']);

function attributeList(tagBody) {
  const attrs = [];
  const re = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = re.exec(tagBody)) !== null) {
    attrs.push([match[1], match[2] ?? match[3] ?? '']);
  }
  return attrs;
}

function inspectMarkup(text) {
  const errors = [];

  const tagRe = /<([A-Za-z][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)\/?>/g;
  let match;
  while ((match = tagRe.exec(text)) !== null) {
    const tag = match[1];
    const lower = tag.toLowerCase();
    if (FORBIDDEN_ELEMENTS.has(lower)) {
      errors.push(`forbidden <${tag}> element`);
    }

    for (const [name, value] of attributeList(match[2])) {
      const local = name.toLowerCase();
      if (/^on[a-z]/i.test(local)) {
        errors.push(`forbidden event handler attribute "${name}"`);
      }
      if (local === 'href' || local === 'xlink:href') {
        if (!value.trim().startsWith('#')) {
          errors.push(`external href is not allowed ("${name}=${value}")`);
        }
      }
    }
  }

  const withoutNamespace = text.replace(
    /xmlns\s*=\s*(["'])http:\/\/www\.w3\.org\/2000\/svg\1/gi,
    '',
  );
  const urls = withoutNamespace.match(/https?:\/\/[^\s"'<>)]+/gi) || [];
  for (const url of [...new Set(urls)]) {
    errors.push(`external URL is not allowed ("${url}")`);
  }

  if (!/\bxmlns\s*=\s*(["'])http:\/\/www\.w3\.org\/2000\/svg\1/.test(text)) {
    errors.push(`missing required SVG namespace declaration (${SVG_NS})`);
  }

  const viewBox = text.match(/\bviewBox\s*=\s*(["'])([^"']*)\1/);
  if (!viewBox) {
    errors.push('missing viewBox');
  } else {
    const values = viewBox[2].trim().split(/[\s,]+/).map(Number);
    if (values.length !== 4 || values.some(value => !Number.isFinite(value))) {
      errors.push(`invalid viewBox "${viewBox[2]}"`);
    } else if (values[2] <= 0 || values[3] <= 0) {
      errors.push(`viewBox has non-positive size "${viewBox[2]}"`);
    }
  }

  for (const tag of ['title', 'desc']) {
    const element = text.match(
      new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}\\s*>`, 'i'),
    );
    const content = element?.[1].replace(/<[^>]*>/g, '').trim() || '';
    if (!content) errors.push(`missing or empty <${tag}>`);
  }

  if (!/@media[^{]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i.test(text)) {
    errors.push('missing prefers-reduced-motion handling');
  }

  return errors;
}

function checkAssets() {
  return ASSETS.map(name => {
    const file = path.join(assetsDir, name);
    const errors = [];

    if (!fs.existsSync(file)) {
      return { name, errors: ['file does not exist'], size: 0, text: null };
    }

    const { size } = fs.statSync(file);
    if (size > MAX_BYTES) {
      errors.push(
        `file is ${(size / 1024).toFixed(1)} KB; limit is ${MAX_BYTES / 1024} KB`,
      );
    }

    const text = fs.readFileSync(file, 'utf8');
    errors.push(...inspectMarkup(text));
    return { name, errors, size, text };
  });
}

function checkWithXmllint(assets) {
  const errorsByName = new Map();
  const available =
    spawnSync('xmllint', ['--version'], { stdio: 'ignore' }).status === 0;

  if (!available) return { parser: 'Chromium DOMParser (xmllint not found)', errorsByName };

  for (const asset of assets) {
    if (!asset.text) continue;
    const result = spawnSync('xmllint', ['--noout', path.join(assetsDir, asset.name)], {
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      const detail = `${result.stderr || ''}\n${result.stdout || ''}`
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(' ');
      errorsByName.set(asset.name, `XML parse error${detail ? `: ${detail}` : ''}`);
    }
  }

  return { parser: 'xmllint --noout', errorsByName };
}

async function checkWithChromium(assets) {
  const errorsByName = new Map();
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const parsed = await page.evaluate(entries => {
      const result = {};
      for (const [name, text] of entries) {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const error = doc.querySelector('parsererror');
        if (error) result[name] = error.textContent.trim();
      }
      return result;
    }, assets.filter(asset => asset.text).map(asset => [asset.name, asset.text]));

    for (const [name, detail] of Object.entries(parsed)) {
      errorsByName.set(name, `XML parse error${detail ? `: ${detail}` : ''}`);
    }
  } finally {
    await browser.close();
  }
  return errorsByName;
}

async function main() {
  const assets = checkAssets();
  const xmllint = checkWithXmllint(assets);

  let parseErrors = xmllint.errorsByName;
  if (xmllint.parser.startsWith('Chromium')) {
    parseErrors = await checkWithChromium(assets);
  }

  let failed = 0;
  console.log(`XML parser: ${xmllint.parser}`);
  console.log(`Validating ${assets.length} SVG assets in assets/`);

  for (const asset of assets) {
    const errors = [...asset.errors];
    if (parseErrors.has(asset.name)) errors.push(parseErrors.get(asset.name));

    if (errors.length === 0) {
      console.log(`PASS ${asset.name} (${(asset.size / 1024).toFixed(1)} KB)`);
    } else {
      failed++;
      console.log(`FAIL ${asset.name}`);
      for (const error of errors) console.log(`     - ${error}`);
    }
  }

  const passed = assets.length - failed;
  console.log(`\nSummary: ${passed} passed, ${failed} failed, ${assets.length} total`);
  if (failed > 0) process.exitCode = 1;
}

main().catch(error => {
  console.error(`Validation crashed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
