const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('node:fs/promises');
const path = require('node:path');

// The editable, hand-drawn SVG is the sole source for every application asset.
async function generateAppIcons() {
  const root = path.join(__dirname, '..');
  const build = path.join(root, 'build');
  const publicDir = path.join(root, 'public');
  const svg = await fs.readFile(path.join(build, 'icon.svg'));
  await fs.mkdir(publicDir, { recursive: true });
  const render = size => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
  const sizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
  const frames = await Promise.all(sizes.map(render));
  await fs.writeFile(path.join(build, 'icon.ico'), await pngToIco(frames));
  await fs.writeFile(path.join(build, 'icon.png'), await render(512));
  await fs.writeFile(path.join(publicDir, 'icon.png'), await render(128));
  await fs.writeFile(path.join(publicDir, 'icon.svg'), svg);
  console.log(`Generated SVG/PNG and ICO: ${sizes.join(', ')}px`);
}

generateAppIcons().catch(error => {
  console.error('Icon generation failed:', error);
  process.exitCode = 1;
});
