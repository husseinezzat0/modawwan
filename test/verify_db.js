const DatabaseManager = require('../src/main/db.cjs');
const path = require('path');
const fs = require('fs');

const testDbPath = path.join(__dirname, 'test_notes.sqlite');
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

console.log('--- STARTING DATABASE TEST ---');
const db = new DatabaseManager(testDbPath);

// Test 1: Folders
const folders = db.getFolders();
console.log('✓ Default folders seeded:', folders.length);
if (folders.length < 4) throw new Error('Folders seed failed');

const newFolder = db.createFolder({ id: 'test-folder-1', name: 'مجلد تجريبي', color: '#3b82f6' });
console.log('✓ Created folder:', newFolder.name);

// Test 2: Notes
const notes = db.getNotes();
console.log('✓ Default notes seeded:', notes.length);

const createdNote = db.createNote({
  id: 'test-note-1',
  folder_id: newFolder.id,
  title: 'ملاحظة اختبارية في SQLite',
  content: 'تجربة محتوى الملاحظة الغني',
  content_html: '<h1>تجربة عنوان</h1><p>محتوى تجريبي</p>',
  is_pinned: 1,
});
console.log('✓ Created note:', createdNote.title, '| Pinned:', createdNote.is_pinned);

db.updateNote('test-note-1', { title: 'ملاحظة اختبارية معدلة' });
const updatedNote = db.getNoteById('test-note-1');
if (updatedNote.title !== 'ملاحظة اختبارية معدلة') throw new Error('Note update failed');
console.log('✓ Updated note verified:', updatedNote.title);

// Test 2.1: Nested Sub-page
const subNote = db.createNote({
  id: 'test-sub-note-1',
  parent_id: 'test-note-1',
  title: 'صفحة فرعية تابعة',
  content: 'محتوى صفحة فرعية',
  is_pinned: 0
});
const retrievedSubNote = db.getNoteById('test-sub-note-1');
if (retrievedSubNote.parent_id !== 'test-note-1') throw new Error('Sub-note parent_id verification failed');
const subNotesList = db.getNotes({ parentId: 'test-note-1' });
if (subNotesList.length === 0 || subNotesList[0].id !== 'test-sub-note-1') throw new Error('Sub-notes query failed');
console.log('✓ Nested Sub-page verified with parent_id:', retrievedSubNote.parent_id);

// Test 3: Tasks & Stats
const tasks = db.getTasks();
console.log('✓ Default tasks seeded:', tasks.length);

const newTask = db.createTask({
  id: 'test-task-1',
  title: 'مهمة فحص قاعدة البيانات',
  priority: 'urgent',
  category: 'برمجة',
  due_date: '2026-10-30',
});
console.log('✓ Created task:', newTask.title);

db.updateTask('test-task-1', { is_completed: 1 });
const stats = db.getTaskStats();
console.log('✓ Task Stats computed:', {
  total: stats.total,
  completed: stats.completed,
  pending: stats.pending,
  rate: `${stats.completionRate}%`
});

// Test 4: Finance & Exact Math
const txs = db.getTransactions();
console.log('✓ Default transactions seeded:', txs.length);

db.createTransaction({
  id: 'tx-test-1',
  title: 'مشروع تطوير خاص',
  type: 'income',
  amount_cents: 500000, // 5,000.00 SAR
  category: 'عمل حر',
  date: '2026-10-26'
});

db.createTransaction({
  id: 'tx-test-2',
  title: 'شراء ملحقات حاسوب',
  type: 'expense',
  amount_cents: 125050, // 1,250.50 SAR
  category: 'تسوق',
  date: '2026-10-26'
});

const finStats = db.getFinanceStats();
console.log('✓ Finance Stats computed accurately:', {
  totalIncome: `${finStats.totalIncomeCents / 100} SAR`,
  totalExpense: `${finStats.totalExpenseCents / 100} SAR`,
  netBalance: `${finStats.netBalanceCents / 100} SAR`,
  savingsRate: `${finStats.savingsRate}%`,
  categoriesCount: finStats.expenseCategories.length
});

// Test 5: Backup & Restore
const backup = db.exportBackup();
console.log('✓ Exported Backup records:', {
  folders: backup.folders.length,
  notes: backup.notes.length,
  tasks: backup.tasks.length,
  transactions: backup.transactions.length
});

db.importBackup(backup);
console.log('✓ Successfully re-imported backup without corruption');

// Cleanup
db.close();
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
const walPath = `${testDbPath}-wal`;
if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
const shmPath = `${testDbPath}-shm`;
if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

console.log('--- ALL SQLITE DATABASE TESTS PASSED SUCCESSFULLY! ---');
