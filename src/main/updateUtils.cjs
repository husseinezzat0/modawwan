const compareVersions = (left, right) => {
  const parse = value => {
    const match = String(value).replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
    if (!match) throw new Error('Invalid semantic version');
    return { major: +match[1], minor: +match[2], patch: +match[3], prerelease: match[4] };
  };
  const a = parse(left), b = parse(right);
  for (const key of ['major', 'minor', 'patch']) if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  if (a.prerelease === b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  return a.prerelease.localeCompare(b.prerelease, undefined, { numeric: true });
};
const isStableRelease = release => !!release && release.draft !== true && release.prerelease !== true && !/-/.test(String(release.tag_name || ''));
const releaseNotesText = notes => Array.isArray(notes)
  ? notes.map(note => typeof note === 'string' ? note : note?.note || '').filter(Boolean).join('\n\n')
  : typeof notes === 'string' ? notes : '';
// HTTP errors can contain response headers and cookies; keep only a bounded first line.
const safeUpdateError = error => String(error?.message || error || 'Update failed').split(/\r?\n/, 1)[0].replace(/https?:\/\/\S+/g, '[URL]').slice(0, 300);
const hasTrustedPublisher = config => {
  const value = config?.publisherName;
  const names = Array.isArray(value) ? value : [value];
  return names.some(name => typeof name === 'string' && name.trim().length > 0);
};
module.exports = { compareVersions, isStableRelease, releaseNotesText, safeUpdateError, hasTrustedPublisher };