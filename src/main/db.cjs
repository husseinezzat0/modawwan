const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const { validateBackup } = require('./validation.cjs');

class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.init();
  }

  init() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        icon TEXT DEFAULT 'folder',
        color TEXT DEFAULT '#f59e0b',
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(parent_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        folder_id TEXT,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        content_html TEXT DEFAULT '',
        is_pinned INTEGER DEFAULT 0,
        is_favorite INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        priority TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'عام',
        due_date TEXT,
        status TEXT DEFAULT 'todo',
        is_completed INTEGER DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    if (!this.db.prepare('PRAGMA table_info(notes)').all().some(column => column.name === 'parent_id')) {
      this.db.exec('ALTER TABLE notes ADD COLUMN parent_id TEXT');
    }

    this.seedDefaultsIfEmpty();
  }

  seedDefaultsIfEmpty() {
    const folderCount = this.db.prepare('SELECT COUNT(*) as count FROM folders').get().count;
    if (folderCount === 0) {
      const now = new Date().toISOString();
      const defaultFolders = [
        { id: 'f-quick', name: 'ملاحظات سريعة', parent_id: null, icon: 'zap', color: '#f59e0b', sort_order: 1 },
        { id: 'f-work', name: 'العمل والمشاريع', parent_id: null, icon: 'briefcase', color: '#3b82f6', sort_order: 2 },
        { id: 'f-personal', name: 'الحياة الشخصية', parent_id: null, icon: 'user', color: '#10b981', sort_order: 3 },
        { id: 'f-ideas', name: 'أفكار ملهمة', parent_id: null, icon: 'lightbulb', color: '#8b5cf6', sort_order: 4 },
      ];

      for (const f of defaultFolders) {
        this.db.prepare(`
          INSERT INTO folders (id, name, parent_id, icon, color, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(f.id, f.name, f.parent_id, f.icon, f.color, f.sort_order, now, now);
      }

      // Initial welcome note
      const welcomeContent = `# مرحباً بك في مُدَوَّن 🌟
تطبيق الإنتاجية وإدارة الملاحظات والمهام والمالية لسطح المكتب بنظام Windows.

## المميزات الرئيسية:
- **إدارة الملاحظات:** كتابة غنية، مجلدات، بحث فوري، تثبيت، ومفضلة.
- **إدارة المهام:** متابعة أولوياتك، تواريخ الاستحقاق، وإحصائيات الإنجاز التفاعلية.
- **الإدارة المالية:** تتبع الدخل والمصروفات بدقة، وحساب الرصيد، ومخططات بيانية تفاعلية.
- **حفظ تلقائي فوري:** جميع بياناتك مخزنة محلياً في قاعدة بيانات SQLite آمنة على جهازك.

### نصائح سريعة:
1. استخدم اختصار \`Ctrl + N\` لإنشاء ملاحظة جديدة في أي وقت.
2. استخدم \`Ctrl + F\` للبحث الفوري عن أي ملاحظة أو معاملة.
3. بدّل بين الوضع الليلي والنهاري حسب تفضيلك.`;

      const welcomeHtml = `<h1>مرحباً بك في مُدَوَّن 🌟</h1>
<p>تطبيق الإنتاجية وإدارة الملاحظات والمهام والمالية لسطح المكتب بنظام Windows.</p>
<h2>المميزات الرئيسية:</h2>
<ul>
  <li><strong>إدارة الملاحظات:</strong> كتابة غنية، مجلدات، بحث فوري، تثبيت، ومفضلة.</li>
  <li><strong>إدارة المهام:</strong> متابعة أولوياتك، تواريخ الاستحقاق، وإحصائيات الإنجاز التفاعلية.</li>
  <li><strong>الإدارة المالية:</strong> تتبع الدخل والمصروفات بدقة، وحساب الرصيد، ومخططات بيانية تفاعلية.</li>
  <li><strong>حفظ تلقائي فوري:</strong> جميع بياناتك مخزنة محلياً في قاعدة بيانات SQLite آمنة على جهازك.</li>
</ul>
<h3>نصائح سريعة:</h3>
<ol>
  <li>استخدم اختصار <code>Ctrl + N</code> لإنشاء ملاحظة جديدة في أي وقت.</li>
  <li>استخدم <code>Ctrl + F</code> للبحث الفوري عن أي ملاحظة أو معاملة.</li>
  <li>بدّل بين الوضع الليلي والنهاري حسب تفضيلك.</li>
</ol>`;

      this.db.prepare(`
        INSERT INTO notes (id, folder_id, title, content, content_html, is_pinned, is_favorite, is_deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, 1, 0, ?, ?)
      `).run('n-welcome', 'f-quick', 'مرحباً بك في مُدَوَّن 🌟', welcomeContent, welcomeHtml, now, now);

      // Initial sample tasks
      const sampleTasks = [
        { id: 't-1', title: 'استكشاف مميزات تطبيق مُدَوَّن', description: 'تجربة إنشاء ملاحظة، مهمة، ومعاملة مالية جديدة', priority: 'high', category: 'شخصي', due_date: now.split('T')[0], status: 'todo' },
        { id: 't-2', title: 'تنظيم قائمة المهام الأسبوعية', description: 'تحديد الأولويات للمهام العاجلة والمهمة', priority: 'urgent', category: 'عمل', due_date: now.split('T')[0], status: 'in_progress' },
        { id: 't-3', title: 'مراجعة الميزانية الشهرية', description: 'تسجيل المصروفات والتأكد من خطة الادخار', priority: 'medium', category: 'مالية', due_date: now.split('T')[0], status: 'done', is_completed: 1, completed_at: now },
      ];

      for (const t of sampleTasks) {
        this.db.prepare(`
          INSERT INTO tasks (id, title, description, priority, category, due_date, status, is_completed, completed_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(t.id, t.title, t.description, t.priority, t.category, t.due_date, t.status, t.is_completed || 0, t.completed_at || null, now, now);
      }

      // Initial sample financial transactions
      const sampleTransactions = [
        { id: 'tx-1', title: 'راتب الشهر الحالي', type: 'income', amount_cents: 1250000, category: 'راتب', date: now.split('T')[0], notes: 'تحويل الحساب البنكي' },
        { id: 'tx-2', title: 'إيجار السكن', type: 'expense', amount_cents: 300000, category: 'سكن', date: now.split('T')[0], notes: 'دفعة شهرية' },
        { id: 'tx-3', title: 'فاتورة الكهرباء والإنترنت', type: 'expense', amount_cents: 45000, category: 'فواتير', date: now.split('T')[0], notes: 'سداد فوري' },
        { id: 'tx-4', title: 'مشروع عمل حر برمجي', type: 'income', amount_cents: 220000, category: 'عمل حر', date: now.split('T')[0], notes: 'دفعة إنجاز مرحلة أولى' },
        { id: 'tx-5', title: 'مشتريات البقالة الأسبوعية', type: 'expense', amount_cents: 38000, category: 'طعام', date: now.split('T')[0], notes: 'تموين المنزل' },
      ];

      for (const tx of sampleTransactions) {
        this.db.prepare(`
          INSERT INTO transactions (id, title, type, amount_cents, category, date, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(tx.id, tx.title, tx.type, tx.amount_cents, tx.category, tx.date, tx.notes, now, now);
      }
    }
  }

  // Folders operations
  getFolders() {
    return this.db.prepare('SELECT * FROM folders ORDER BY sort_order ASC, name ASC').all();
  }

  createFolder(folder) {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO folders (id, name, parent_id, icon, color, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      folder.id,
      folder.name,
      folder.parent_id || null,
      folder.icon || 'folder',
      folder.color || '#f59e0b',
      folder.sort_order || 0,
      now,
      now
    );
    return this.getFolderById(folder.id);
  }

  updateFolder(id, updates) {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    for (const [key, val] of Object.entries(updates)) {
      if (['name', 'parent_id', 'icon', 'color', 'sort_order'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (fields.length === 0) return this.getFolderById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE folders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getFolderById(id);
  }

  // Collect a folder id plus every descendant folder id (folders tree cascade).
  folderSubtree(id) {
    const rows = this.db.prepare('SELECT id, parent_id FROM folders').all();
    const children = new Map();
    for (const row of rows) {
      if (row.parent_id) {
        if (!children.has(row.parent_id)) children.set(row.parent_id, []);
        children.get(row.parent_id).push(row.id);
      }
    }
    const subtree = [id];
    const visit = parentId => {
      for (const child of children.get(parentId) ?? []) {
        subtree.push(child);
        visit(child);
      }
    };
    visit(id);
    return subtree;
  }

  deleteFolder(id) {
    // Safe-by-default trash rule: every LIVE note inside the folder subtree moves
    // to the trash (recoverable), then the folder records themselves are removed.
    // Folders are containers, not restorable items; their notes always are.
    const subtree = this.folderSubtree(id);
    const placeholders = subtree.map(() => '?').join(', ');
    const now = new Date().toISOString();
    // Start from live notes in the folder subtree, then extend transitively along
    // parent chains so sub-pages whose folder_id is unset or stale are never
    // orphaned with a live row while their ancestors are trashed.
    const live = this.db.prepare('SELECT id, parent_id, folder_id FROM notes WHERE is_deleted = 0').all();
    const folderSet = new Set(subtree);
    const hit = new Set(live.filter(n => n.folder_id && folderSet.has(n.folder_id)).map(n => n.id));
    let grew = true;
    while (grew) {
      grew = false;
      for (const row of live) {
        if (!hit.has(row.id) && row.parent_id && hit.has(row.parent_id)) { hit.add(row.id); grew = true; }
      }
    }
    if (hit.size > 0) {
      const ids = Array.from(hit);
      const notePh = ids.map(() => '?').join(', ');
      this.db.prepare(`UPDATE notes SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id IN (${notePh}) AND is_deleted = 0`).run(now, now, ...ids);
    }
    return this.db.prepare(`DELETE FROM folders WHERE id IN (${placeholders})`).run(...subtree);
  }

  getFolderById(id) {
    return this.db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
  }

  // Notes operations
  getNotes({ folder_id, parent_id, parentId, is_deleted = 0, is_favorite, is_pinned, search } = {}) {
    let sql = 'SELECT * FROM notes WHERE is_deleted = ?';
    const params = [is_deleted ? 1 : 0];

    const targetParent = parent_id !== undefined ? parent_id : parentId;
    if (targetParent !== undefined && !is_deleted) {
      if (targetParent === null) {
        sql += ' AND parent_id IS NULL';
      } else {
        sql += ' AND parent_id = ?';
        params.push(targetParent);
      }
    }

    if (folder_id !== undefined && !is_deleted) {
      if (folder_id === null) {
        sql += ' AND folder_id IS NULL';
      } else {
        sql += ' AND folder_id = ?';
        params.push(folder_id);
      }
    }

    if (is_favorite !== undefined && !is_deleted) {
      sql += ' AND is_favorite = ?';
      params.push(is_favorite ? 1 : 0);
    }

    if (is_pinned !== undefined && !is_deleted) {
      sql += ' AND is_pinned = ?';
      params.push(is_pinned ? 1 : 0);
    }

    if (search && search.trim()) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY is_pinned DESC, updated_at DESC';
    return this.db.prepare(sql).all(...params);
  }

  getNoteById(id) {
    return this.db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  }

  createNote(note) {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO notes (id, folder_id, parent_id, title, content, content_html, is_pinned, is_favorite, is_deleted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      note.id,
      note.folder_id || null,
      note.parent_id || null,
      note.title || 'ملاحظة جديدة',
      note.content || '',
      note.content_html || '',
      note.is_pinned ? 1 : 0,
      note.is_favorite ? 1 : 0,
      now,
      now
    );
    return this.getNoteById(note.id);
  }

  updateNote(id, updates) {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    for (const [key, val] of Object.entries(updates)) {
      if (['folder_id', 'parent_id', 'title', 'content', 'content_html', 'is_pinned', 'is_favorite', 'is_deleted', 'deleted_at'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (fields.length === 0) return this.getNoteById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getNoteById(id);
  }

  // Collect a note id plus every descendant id following the parent_id chain
  // (deleting or permanently removing a parent must never orphan sub-pages).
  noteSubtree(id) {
    const rows = this.db.prepare('SELECT id, parent_id FROM notes').all();
    const children = new Map();
    for (const row of rows) {
      if (row.parent_id) {
        if (!children.has(row.parent_id)) children.set(row.parent_id, []);
        children.get(row.parent_id).push(row.id);
      }
    }
    const subtree = [id];
    const visit = parentId => {
      for (const child of children.get(parentId) ?? []) {
        subtree.push(child);
        visit(child);
      }
    };
    visit(id);
    return subtree;
  }

  deleteNote(id, permanent = false) {
    const subtree = this.noteSubtree(id);
    const placeholders = subtree.map(() => '?').join(', ');
    const now = new Date().toISOString();
    if (permanent) {
      // Hard delete the note and every trashed descendant page.
      return this.db.prepare(`DELETE FROM notes WHERE id IN (${placeholders})`).run(...subtree);
    }
    // Soft-delete cascade: the parent note and all its live sub-pages move to trash.
    return this.db.prepare(`UPDATE notes SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id IN (${placeholders}) AND is_deleted = 0`).run(now, now, ...subtree);
  }

  restoreNote(id) {
    // Restore the requested note; when an ancestor page is still trashed, restore
    // the ancestor chain as well so the note is visible rather than orphaned.
    const row = this.db.prepare('SELECT id, parent_id FROM notes WHERE id = ?').get(id);
    if (!row) return 0;
    const ids = [row.id];
    const seen = new Set([row.id]);
    let cursor = row;
    while (cursor?.parent_id) {
      const parent = this.db.prepare('SELECT id, parent_id FROM notes WHERE id = ?').get(cursor.parent_id);
      if (!parent || seen.has(parent.id)) break;
      seen.add(parent.id);
      ids.push(parent.id);
      cursor = parent;
    }
    const now = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(', ');
    return this.db.prepare(`UPDATE notes SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE id IN (${placeholders})`).run(now, ...ids);
  }

  emptyTrash() {
    return this.db.prepare('DELETE FROM notes WHERE is_deleted = 1').run();
  }

  // Tasks operations
  getTasks({ status, category, priority, search } = {}) {
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (priority) {
      sql += ' AND priority = ?';
      params.push(priority);
    }
    if (search && search.trim()) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += " ORDER BY is_completed ASC, CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, due_date ASC, created_at DESC";
    return this.db.prepare(sql).all(...params);
  }

  getTaskById(id) {
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  }

  createTask(task) {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO tasks (id, title, description, priority, category, due_date, status, is_completed, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.id,
      task.title,
      task.description || '',
      task.priority || 'medium',
      task.category || 'عام',
      task.due_date || null,
      task.status || 'todo',
      task.is_completed ? 1 : 0,
      task.is_completed ? now : null,
      now,
      now
    );
    return this.getTaskById(task.id);
  }

  updateTask(id, updates) {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    if (updates.is_completed !== undefined) {
      updates.status = updates.is_completed ? 'done' : 'todo';
      updates.completed_at = updates.is_completed ? now : null;
    }

    for (const [key, val] of Object.entries(updates)) {
      if (['title', 'description', 'priority', 'category', 'due_date', 'status', 'is_completed', 'completed_at'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (fields.length === 0) return this.getTaskById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getTaskById(id);
  }

  deleteTask(id) {
    return this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }

  getTaskStats() {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    const completed = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE is_completed = 1').get().count;
    const pending = total - completed;
    const urgent = this.db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'urgent' AND is_completed = 0").get().count;
    const high = this.db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'high' AND is_completed = 0").get().count;
    
    // Category distribution
    const categories = this.db.prepare(`
      SELECT category, COUNT(*) as count, SUM(is_completed) as completed_count
      FROM tasks
      GROUP BY category
    `).all();

    // Priority distribution
    const priorities = this.db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM tasks
      GROUP BY priority
    `).all();

    return {
      total,
      completed,
      pending,
      urgent,
      high,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      categories,
      priorities
    };
  }

  // Finance operations
  getTransactions({ type, category, startDate, endDate, search } = {}) {
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    if (search && search.trim()) {
      sql += ' AND (title LIKE ? OR notes LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY date DESC, created_at DESC';
    return this.db.prepare(sql).all(...params);
  }

  getTransactionById(id) {
    return this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  }

  createTransaction(tx) {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO transactions (id, title, type, amount_cents, category, date, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tx.id,
      tx.title,
      tx.type,
      Math.round(tx.amount_cents),
      tx.category,
      tx.date,
      tx.notes || '',
      now,
      now
    );
    return this.getTransactionById(tx.id);
  }

  updateTransaction(id, updates) {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    for (const [key, val] of Object.entries(updates)) {
      if (['title', 'type', 'amount_cents', 'category', 'date', 'notes'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(key === 'amount_cents' ? Math.round(val) : val);
      }
    }

    if (fields.length === 0) return this.getTransactionById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getTransactionById(id);
  }

  deleteTransaction(id) {
    return this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  }

  getFinanceStats(year = null, month = null) {
    let whereClause = '1=1';
    const params = [];

    if (year && month) {
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      whereClause += ' AND date LIKE ?';
      params.push(`${monthPrefix}%`);
    } else if (year) {
      whereClause += ' AND date LIKE ?';
      params.push(`${year}%`);
    }

    const incomeRow = this.db.prepare(`
      SELECT COALESCE(SUM(amount_cents), 0) as total
      FROM transactions
      WHERE type = 'income' AND ${whereClause}
    `).get(...params);

    const expenseRow = this.db.prepare(`
      SELECT COALESCE(SUM(amount_cents), 0) as total
      FROM transactions
      WHERE type = 'expense' AND ${whereClause}
    `).get(...params);

    const totalIncome = incomeRow ? incomeRow.total : 0;
    const totalExpense = expenseRow ? expenseRow.total : 0;
    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    // Expenses breakdown by category
    const expenseCategories = this.db.prepare(`
      SELECT category, SUM(amount_cents) as total_cents, COUNT(*) as count
      FROM transactions
      WHERE type = 'expense' AND ${whereClause}
      GROUP BY category
      ORDER BY total_cents DESC
    `).all(...params);

    // Income breakdown by category
    const incomeCategories = this.db.prepare(`
      SELECT category, SUM(amount_cents) as total_cents, COUNT(*) as count
      FROM transactions
      WHERE type = 'income' AND ${whereClause}
      GROUP BY category
      ORDER BY total_cents DESC
    `).all(...params);

    // Monthly trend for the current year
    const currentYear = year || new Date().getFullYear().toString();
    const monthlyTrend = this.db.prepare(`
      SELECT 
        SUBSTR(date, 1, 7) as month,
        SUM(CASE WHEN type = 'income' THEN amount_cents ELSE 0 END) as income_cents,
        SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END) as expense_cents
      FROM transactions
      WHERE date LIKE ?
      GROUP BY month
      ORDER BY month ASC
    `).all(`${currentYear}%`);

    return {
      totalIncomeCents: totalIncome,
      totalExpenseCents: totalExpense,
      netBalanceCents: netBalance,
      savingsRate,
      expenseCategories,
      incomeCategories,
      monthlyTrend
    };
  }

  // Backup & Restore
  exportBackup() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      folders: this.getFolders(),
      notes: this.db.prepare('SELECT * FROM notes').all(),
      tasks: this.db.prepare('SELECT * FROM tasks').all(),
      transactions: this.db.prepare('SELECT * FROM transactions').all(),
      settings: this.db.prepare('SELECT * FROM settings').all()
    };
  }

  importBackup(data) {
    validateBackup(data);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.exec('PRAGMA defer_foreign_keys = ON; DELETE FROM transactions; DELETE FROM tasks; DELETE FROM notes; DELETE FROM folders;');
      for (const table of ['folders', 'notes', 'tasks', 'transactions']) {
        const columns = this.db.prepare(`PRAGMA table_info(${table})`).all().map(column => column.name);
        for (const row of data[table]) {
          const keys = columns.filter(key => row[key] !== undefined);
          const values = keys.map(key => typeof row[key] === 'boolean' ? Number(row[key]) : row[key]);
          this.db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...values);
        }
      }
      if (data.settings) {
        this.db.exec('DELETE FROM settings');
        const insert = this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        for (const row of data.settings) insert.run(row.key, row.value);
      }
      if (this.db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Broken backup references');
      this.db.exec('COMMIT');
      return { success: true };
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  // Settings
  getSetting(key, defaultValue = null) {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : defaultValue;
  }

  setSetting(key, value) {
    const str = JSON.stringify(value);
    this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, str);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = DatabaseManager;
