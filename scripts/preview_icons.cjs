const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const root = path.join(__dirname, '..');
  const svg = await fs.readFile(path.join(root, 'build/icon.svg'));
  const layers = [];
  const sizes = [16, 32, 48, 256];
  let labels = '';
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < sizes.length; col++) {
      const size = sizes[col];
      layers.push({ input: await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer(), left: col * 300 + Math.round((300 - size) / 2), top: row * 340 + 20 + Math.round((276 - size) / 2) });
      labels += `<text x="${col * 300 + 150}" y="${row * 340 + 316}" fill="${row ? '#f3f4f6' : '#1c1d21'}">${size}px</text>`;
    }
  }
  const bg = Buffer.from(`<svg width="1200" height="680"><rect width="1200" height="340" fill="#ffffff"/><rect y="340" width="1200" height="340" fill="#14161d"/></svg>`);
  layers.push({ input: Buffer.from(`<svg width="1200" height="680"><g font-family="Segoe UI, sans-serif" font-size="16" text-anchor="middle">${labels}</g></svg>`), left: 0, top: 0 });
  await sharp(bg).composite(layers).png().toFile(path.join(root, 'build/icon-review.png'));
})();
