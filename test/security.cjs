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

test('corrupted files and failed restore leave data completely intact with zero data loss', () => {
  const db = fresh();
  db.createFolder({ id: 'f-custom-test', name: 'Work Folder' });
  db.createNote({ id: 'n-critical', folder_id: 'f-custom-test', title: 'Critical Note', content: 'Vital content' });
  db.createTask({ id: 't-critical', title: 'Critical Task', priority: 'urgent' });
  db.createTransaction({ id: 'tx-critical', title: 'Salary', type: 'income', amount_cents: 1000000, category: 'work', date: '2026-10-28' });
  db.setSetting('theme', 'dark');

  const baseline = db.exportBackup();
  const dataOnly = b => ({ folders: b.folders, notes: b.notes, tasks: b.tasks, transactions: b.transactions, settings: b.settings });
  const verifyUntouched = () => {
    assert.deepEqual(dataOnly(db.exportBackup()), dataOnly(baseline), 'Database tables and settings must remain 100% identical to baseline');
    assert.equal(db.db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok', 'SQLite integrity check must pass');
  };

  // 1. Corrupted / unparseable JSON file contents
  const corruptedStrings = [
    '{ broken json [',
    '{"version": 1, "folders": [',
    '\0\0\0BINARY_GARBAGE\x01\x02',
    '',
    '   ',
    'null'
  ];
  for (const raw of corruptedStrings) {
    assert.throws(() => {
      const parsed = JSON.parse(raw);
      validateBackup(parsed);
      db.importBackup(parsed);
    }, 'Corrupted JSON string must fail before mutating database');
    verifyUntouched();
  }

  // 2. Oversized payload (>32MB total string volume)
  const hugeChunk = 'x'.repeat(2000000);
  const oversized = structuredClone(baseline);
  for (let i = 0; i < 17; i++) {
    oversized.notes.push({
      id: 'n-huge-' + i,
      folder_id: 'f-custom-test',
      parent_id: null,
      title: 'Huge ' + i,
      content: hugeChunk,
      content_html: hugeChunk,
      is_pinned: 0,
      is_favorite: 0,
      is_deleted: 0,
      deleted_at: null,
      created_at: '2026-10-28T00:00:00.000Z',
      updated_at: '2026-10-28T00:00:00.000Z'
    });
  }
  assert.throws(() => validateBackup(oversized), /Invalid input/, 'Backup exceeding 32MB must be rejected');
  verifyUntouched();

  // Unicode multi-byte check (character length < 32M, but UTF-8 bytes > 32MB)
  const unicodeOversized = structuredClone(baseline);
  const arabicChunk = 'م'.repeat(1000000); // 1M chars = 2MB UTF-8
  for (let i = 0; i < 17; i++) {
    unicodeOversized.notes.push({
      id: 'n-uni-' + i,
      folder_id: 'f-custom-test',
      parent_id: null,
      title: 'Uni ' + i,
      content: arabicChunk,
      content_html: '',
      is_pinned: 0,
      is_favorite: 0,
      is_deleted: 0,
      deleted_at: null,
      created_at: '2026-10-28T00:00:00.000Z',
      updated_at: '2026-10-28T00:00:00.000Z'
    });
  }
  assert.throws(() => validateBackup(unicodeOversized), /Invalid input/, 'Unicode backup exceeding 32MB in UTF-8 bytes must be rejected');
  verifyUntouched();

  // 3. Cyclic folder hierarchy (f1 -> f2 -> f3 -> f1)
  const cyclic = structuredClone(baseline);
  cyclic.folders = [
    { id: 'f1', name: 'F1', parent_id: 'f3', sort_order: 0, created_at: '2026-10-28', updated_at: '2026-10-28' },
    { id: 'f2', name: 'F2', parent_id: 'f1', sort_order: 0, created_at: '2026-10-28', updated_at: '2026-10-28' },
    { id: 'f3', name: 'F3', parent_id: 'f2', sort_order: 0, created_at: '2026-10-28', updated_at: '2026-10-28' }
  ];
  assert.throws(() => validateBackup(cyclic), /Invalid input/, 'Cyclic folder hierarchy must be rejected');
  verifyUntouched();

  // 4. Note referencing non-existent folder
  const badFolderRef = structuredClone(baseline);
  badFolderRef.notes[0].folder_id = 'ghost-folder-404';
  assert.throws(() => validateBackup(badFolderRef), /Invalid input/, 'Orphaned note folder reference must be rejected');
  verifyUntouched();

  // 5. Whitespace-only ID
  const blankId = structuredClone(baseline);
  blankId.notes[0].id = '   ';
  assert.throws(() => validateBackup(blankId), /Invalid input/, 'Blank ID must be rejected');
  verifyUntouched();

  // 6. SQL constraint failure mid-transaction triggers clean rollback
  const sqlErrorData = structuredClone(baseline);
  sqlErrorData.transactions[0].amount_cents = null; // NOT NULL constraint violation in SQLite
  assert.throws(() => db.importBackup(sqlErrorData), 'SQL constraint failure must abort import');
  verifyUntouched();

  // 7. Recovery snapshot file is valid and can be re-imported on failure
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const snapFile = path.join(os.tmpdir(), `test-recovery-snap-${Date.now()}.json`);
  try {
    fs.writeFileSync(snapFile, JSON.stringify(db.exportBackup()), 'utf-8');
    const rawContent = fs.readFileSync(snapFile, 'utf-8');
    const parsedSnapshot = JSON.parse(rawContent);
    const validatedData = validateBackup(parsedSnapshot);
    assert.ok(validatedData, 'Recovery snapshot file must pass validation');

    // Simulate accidental database change
    db.createNote({ id: 'n-scratch', folder_id: 'f-custom-test', title: 'Scratch Note' });
    assert.ok(db.getNoteById('n-scratch'));

    // Restore from snapshot
    db.importBackup(validatedData);
    assert.equal(db.getNoteById('n-scratch'), undefined, 'Database must be restored to baseline state');
    verifyUntouched();
  } finally {
    if (fs.existsSync(snapFile)) fs.unlinkSync(snapFile);
  }

  db.close();
});
