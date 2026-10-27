const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');

console.log('--- 1. Testing README badge activation logic ---');
const directUrl = 'https://github.com/husseinezzat0/modawwan/releases/latest/download/Modawwan-Setup.exe';

let en = fs.readFileSync('README.md', 'utf8');
assert.ok(en.includes('Download_for_Windows-Coming_Soon-orange'), 'README.md must have Coming Soon badge');

// Perform the exact replacement
en = en.replace('Download_for_Windows-Coming_Soon-orange', 'Download_for_Windows-Setup.exe-0078D6');
en = en.replace('First Stable Release Coming Soon', 'Offline-First');
en = en.replace(/<a\s+href="https:\/\/github\.com\/husseinezzat0\/modawwan\/releases">\s*<img\s+src="https:\/\/img\.shields\.io\/badge\/Download_for_Windows-Setup\.exe-0078D6/s,
  `<a href="${directUrl}">\n    <img src="https://img.shields.io/badge/Download_for_Windows-Setup.exe-0078D6`);

assert.ok(en.includes(`href="${directUrl}"`), 'README.md must contain direct download URL');
assert.ok(en.includes('Download_for_Windows-Setup.exe-0078D6'), 'README.md must contain setup badge');
assert.ok(!en.includes('Free & Open Source • Free & Open Source'), 'README.md must not duplicate Free & Open Source');
// Check count of 'Free & Open Source' in that specific sub block
const subMatches = en.match(/Windows 10 \/ 11 \(64-bit\)<\/b>.*<\/sub>/);
assert.ok(subMatches, 'Must find sub block');
const freeCount = (subMatches[0].match(/Free & Open Source/g) || []).length;
assert.equal(freeCount, 1, 'Free & Open Source must appear exactly once in sub block');
console.log('✓ README.md activation logic: PASS (no duplication)');

let ar = fs.readFileSync('README.ar.md', 'utf8');
assert.ok(ar.includes('تحميل_مُدَوَّن_لويندوز-متاح_قريبًا-orange'), 'README.ar.md must have Coming Soon badge');

ar = ar.replace('تحميل_مُدَوَّن_لويندوز-متاح_قريبًا-orange', 'تحميل_مُدَوَّن_لويندوز-Setup.exe-0078D6');
ar = ar.replace('أول إصدار مستقر قادم قريبًا', 'يعمل بدون إنترنت');
ar = ar.replace(/<a\s+href="https:\/\/github\.com\/husseinezzat0\/modawwan\/releases">\s*<img\s+src="https:\/\/img\.shields\.io\/badge\/تحميل_مُدَوَّن_لويندوز-Setup\.exe-0078D6/s,
  `<a href="${directUrl}">\n    <img src="https://img.shields.io/badge/تحميل_مُدَوَّن_لويندوز-Setup.exe-0078D6`);

assert.ok(ar.includes(`href="${directUrl}"`), 'README.ar.md must contain direct download URL');
assert.ok(ar.includes('تحميل_مُدَوَّن_لويندوز-Setup.exe-0078D6'), 'README.ar.md must contain setup badge');
const arSubMatches = ar.match(/يدعم ويندوز 10 و 11 \(64-بت\)<\/b>.*<\/sub>/);
assert.ok(arSubMatches, 'Must find Arabic sub block');
const arFreeCount = (arSubMatches[0].match(/مجاني ومفتوح المصدر/g) || []).length;
assert.equal(arFreeCount, 1, 'مجاني ومفتوح المصدر must appear exactly once in sub block');
console.log('✓ README.ar.md activation logic: PASS (no duplication)');

console.log('--- 2. Testing version restriction for manual-initial ---');
const pkgVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
function checkManualMode(mode, version) {
  if (mode === 'manual-initial') {
    if (version !== '1.2.0') throw new Error(`manual-initial track restricted to 1.2.0. Version ${version} rejected.`);
  }
}
assert.doesNotThrow(() => checkManualMode('manual-initial', pkgVersion), '1.2.0 should be accepted for manual-initial');
assert.throws(() => checkManualMode('manual-initial', '1.3.0'), /manual-initial track restricted to 1.2.0/);
console.log('✓ Version restriction logic: PASS');

console.log('--- ALL WORKFLOW LOGIC CHECKS PASSED! ---');
