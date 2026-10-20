import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '..', 'assets');
const files = [
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
  'dikaofc-mark.svg',
];

const gif = path.join(assetsDir, 'dikaofc-hero.gif');
const allowLossy = process.argv.includes('--lossy');

if (!fs.existsSync(gif)) {
  console.error('assets/dikaofc-hero.gif not found. Run npm run render:assets first.');
  process.exit(1);
}

const before = fs.statSync(gif).size;
const temp = path.join(assetsDir, '.dikaofc-hero.optimized.gif');
const args = ['-O3'];
if (allowLossy) args.push('--lossy=15');
args.push(gif, '-o', temp);

console.log(`Optimizing assets/dikaofc-hero.gif${allowLossy ? ' (lossy=15)' : ' (lossless)'}…`);
const result = spawnSync('gifsicle', args, { stdio: 'inherit' });
if (result.status !== 0) {
  fs.rmSync(temp, { force: true });
  console.error('gifsicle failed. Install gifsicle and try again.');
  process.exit(1);
}

const after = fs.statSync(temp).size;
if (after < before) {
  fs.renameSync(temp, gif);
  console.log(`GIF: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB`);
} else {
  fs.rmSync(temp, { force: true });
  console.log(`GIF is already optimized at ${(before / 1024).toFixed(0)} KB.`);
}

console.log('\nAsset inventory:');
for (const name of files) {
  const file = path.join(assetsDir, name);
  if (!fs.existsSync(file)) {
    console.log(`  ${name.padEnd(24)} missing`);
    continue;
  }
  const { size } = fs.statSync(file);
  let info = '';
  if (name.endsWith('.gif') || name.endsWith('.png')) {
    const probe = spawnSync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,nb_frames',
      '-of', 'csv=p=0', file,
    ], { encoding: 'utf8' });
    if (probe.status === 0) info = `  ${probe.stdout.trim()}`;
  }
  console.log(`  ${name.padEnd(24)} ${String((size / 1024).toFixed(0)).padStart(5)} KB${info}`);
}
