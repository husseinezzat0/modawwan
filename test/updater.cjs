const test = require('node:test');
const assert = require('node:assert/strict');
const { compareVersions, isStableRelease, releaseNotesText, safeUpdateError, hasTrustedPublisher } = require('../src/main/updateUtils.cjs');

test('compares stable semantic versions and optional v prefix', () => {
  assert.equal(compareVersions('v1.2.0', '1.1.9'), 1);
  assert.equal(compareVersions('1.2.0', 'v1.2.0'), 0);
  assert.equal(compareVersions('1.1.9', '1.2.0'), -1);
});

test('stable release filter rejects drafts and prereleases including rc tags', () => {
  assert.equal(isStableRelease({ draft: false, prerelease: false, tag_name: 'v1.2.0' }), true);
  assert.equal(isStableRelease({ draft: true, prerelease: false, tag_name: 'v1.2.0' }), false);
  assert.equal(isStableRelease({ draft: false, prerelease: true, tag_name: 'v1.2.0-rc.1' }), false);
  assert.equal(isStableRelease({ draft: false, prerelease: false, tag_name: 'v1.2.0-rc.1' }), false);
});

test('normalizes release note payloads without interpreting markup', () => {
  assert.equal(releaseNotesText([{ note: 'First' }, { note: 'Second' }]), 'First\n\nSecond');
  assert.equal(releaseNotesText('<script>text</script>'), '<script>text</script>');
  assert.equal(releaseNotesText(undefined), '');
});
test('update errors do not reveal response headers or URL query data', () => {
  assert.equal(safeUpdateError(new Error('Request failed at https://example.test/path?key=secret\nSet-Cookie: private')), 'Request failed at [URL]');
});

test('update installation requires an explicit trusted publisher', () => {
  assert.equal(hasTrustedPublisher({}), false);
  assert.equal(hasTrustedPublisher({ publisherName: [] }), false);
  assert.equal(hasTrustedPublisher({ publisherName: ['  '] }), false);
  assert.equal(hasTrustedPublisher({ publisherName: ['Publisher'] }), true);
});
