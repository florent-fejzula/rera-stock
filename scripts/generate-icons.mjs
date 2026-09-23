import sharp from 'sharp';
import { readFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(dir, '../public');
const svgBuffer = readFileSync(join(publicDir, 'icon.svg'));

mkdirSync(publicDir, { recursive: true });

const icons = [
  { file: 'pwa-64x64.png',              size: 64  },
  { file: 'pwa-192x192.png',            size: 192 },
  { file: 'pwa-512x512.png',            size: 512 },
  { file: 'maskable-icon-512x512.png',  size: 512 },
  { file: 'apple-touch-icon-180x180.png', size: 180 },
];

for (const { file, size } of icons) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, file));
  console.log(`✓  ${file}`);
}

console.log('\nAll icons written to public/');
