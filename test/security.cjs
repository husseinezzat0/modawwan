const test = require('node:test');
const assert = require('node:assert/strict');
const DB = require('../src/main/db.cjs');
const { validateArgs, validateBackup } = require('../src/main/validation.cjs');
const fresh = () => new DB(':memory:');
test('backup preserves nested notes, unordered folders and preferences', () => {
  const db = fresh();
  db.createNote({ id: 'parent', title: 'Parent' });
  db.createNote({ id: 'child', title: 'Child', parent_id: 'parent' });
  db.setSetting('preferences', { editorSize: 20 });
  db.createFolder({ id: 'parent-folder', name: 'Parent' });
  db.createFolder({ id: 'child-folder', name: 'Child', parent_id: 'parent-folder' });
  const backup = db.exportBackup(); backup.folders.reverse();
  db.setSetting('preferences', { editorSize: 14 });
  db.importBackup(backup);
  assert.equal(db.getNoteById('child').parent_id, 'parent');
  assert.equal(db.getFolderById('child-folder').parent_id, 'parent-folder');
  assert.equal(db.getSetting('preferences').editorSize, 20);
  assert.equal(db.db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  db.close();
});
test('invalid imports leave existing data and settings untouched', () => {
  const db = fresh(); const backup = db.exportBackup();
  for (const mutate of [data => { data.tasks = {}; }, data => { data.notes[0].parent_id = 'missing'; }, data => { data.folders[0].parent_id = data.folders[0].id; }, data => { data.notes.push({ ...data.notes[0] }); }, data => { data.settings = [{ key: 'theme', value: '"unsafe"' }]; }]) {
    const invalid = structuredClone(backup); mutate(invalid);
    assert.throws(() => db.importBackup(invalid));
    assert.deepEqual(db.exportBackup().notes, backup.notes);
  }
  // SQL failure after deleting rows must also roll back the entire transaction.
  const bad = structuredClone(backup); bad.notes[0].created_at = undefined;
  assert.throws(() => db.importBackup(bad)); assert.deepEqual(db.exportBackup().notes, backup.notes);
  db.close();
});
test('IPC rejects unexpected fields, invalid enums, amounts and payloads', () => {
  for (const [channel, args] of [
    ['db:updateNote', ['id', { 'title = NULL; DROP TABLE notes; --': 'x' }]],
    ['db:createTask', [{ id: 't', title: 't', priority: 'exploit' }]],
    ['db:createTransaction', [{ id: 'tx', title: 'tx', type: 'income', amount_cents: -5, category: 'x', date: '2026-10-26' }]],
    ['db:getNotes', [{ search: {} }]], ['db:setSetting', ['preferences', { editorSize: 9999 }]], ['db:deleteNote', [{ path: '../' }]],
  ]) assert.throws(() => validateArgs(channel, args), channel);
  validateArgs('db:updateNote', ['id', { title: "' OR 1=1; --" }]);
  assert.throws(() => validateBackup({ version: 999, folders: [], notes: [] }));
});
