const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const SRC = path.join(__dirname, '..', 'src');
const CONTENT_TEMPLATE_FILES = new Set(['components/notes/NotionBlocks.ts', 'db/apiClient.ts']);
const CONTENT_TEMPLATE_PATTERNS = [{ file: 'components/notes/SlashMenu.tsx', needle: 'html: `<div style="background:var(--color-primary-light)' }];
const INLINE_SVG_ALLOWED = new Set(['components/common/AppIcon.tsx', 'components/common/SvgBarChart.tsx', 'components/common/SvgDonutChart.tsx']);
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, out); else if (/\.(ts|tsx|css|cjs)$/.test(entry.name)) out.push(file);
  }
  return out;
}
const rel = file => path.relative(SRC, file).split(path.sep).join('/');
const files = walk(SRC);
const forbidden = [/from\s+['"]lucide/i, /from\s+['"]@fortawesome/i, /from\s+['"]react-icons/i, /from\s+['"]@heroicons/i, /from\s+['"]@mui\/icons/i, /from\s+['"]@material/i, /@platformscode\/icons/i];
const hits = files.flatMap(file => forbidden.filter(pattern => pattern.test(fs.readFileSync(file, 'utf8'))).map(pattern => `${rel(file)} -> ${pattern}`));
assert.deepEqual(hits, [], `Unexpected icon library: ${hits.join(', ')}`);
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const emojiHits = [];
for (const file of files.filter(file => /\.(ts|tsx)$/.test(file))) {
  const relative = rel(file); if (CONTENT_TEMPLATE_FILES.has(relative)) continue;
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
    if (EMOJI_RE.test(line) && !CONTENT_TEMPLATE_PATTERNS.some(item => item.file === relative && line.includes(item.needle))) emojiHits.push(`${relative}:${index + 1}`);
  });
}
assert.deepEqual(emojiHits, [], `Emoji used as UI icon: ${emojiHits.join(', ')}`);
const svgHits = [];
for (const file of files.filter(file => /\.(ts|tsx)$/.test(file))) {
  const count = (fs.readFileSync(file, 'utf8').match(/<svg[\s>]/g) || []).length;
  if (count && !INLINE_SVG_ALLOWED.has(rel(file))) svgHits.push(rel(file));
}
assert.deepEqual(svgHits, [], `Raw SVG outside approved components: ${svgHits.join(', ')}`);
const mapText = fs.readFileSync(path.join(SRC, 'components/common/iconsMap.ts'), 'utf8');
const nameList = mapText.match(/export const iconNames = \[([\s\S]*?)\] as const/);
assert.ok(nameList && mapText.includes("from '@phosphor-icons/react'"), 'Phosphor icon map missing');
const iconSet = new Set([...nameList[1].matchAll(/'([^']+)'/g)].map(match => match[1]));
const missing = [];
for (const file of files.filter(file => file.endsWith('.tsx'))) {
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/name=["']([A-Za-z0-9_]+)["']/g)) if (!iconSet.has(match[1])) missing.push(`${rel(file)} -> ${match[1]}`);
}
assert.deepEqual(missing, [], `Missing icons: ${missing.join(', ')}`);
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
assert.ok(!pkg.dependencies['@platformscode/icons'], 'DGA icon dependency must not be shipped without redistribution terms');
console.log(`✓ Icon governance OK — ${iconSet.size} Phosphor icons; no DGA icon dependency.`);