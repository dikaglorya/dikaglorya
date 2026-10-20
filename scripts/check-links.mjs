import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

const urls = new Set();
for (const match of readme.matchAll(/https?:\/\/[^\s<>"'`)\]]+/g)) {
  urls.add(match[0].replace(/[.,;:]+$/, ''));
}
for (const match of readme.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)) {
  urls.add(match[1]);
}

const localAssets = new Set();
for (const match of readme.matchAll(/(?:src|href)="((?!https?:|mailto:|#)[^"]+)"/g)) {
  localAssets.add(match[1]);
}

console.log(`Local assets referenced by README.md:`);
let localFailures = 0;
for (const asset of localAssets) {
  const file = path.join(root, asset);
  const ok = fs.existsSync(file) && fs.statSync(file).size > 0;
  console.log(`  ${ok ? 'OK  ' : 'FAIL'}  ${asset}`);
  if (!ok) localFailures++;
}

console.log(`\nExternal links (${urls.size}):`);
let linkFailures = 0;
for (const url of [...urls].sort()) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(25_000),
      headers: {
        'User-Agent': 'dikaglorya-profile-link-check/1.0',
        Accept: 'text/html,application/xhtml+xml,image/*,*/*;q=0.8',
      },
    });
    const ok = response.status >= 200 && response.status < 400;
    console.log(`  ${ok ? 'OK  ' : 'FAIL'}  ${response.status}  ${url}`);
    if (!ok) linkFailures++;
  } catch (error) {
    console.log(`  FAIL  ${error.name}: ${error.message}  ${url}`);
    linkFailures++;
  }
}

if (localFailures || linkFailures) {
  console.error(`\n${localFailures} local and ${linkFailures} external check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log('\nAll local assets and external links passed.');
}
