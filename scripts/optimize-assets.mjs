import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '..', 'assets');

// Encoding is handled by scripts/render-assets.mjs (img2webp). This script only
// audits the pipeline output, so it stays dependency-free beyond Node built-ins.
const ANIMATED = [
  'dikaofc-hero.webp',
  'dikaofc-identity.webp',
  'dikaofc-focus.webp',
  'dikaofc-now.webp',
  'dikaofc-principles.webp',
  'dikaofc-contact.webp',
];

const STILLS = [
  'dikaofc-hero.png',
  'dikaofc-identity.png',
  'dikaofc-focus.png',
  'dikaofc-now.png',
  'dikaofc-principles.png',
  'dikaofc-contact.png',
];

const SOCIAL = ['dikaofc-og.png', 'dikaofc-avatar.png'];

const files = [...ANIMATED, ...STILLS, ...SOCIAL];
const hasWebpinfo = spawnSync('webpinfo', ['-version'], { stdio: 'ignore' }).status === 0;

function megabytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function webpSummary(file) {
  if (!hasWebpinfo) return '';
  const result = spawnSync('webpinfo', [file], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) return 'unreadable';

  const text = `${result.stdout || ''}\n${result.stderr || ''}`;
  const frames = (text.match(/^\s*Chunk ANMF\b/gm) || []).length;
  const canvas = text.match(/Canvas size\s+(\d+)\s*x\s+(\d+)/i);
  return [
    frames > 0 ? `${frames} frames` : null,
    canvas ? `${canvas[1]}x${canvas[2]}` : null,
  ].filter(Boolean).join(' · ');
}

function pngSize(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const header = Buffer.alloc(24);
    fs.readSync(fd, header, 0, header.length, 0);
    const signature = '89504e470d0a1a0a';
    if (header.subarray(0, 8).toString('hex') !== signature) return '';
    return `${header.readUInt32BE(16)}x${header.readUInt32BE(20)}`;
  } finally {
    fs.closeSync(fd);
  }
}

function printRow(name) {
  const file = path.join(assetsDir, name);
  if (!fs.existsSync(file)) {
    console.log(`  ${name.padEnd(28)} missing`);
    return { size: 0, exists: false };
  }

  const { size } = fs.statSync(file);
  const info = name.endsWith('.webp') ? webpSummary(file) : pngSize(file);
  console.log(
    `  ${name.padEnd(28)} ${megabytes(size).padStart(9)}${info ? `  ${info}` : ''}`,
  );
  return { size, exists: true };
}

const present = files.filter(name => fs.existsSync(path.join(assetsDir, name)));
if (present.length === 0) {
  console.error('No pipeline assets found in assets/. Run npm run render:assets first.');
  process.exit(1);
}

if (!hasWebpinfo) {
  console.warn('webpinfo not found; animated WebP frame counts will be omitted.');
}

let total = 0;
let missing = 0;

console.log('Animated WebP:');
for (const name of ANIMATED) {
  const row = printRow(name);
  total += row.size;
  if (!row.exists) missing++;
}

console.log('\nPNG stills:');
for (const name of STILLS) {
  const row = printRow(name);
  total += row.size;
  if (!row.exists) missing++;
}

console.log('\nOpen Graph / avatar:');
for (const name of SOCIAL) {
  const row = printRow(name);
  total += row.size;
  if (!row.exists) missing++;
}

const found = files.length - missing;
console.log(
  `\nTotal: ${megabytes(total)} across ${found}/${files.length} files${missing ? ` (${missing} missing)` : ''}.`,
);
