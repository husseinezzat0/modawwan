const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const resedit = require('resedit');
const asar = require('@electron/asar');
const root = path.resolve(__dirname, '..');
const out = path.resolve(root, process.argv[2] || 'release');
const version = require('../package.json').version;
const source = resedit.Data.IconFile.from(fs.readFileSync(path.join(root, 'build/icon.ico')));
const bytes = icon => Buffer.from(icon.isRaw() ? icon.bin : icon.generate());
const expected = source.icons.map(item => bytes(item.data));
assert.equal(expected.length, 9);
for (const file of ['win-unpacked/Modawwan.exe', `Modawwan Setup ${version}.exe`, `Modawwan-Portable-${version}.exe`]) {
  const exe = resedit.NtExecutable.from(fs.readFileSync(path.join(out, file)));
  const resources = resedit.NtExecutableResource.from(exe);
  const groups = resedit.Resource.IconGroupEntry.fromEntries(resources.entries);
  const matches = groups.filter(group => {
    const icons = group.getIconItemsFromEntries(resources.entries).map(bytes);
    return expected.every(frame => icons.some(icon => icon.equals(frame)));
  });
  assert.ok(matches.length, `${file}: custom icon resources missing`);
  console.log(`${file}: all 9 master icon frames match PE resources`);
}
const archive = path.join(out, 'win-unpacked/resources/app.asar');
for (const file of ['build/icon.ico', 'build/icon.png', 'dist/renderer/icon.svg']) {
  const original = file.endsWith('.svg') ? 'build/icon.svg' : file;
  assert.ok(asar.extractFile(archive, file.split('/').join(path.sep)).equals(fs.readFileSync(path.join(root, original))), file);
}
const main = asar.extractFile(archive, path.join('src', 'main', 'main.cjs')).toString();
assert.ok(main.includes("app.setAppUserModelId('com.modawwan.notes')"));
assert.ok(main.includes("icon: path.join(__dirname, '../../build/icon.ico')"));
console.log('Packaged runtime icon assets, window icon path and Windows app identity verified');

