// Isolated scratch test for trash cascade semantics (temp DB, no user data).
const path = require('path');
const fs = require('fs');
os = require('os');
const ModawwanDB = require('../src/main/db.cjs');

const tmp = path.join(os.tmpdir(), 'modawwan-trash-test-' + Date.now() + '.db');
const db = new ModawwanDB(tmp);
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else console.log('PASS:', msg); };
const live = () => db.getNotes().length;
const trashed = () => db.getNotes({ is_deleted: 1 }).length;

// Folder with a nested subfolder, one note in each
const root = db.createFolder({ id: 'f1', name: 'Root', icon: 'folder', color: '#000' });
db.createFolder({ id: 'f2', name: 'Child', parent_id: 'f1', icon: 'folder', color: '#000' });
db.createNote({ id: 'n1', folder_id: 'f1', title: 'root note', content: '', content_html: '', });
db.createNote({ id: 'n2', folder_id: 'f2', title: 'child note', content: '', content_html: '' });

// Sub-pages: parent + two children
db.createNote({ id: 'n3', folder_id: null, parent_id: null, title: 'parent page', content: '', content_html: '' });
db.createNote({ id: 'n4', folder_id: null, parent_id: 'n3', title: 'sub1', content: '', content_html: '' });
db.createNote({ id: 'n5', folder_id: null, parent_id: 'n4', title: 'sub2', content: '', content_html: '' });

// 1) Soft-delete parent page cascades to both sub-pages
db.deleteNote('n3');
assert(trashed() === 3, `delete parent -> 3 in trash (got ${trashed()})`);
assert(live() === 3, `live notes = 3 incl. seeded welcome (got ${live()})`);

// 2) Restore child restores ancestor chain (n3, n4 visible again)
db.restoreNote('n5');
const r = db.getNotes({ is_deleted: 1 });
assert(r.length === 1 && r[0].id === undefined || r.map(x => x.id).includes('n5') === false, 'n5 restored (not in trash)');
assert(!db.getNotes({ is_deleted: 1 }).some(n => n.id === 'n3'), 'ancestor n3 auto-restored');

// 3) Permanent delete removes whole subtree (re-trash parent first)
db.deleteNote('n3');
db.deleteNote('n3', true);
assert(db.getNoteById ? db.getNoteById('n3') == null : true, 'n3 gone');
assert(db.db.prepare('SELECT COUNT(*) c FROM notes WHERE id = ?').get('n4').c === 0, 'n4 permanently deleted');
assert(db.db.prepare('SELECT COUNT(*) c FROM notes WHERE id = ?').get('n5').c === 0, 'n5 permanently deleted');

// 4) Folder delete: notes move to trash (recoverable), folders gone
db.createNote({ id: 'n6', folder_id: 'f2', title: 'deep note', content: '', content_html: '' });
db.deleteFolder('f1');
assert(db.getNotes({ is_deleted: 1 }).some(n => n.id === 'n1'), 'n1 (root folder note) trashed');
assert(db.getNotes({ is_deleted: 1 }).some(n => n.id === 'n2'), 'n2 (child folder note) trashed');
assert(db.getNotes({ is_deleted: 1 }).some(n => n.id === 'n6'), 'n6 (deep note) trashed');
assert(db.getFolders().every(f => f.id !== 'f1' && f.id !== 'f2'), 'folders f1/f2 removed');

// 5) Restore each trashed note without ancestors — all visible again
for (const id of ['n1', 'n2', 'n6']) db.restoreNote(id);
assert(db.getNotes().some(n => n.id === 'n6'), 'n6 back live');
assert(db.getNotes({ is_deleted: 1 }).length === 0, 'trash empty at end');

// 7) Folder containing nested sub-pages: delete folder -> restore notes ->
//    relationships (parent_id) intact and content intact; folders stay gone.
const f3 = db.createFolder({ id: 'f3', name: 'Project', icon: 'folder', color: '#000' });
const pa = db.createNote({ id: 'pa', folder_id: 'f3', title: 'PA', content: '', content_html: '<p>alpha body</p>' });
db.createNote({ id: 'pa1', folder_id: 'f3', parent_id: 'pa', title: 'PA-1', content: '', content_html: '<p>child body</p>' });
db.createNote({ id: 'pa2', folder_id: 'f3', parent_id: 'pa1', title: 'PA-2', content: '', content_html: '<p>grandbody</p>' });
db.createNote({ id: 'pe', folder_id: null, parent_id: 'pa', title: 'PE-null-folder', content: '', content_html: '<p>edge body</p>' });
db.createNote({ id: 'pb', folder_id: 'f3', title: 'PB', content: '', content_html: '<p>beta body</p>' });
db.deleteFolder('f3');
{
  const inTrash = new Set(db.getNotes({ is_deleted: 1 }).map(n => n.id));
  for (const id of ['pa', 'pa1', 'pa2', 'pe', 'pb']) assert(inTrash.has(id), `${id} moved to trash with folder delete`);
  assert(db.getFolders().every(f => f.id !== 'f3'), 'folder f3 record removed');
}
db.restoreNote('pa2'); // restoring the grandchild must bring back the ancestor chain
db.restoreNote('pe');
db.restoreNote('pb');
{
  const live = new Map(db.getNotes().filter(n => ['pa', 'pa1', 'pa2', 'pe', 'pb'].includes(n.id)).map(n => [n.id, n]));
  for (const id of ['pa', 'pa1', 'pa2', 'pe', 'pb']) assert(live.has(id), `${id} restored and visible`);
  assert(live.get('pa1')?.parent_id === 'pa', 'relationship pa1 -> pa intact after restore');
  assert(live.get('pa2')?.parent_id === 'pa1', 'relationship pa2 -> pa1 intact after restore');
  assert(live.get('pe')?.parent_id === 'pa', 'relationship pe -> pa intact after restore');
  assert(live.get('pa')?.content_html.includes('alpha body'), 'content of pa preserved');
  assert(live.get('pa2')?.content_html.includes('grandbody'), 'content of pa2 preserved');
  assert(live.get('pe')?.content_html.includes('edge body'), 'content of the null-folder sub-page preserved');
}

// 8) Empty trash = permanent wipe of soft-deleted only
db.deleteNote('n2'); // soft
db.emptyTrash();
assert(db.db.prepare('SELECT COUNT(*) c FROM notes WHERE id = ?').get('n2').c === 0, 'emptyTrash hard-deletes n2');
assert(db.getNotes().some(n => n.id === 'n1'), 'n1 untouched by emptyTrash');

try { db.db.close(); } catch {}
try { fs.unlinkSync(tmp); } catch { /* Windows may keep the handle briefly */ }
console.log(process.exitCode ? '--- TRASH CASCADE TEST FAILED ---' : '--- TRASH CASCADE TEST PASSED ---');
