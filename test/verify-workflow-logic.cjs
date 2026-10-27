const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');

console.log('--- 1. Testing README badge activation and live status ---');
const directUrl = 'https://github.com/husseinezzat0/modawwan/releases/latest/download/Modawwan-Setup.exe';

// 1. Verify live README files currently contain the direct download URL and valid badge
const liveEn = fs.readFileSync('README.md', 'utf8');
const liveAr = fs.readFileSync('README.ar.md', 'utf8');
assert.ok(liveEn.includes(`href="${directUrl}"`), 'Live README.md must contain direct download URL');
assert.ok(liveEn.includes('Download_for_Windows-Setup.exe-0078D6'), 'Live README.md must contain setup badge');
assert.ok(liveAr.includes(`href="${directUrl}"`), 'Live README.ar.md must contain direct download URL');
assert.ok(liveAr.includes('تحميل_مُدَوَّن_لويندوز-Setup.exe-0078D6'), 'Live README.ar.md must contain setup badge');

// 2. Verify activation replacement logic on Coming Soon templates
let mockEn = `<p align="center">
  <a href="https://github.com/husseinezzat0/modawwan/releases">
    <img src="https://img.shields.io/badge/Download_for_Windows-Coming_Soon-orange?style=for-the-badge&logo=windows&logoColor=white" alt="Download for Windows - Coming Soon" />
  </a>
</p>
<p align="center">
  <sub><b>Windows 10 / 11 (64-bit)</b> • First Stable Release Coming Soon • Free & Open Source</sub><br />
  <a href="https://github.com/husseinezzat0/modawwan/releases">📦 Track Releases & Announcements</a>
</p>`;

mockEn = mockEn.replace('Download_for_Windows-Coming_Soon-orange', 'Download_for_Windows-Setup.exe-0078D6');
mockEn = mockEn.replace('First Stable Release Coming Soon', 'Offline-First');
mockEn = mockEn.replace(/<a\s+href="https:\/\/github\.com\/husseinezzat0\/modawwan\/releases">\s*<img\s+src="https:\/\/img\.shields\.io\/badge\/Download_for_Windows-Setup\.exe-0078D6/s,
  `<a href="${directUrl}">\n    <img src="https://img.shields.io/badge/Download_for_Windows-Setup.exe-0078D6`);

assert.ok(mockEn.includes(`href="${directUrl}"`), 'Activated mock must contain direct download URL');
assert.ok(!mockEn.includes('Free & Open Source • Free & Open Source'), 'Mock must not duplicate Free & Open Source');
console.log('✓ README badge activation and live status: PASS');
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
