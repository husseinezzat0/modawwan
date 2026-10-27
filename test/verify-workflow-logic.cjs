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

console.log('--- 2. Testing version and tag restriction logic ---');
const pkgVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
function verifyReleaseTarget(mode, version, tagCommit, headCommit) {
  if (mode === 'manual-initial') {
    if (version !== '1.2.0') throw new Error(`manual-initial track restricted to 1.2.0. Version ${version} rejected.`);
  }
  if (!tagCommit) throw new Error(`Release blocked: Git tag v${version} does not exist.`);
  if (tagCommit !== headCommit) throw new Error(`Release blocked: Build commit ${headCommit} does not match tag (${tagCommit}).`);
}

// 1. Valid matching tag and head
assert.doesNotThrow(() => verifyReleaseTarget('manual-initial', '1.2.0', 'c3a47cf', 'c3a47cf'));
// 2. Reject if version != 1.2.0 for manual-initial
assert.throws(() => verifyReleaseTarget('manual-initial', '1.3.0', 'c3a47cf', 'c3a47cf'), /manual-initial track restricted to 1.2.0/);
// 3. Reject if tag does not exist
assert.throws(() => verifyReleaseTarget('manual-initial', '1.2.0', '', 'c3a47cf'), /Git tag v1.2.0 does not exist/);
// 4. Reject if tag commit != head commit
assert.throws(() => verifyReleaseTarget('manual-initial', '1.2.0', 'old_commit', 'c3a47cf'), /does not match tag/);
console.log('✓ Tag and version strict verification logic: PASS');

console.log('--- 3. Testing signed-auto-update manifest gate logic ---');
function verifySignedAutoUpdateGates(builderMajor, updaterMajor, hasCert, hasPublisher, hasKey, manifestHasSignature) {
  if (builderMajor < 27 || updaterMajor < 7) {
    throw new Error(`Signed auto-update track blocked: Signed Update Manifests require builder 27 and updater 7.`);
  }
  if (!hasCert || !hasPublisher || !hasKey) {
    throw new Error(`Signed auto-update track blocked: Certificate and signing key required.`);
  }
  if (!manifestHasSignature) {
    throw new Error(`Update Manifest verification failed: latest.yml missing signature block.`);
  }
}

// When using builder 26, signed-auto-update MUST block
assert.throws(() => verifySignedAutoUpdateGates(26, 6, true, 'Test Publisher', true, false), /require builder 27 and updater 7/);
// When missing manifest signature, it MUST block
assert.throws(() => verifySignedAutoUpdateGates(27, 7, true, 'Test Publisher', true, false), /missing signature block/);
// When all requirements are met, it passes
assert.doesNotThrow(() => verifySignedAutoUpdateGates(27, 7, true, 'Test Publisher', true, true));
console.log('✓ Signed auto-update gates and manifest validation logic: PASS');

console.log('--- ALL WORKFLOW LOGIC CHECKS PASSED! ---');
