import {
  Folder,
  Note,
  Task,
  TaskStats,
  Transaction,
  FinanceStats,
  ElectronAPI
} from '../types';
import { generateId } from '../utils/formatters';

// Fallback in-memory / localStorage storage if running outside Electron
class LocalStorageFallback implements ElectronAPI {
  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(`modawwan_${key}`);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, val: T): void {
    try {
      localStorage.setItem(`modawwan_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }

  async getFolders(): Promise<Folder[]> {
    let folders = this.getStorage<Folder[]>('folders', []);
    if (folders.length === 0) {
      const now = new Date().toISOString();
      folders = [
        { id: 'f-quick', name: 'ملاحظات سريعة', parent_id: null, icon: 'zap', color: '#f59e0b', sort_order: 1, created_at: now, updated_at: now },
        { id: 'f-work', name: 'العمل والمشاريع', parent_id: null, icon: 'briefcase', color: '#3b82f6', sort_order: 2, created_at: now, updated_at: now },
        { id: 'f-personal', name: 'الحياة الشخصية', parent_id: null, icon: 'user', color: '#10b981', sort_order: 3, created_at: now, updated_at: now },
      ];
      this.setStorage('folders', folders);
    }
    return folders;
  }

  async createFolder(folder: Partial<Folder> & { id: string; name: string }): Promise<Folder> {
    const folders = await this.getFolders();
    const now = new Date().toISOString();
    const newFolder: Folder = {
      id: folder.id || generateId('f'),
      name: folder.name,
      parent_id: folder.parent_id || null,
      icon: folder.icon || 'folder',
      color: folder.color || '#f59e0b',
      sort_order: folder.sort_order || folders.length + 1,
      created_at: now,
      updated_at: now,
    };
    folders.push(newFolder);
    this.setStorage('folders', folders);
    return newFolder;
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    const folders = await this.getFolders();
    const idx = folders.findIndex(f => f.id === id);
    if (idx !== -1) {
      folders[idx] = { ...folders[idx], ...updates, updated_at: new Date().toISOString() };
      this.setStorage('folders', folders);
      return folders[idx];
    }
    throw new Error('Folder not found');
  }

  async deleteFolder(id: string): Promise<any> {
    let folders = await this.getFolders();
    folders = folders.filter(f => f.id !== id && f.parent_id !== id);
    this.setStorage('folders', folders);
    return { success: true };
  }

  // Notes
  async getNotes(filters: any = {}): Promise<Note[]> {
    let notes = this.getStorage<Note[]>('notes', []);
    if (notes.length === 0) {
      const now = new Date().toISOString();
      notes = [
        {
          id: 'n-welcome',
          folder_id: 'f-quick',
          title: 'مرحباً بك في مُدَوَّن 🌟',
          content: 'تطبيق الإنتاجية وإدارة الملاحظات والمهام والمالية لسطح المكتب بنظام Windows.',
          content_html: '<h1>مرحباً بك في مُدَوَّن 🌟</h1><p>تطبيق الإنتاجية وإدارة الملاحظات والمهام والمالية لسطح المكتب بنظام Windows.</p><ul><li>إدارة الملاحظات الغنية</li><li>إدارة المهام والإحصائيات</li><li>الإدارة المالية والمخططات</li></ul>',
          is_pinned: 1,
          is_favorite: 1,
          is_deleted: 0,
          deleted_at: null,
          created_at: now,
          updated_at: now,
        }
      ];
      this.setStorage('notes', notes);
    }

    return notes.filter(n => {
      if (filters.is_deleted !== undefined && n.is_deleted !== (filters.is_deleted ? 1 : 0)) return false;
      if (filters.folder_id !== undefined && n.folder_id !== filters.folder_id) return false;
      if (filters.is_favorite !== undefined && n.is_favorite !== (filters.is_favorite ? 1 : 0)) return false;
      if (filters.is_pinned !== undefined && n.is_pinned !== (filters.is_pinned ? 1 : 0)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => b.is_pinned - a.is_pinned || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  async getNoteById(id: string): Promise<Note | undefined> {
    const notes = await this.getNotes({ is_deleted: 0 });
    return notes.find(n => n.id === id);
  }

  async createNote(note: Partial<Note> & { id: string; title: string }): Promise<Note> {
    const notes = this.getStorage<Note[]>('notes', []);
    const now = new Date().toISOString();
    const newNote: Note = {
      id: note.id || generateId('n'),
      folder_id: note.folder_id || null,
      title: note.title || 'ملاحظة جديدة',
      content: note.content || '',
      content_html: note.content_html || '',
      is_pinned: note.is_pinned ? 1 : 0,
      is_favorite: note.is_favorite ? 1 : 0,
      is_deleted: 0,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };
    notes.unshift(newNote);
    this.setStorage('notes', notes);
    return newNote;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const notes = this.getStorage<Note[]>('notes', []);
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], ...updates, updated_at: new Date().toISOString() };
      this.setStorage('notes', notes);
      return notes[idx];
    }
    throw new Error('Note not found');
  }

  async deleteNote(id: string, permanent: boolean = false): Promise<any> {
    let notes = this.getStorage<Note[]>('notes', []);
    if (permanent) {
      notes = notes.filter(n => n.id !== id);
    } else {
      const idx = notes.findIndex(n => n.id === id);
      if (idx !== -1) {
        notes[idx].is_deleted = 1;
        notes[idx].deleted_at = new Date().toISOString();
      }
    }
    this.setStorage('notes', notes);
    return { success: true };
  }

  async restoreNote(id: string): Promise<any> {
    const notes = this.getStorage<Note[]>('notes', []);
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1) {
      notes[idx].is_deleted = 0;
      notes[idx].deleted_at = null;
      notes[idx].updated_at = new Date().toISOString();
      this.setStorage('notes', notes);
    }
    return { success: true };
  }

  async emptyTrash(): Promise<any> {
    let notes = this.getStorage<Note[]>('notes', []);
    notes = notes.filter(n => !n.is_deleted);
    this.setStorage('notes', notes);
    return { success: true };
  }

  // Tasks
  async getTasks(filters: any = {}): Promise<Task[]> {
    let tasks = this.getStorage<Task[]>('tasks', []);
    if (tasks.length === 0) {
      const now = new Date().toISOString();
      tasks = [
        { id: 't-1', title: 'استكشاف مميزات تطبيق مُدَوَّن', description: 'تجربة إنشاء ملاحظة، مهمة، ومعاملة مالية جديدة', priority: 'high', category: 'شخصي', due_date: now.split('T')[0], status: 'todo', is_completed: 0, completed_at: null, created_at: now, updated_at: now },
        { id: 't-2', title: 'تنظيم قائمة المهام الأسبوعية', description: 'تحديد الأولويات للمهام العاجلة والمهمة', priority: 'urgent', category: 'عمل', due_date: now.split('T')[0], status: 'in_progress', is_completed: 0, completed_at: null, created_at: now, updated_at: now },
        { id: 't-3', title: 'مراجعة الميزانية الشهرية', description: 'تسجيل المصروفات والتأكد من خطة الادخار', priority: 'medium', category: 'مالية', due_date: now.split('T')[0], status: 'done', is_completed: 1, completed_at: now, created_at: now, updated_at: now },
      ];
      this.setStorage('tasks', tasks);
    }

    return tasks.filter(t => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => a.is_completed - b.is_completed);
  }

  async createTask(task: Partial<Task> & { id: string; title: string }): Promise<Task> {
    const tasks = this.getStorage<Task[]>('tasks', []);
    const now = new Date().toISOString();
    const newTask: Task = {
      id: task.id || generateId('t'),
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      category: task.category || 'عام',
      due_date: task.due_date || null,
      status: task.status || 'todo',
      is_completed: task.is_completed ? 1 : 0,
      completed_at: task.is_completed ? now : null,
      created_at: now,
      updated_at: now,
    };
    tasks.unshift(newTask);
    this.setStorage('tasks', tasks);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const tasks = this.getStorage<Task[]>('tasks', []);
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      const now = new Date().toISOString();
      if (updates.is_completed !== undefined) {
        updates.status = updates.is_completed ? 'done' : 'todo';
        updates.completed_at = updates.is_completed ? now : null;
      }
      tasks[idx] = { ...tasks[idx], ...updates, updated_at: now };
      this.setStorage('tasks', tasks);
      return tasks[idx];
    }
    throw new Error('Task not found');
  }

  async deleteTask(id: string): Promise<any> {
    let tasks = this.getStorage<Task[]>('tasks', []);
    tasks = tasks.filter(t => t.id !== id);
    this.setStorage('tasks', tasks);
    return { success: true };
  }

  async getTaskStats(): Promise<TaskStats> {
    const tasks = await this.getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.is_completed).length;
    const pending = total - completed;
    const urgent = tasks.filter(t => t.priority === 'urgent' && !t.is_completed).length;
    const high = tasks.filter(t => t.priority === 'high' && !t.is_completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const catMap: Record<string, { count: number; completed_count: number }> = {};
    for (const t of tasks) {
      if (!catMap[t.category]) catMap[t.category] = { count: 0, completed_count: 0 };
      catMap[t.category].count++;
      if (t.is_completed) catMap[t.category].completed_count++;
    }

    const priorityMap: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
    for (const t of tasks) {
      priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;
    }

    return {
      total,
      completed,
      pending,
      urgent,
      high,
      completionRate,
      categories: Object.entries(catMap).map(([category, val]) => ({ category, ...val })),
      priorities: Object.entries(priorityMap).map(([priority, count]) => ({ priority: priority as any, count })),
    };
  }

  // Finance
  async getTransactions(filters: any = {}): Promise<Transaction[]> {
    let txs = this.getStorage<Transaction[]>('transactions', []);
    if (txs.length === 0) {
      const now = new Date().toISOString();
      const today = now.split('T')[0];
      txs = [
        { id: 'tx-1', title: 'راتب الشهر الحالي', type: 'income', amount_cents: 1250000, category: 'راتب', date: today, notes: 'تحويل الحساب البنكي', created_at: now, updated_at: now },
        { id: 'tx-2', title: 'إيجار السكن', type: 'expense', amount_cents: 300000, category: 'سكن', date: today, notes: 'دفعة شهرية', created_at: now, updated_at: now },
        { id: 'tx-3', title: 'فاتورة الكهرباء والإنترنت', type: 'expense', amount_cents: 45000, category: 'فواتير', date: today, notes: 'سداد فوري', created_at: now, updated_at: now },
        { id: 'tx-4', title: 'مشروع عمل حر برمجي', type: 'income', amount_cents: 220000, category: 'عمل حر', date: today, notes: 'دفعة إنجاز مرحلة أولى', created_at: now, updated_at: now },
        { id: 'tx-5', title: 'مشتريات البقالة الأسبوعية', type: 'expense', amount_cents: 38000, category: 'طعام', date: today, notes: 'تموين المنزل', created_at: now, updated_at: now },
      ];
      this.setStorage('transactions', txs);
    }

    return txs.filter(t => {
      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }

  async createTransaction(tx: any): Promise<Transaction> {
    const txs = this.getStorage<Transaction[]>('transactions', []);
    const now = new Date().toISOString();
    const newTx: Transaction = {
      id: tx.id || generateId('tx'),
      title: tx.title,
      type: tx.type,
      amount_cents: Math.round(tx.amount_cents),
      category: tx.category,
      date: tx.date,
      notes: tx.notes || '',
      created_at: now,
      updated_at: now,
    };
    txs.unshift(newTx);
    this.setStorage('transactions', txs);
    return newTx;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const txs = this.getStorage<Transaction[]>('transactions', []);
    const idx = txs.findIndex(t => t.id === id);
    if (idx !== -1) {
      txs[idx] = { ...txs[idx], ...updates, updated_at: new Date().toISOString() };
      this.setStorage('transactions', txs);
      return txs[idx];
    }
    throw new Error('Transaction not found');
  }

  async deleteTransaction(id: string): Promise<any> {
    let txs = this.getStorage<Transaction[]>('transactions', []);
    txs = txs.filter(t => t.id !== id);
    this.setStorage('transactions', txs);
    return { success: true };
  }

  async getFinanceStats(year: any = null, month: any = null): Promise<FinanceStats> {
    const txs = await this.getTransactions();
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseCatMap: Record<string, { total_cents: number; count: number }> = {};
    const incomeCatMap: Record<string, { total_cents: number; count: number }> = {};
    const monthMap: Record<string, { income_cents: number; expense_cents: number }> = {};

    for (const t of txs) {
      if (t.type === 'income') {
        totalIncome += t.amount_cents;
        if (!incomeCatMap[t.category]) incomeCatMap[t.category] = { total_cents: 0, count: 0 };
        incomeCatMap[t.category].total_cents += t.amount_cents;
        incomeCatMap[t.category].count++;
      } else {
        totalExpense += t.amount_cents;
        if (!expenseCatMap[t.category]) expenseCatMap[t.category] = { total_cents: 0, count: 0 };
        expenseCatMap[t.category].total_cents += t.amount_cents;
        expenseCatMap[t.category].count++;
      }

      const m = t.date.substring(0, 7);
      if (!monthMap[m]) monthMap[m] = { income_cents: 0, expense_cents: 0 };
      if (t.type === 'income') monthMap[m].income_cents += t.amount_cents;
      else monthMap[m].expense_cents += t.amount_cents;
    }

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    return {
      totalIncomeCents: totalIncome,
      totalExpenseCents: totalExpense,
      netBalanceCents: netBalance,
      savingsRate,
      expenseCategories: Object.entries(expenseCatMap).map(([category, v]) => ({ category, ...v })),
      incomeCategories: Object.entries(incomeCatMap).map(([category, v]) => ({ category, ...v })),
      monthlyTrend: Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v })),
    };
  }

  // Backup & Restore
  async exportBackup(): Promise<any> {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      folders: await this.getFolders(),
      notes: await this.getNotes(),
      tasks: await this.getTasks(),
      transactions: await this.getTransactions(),
    };
  }

  async importBackup(data: any): Promise<{ success: boolean }> {
    if (data.folders) this.setStorage('folders', data.folders);
    if (data.notes) this.setStorage('notes', data.notes);
    if (data.tasks) this.setStorage('tasks', data.tasks);
    if (data.transactions) this.setStorage('transactions', data.transactions);
    return { success: true };
  }

  async saveBackupToFile(): Promise<any> {
    const backup = await this.exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modawwan-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true, filePath: a.download };
  }

  async restoreBackupFromFile(): Promise<any> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return resolve({ success: false, canceled: true });
        const text = await file.text();
        const data = JSON.parse(text);
        await this.importBackup(data);
        resolve({ success: true, filePath: file.name });
      };
      input.click();
    });
  }

  async getSetting(key: string, defaultValue?: any): Promise<any> {
    return this.getStorage(`setting_${key}`, defaultValue);
  }

  async setSetting(key: string, value: any): Promise<void> {
    this.setStorage(`setting_${key}`, value);
  }

  minimizeWindow(): void {}
  maximizeWindow(): void {}
  closeWindow(): void {}
  async isMaximized(): Promise<boolean> { return false; }
}

export const api: ElectronAPI = window.api || new LocalStorageFallback();
