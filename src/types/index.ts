export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  folder_id: string | null;
  parent_id?: string | null;
  title: string;
  content: string;
  content_html: string;
  is_pinned: number; // 0 or 1
  is_favorite: number; // 0 or 1
  is_deleted: number; // 0 or 1
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  due_date: string | null;
  status: TaskStatus;
  is_completed: number; // 0 or 1
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  urgent: number;
  high: number;
  completionRate: number;
  categories: { category: string; count: number; completed_count: number }[];
  priorities: { priority: TaskPriority; count: number }[];
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  type: TransactionType;
  amount_cents: number; // stored as cents/integer to avoid floating-point math issues
  category: string;
  date: string; // YYYY-MM-DD
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceCategoryStat {
  category: string;
  total_cents: number;
  count: number;
}

export interface FinanceMonthlyTrend {
  month: string; // YYYY-MM
  income_cents: number;
  expense_cents: number;
}

export interface FinanceStats {
  totalIncomeCents: number;
  totalExpenseCents: number;
  netBalanceCents: number;
  savingsRate: number;
  expenseCategories: FinanceCategoryStat[];
  incomeCategories: FinanceCategoryStat[];
  monthlyTrend: FinanceMonthlyTrend[];
}

export type NavView = 'notes' | 'tasks' | 'finance' | 'trash' | 'settings';
export type Theme = 'dark' | 'light';

export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  currentVersion: string;
  version?: string;
  releaseNotes?: string;
  progress?: number;
  lastChecked?: string;
  portable: boolean;
  error?: string;
}

export interface ElectronAPI {
  // Folders
  getFolders: () => Promise<Folder[]>;
  createFolder: (folder: Partial<Folder> & { id: string; name: string }) => Promise<Folder>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<any>;

  // Notes
  getNotes: (filters?: {
    folder_id?: string | null;
    is_deleted?: number;
    is_favorite?: number;
    is_pinned?: number;
    search?: string;
  }) => Promise<Note[]>;
  getNoteById: (id: string) => Promise<Note | undefined>;
  createNote: (note: Partial<Note> & { id: string; title: string }) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string, permanent?: boolean) => Promise<any>;
  restoreNote: (id: string) => Promise<any>;
  emptyTrash: () => Promise<any>;

  // Tasks
  getTasks: (filters?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
  }) => Promise<Task[]>;
  createTask: (task: Partial<Task> & { id: string; title: string }) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<any>;
  getTaskStats: () => Promise<TaskStats>;

  // Finance
  getTransactions: (filters?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => Promise<Transaction[]>;
  createTransaction: (tx: Partial<Transaction> & { id: string; title: string; type: TransactionType; amount_cents: number; category: string; date: string }) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<any>;
  getFinanceStats: (year?: string | null, month?: number | null) => Promise<FinanceStats>;

  // Backup & Restore
  exportBackup: () => Promise<any>;
  importBackup: (data: any) => Promise<{ success: boolean }>;
  saveBackupToFile: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
  restoreBackupFromFile: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;

  getAppInfo?: () => Promise<{ version: string; dataPath: string; updatesSupported: boolean }>;
  getUpdateState?: () => Promise<UpdateState>;
  checkForUpdates?: () => Promise<UpdateState>;
  downloadUpdate?: () => Promise<void>;
  installUpdate?: () => void;
  openReleasePage?: () => void;
  onUpdateState?: (callback: (state: UpdateState) => void) => () => void;
  onBeforeClose?: (callback: () => void) => () => void;
  confirmClose?: () => void;

  // Settings
  getSetting: (key: string, defaultValue?: any) => Promise<any>;
  setSetting: (key: string, value: any) => Promise<void>;

  // Window Controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
  onWindowStateChanged?: (callback: (state: { isMaximized: boolean }) => void) => () => void;
}

declare global {
  interface Window {
    api?: ElectronAPI;
  }
}
