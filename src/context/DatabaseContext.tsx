import { usePreferences } from './PreferencesContext';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Folder, Note, Task, TaskStats, Transaction, FinanceStats } from '../types';
import { api } from '../db/apiClient';
import { generateId } from '../utils/formatters';

interface DatabaseContextType {
  // Folders
  folders: Folder[];
  createFolder: (name: string, icon?: string, color?: string) => Promise<Folder>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Notes
  notes: Note[];
  trashNotes: Note[];
  activeNote: Note | null;
  setActiveNote: (note: Note | null) => void;
  createNote: (folderId?: string | null, parentId?: string | null) => Promise<Note>;
  updateActiveNote: (updates: Partial<Note>) => void;
  deleteNote: (id: string, permanent?: boolean) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  toggleFavoriteNote: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  refreshNotes: () => Promise<void>;

  // Tasks
  tasks: Task[];
  taskStats: TaskStats | null;
  createTask: (task: { title: string; description?: string; priority?: any; category?: string; due_date?: string | null }) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;

  // Finance
  transactions: Transaction[];
  financeStats: FinanceStats | null;
  createTransaction: (tx: { title: string; type: 'income' | 'expense'; amount_cents: number; category: string; date: string; notes?: string }) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshFinance: () => Promise<void>;

  // Backup & Status
  saveStatus: 'saved' | 'saving' | 'error';
  flushPendingSaves: () => Promise<void>;
  lastSavedAt: Date | null;
  exportBackup: () => Promise<any>;
  saveBackupToFile: () => Promise<{ success: boolean; filePath?: string }>;
  restoreBackupFromFile: () => Promise<{ success: boolean; filePath?: string }>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = usePreferences();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingNoteUpdatesRef = useRef(new Map<string, Partial<Note>>());
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const flushPending = useCallback(() => {
    const run = async () => {
      try {
        while (pendingNoteUpdatesRef.current.size) {
          const [id, updates] = pendingNoteUpdatesRef.current.entries().next().value!;
          await api.updateNote(id, updates);
          if (pendingNoteUpdatesRef.current.get(id) === updates) pendingNoteUpdatesRef.current.delete(id);
        }
        setSaveStatus('saved'); setLastSavedAt(new Date());
      } catch (error) { setSaveStatus('error'); throw error; }
    };
    saveChain.current = saveChain.current.catch(() => {}).then(run);
    return saveChain.current;
  }, []);
  useEffect(() => {
    const unsubscribe = api.onBeforeClose?.(() => { flushPending().then(() => api.confirmClose?.()).catch(console.error); });
    return () => { unsubscribe?.(); if (saveTimerRef.current) clearTimeout(saveTimerRef.current); void flushPending().catch(console.error); };
  }, [flushPending]);

  // Initial Load
  const refreshAll = useCallback(async () => {
    try {
      const [loadedFolders, loadedNotes, loadedTrash, loadedTasks, loadedStats, loadedTxs, loadedFinStats] = await Promise.all([
        api.getFolders(),
        api.getNotes(),
        api.getNotes({ is_deleted: 1 }),
        api.getTasks(),
        api.getTaskStats(),
        api.getTransactions(),
        api.getFinanceStats(),
      ]);

      setFolders(loadedFolders);
      setNotes(loadedNotes);
      setTrashNotes(loadedTrash);
      setTasks(loadedTasks);
      setTaskStats(loadedStats);
      setTransactions(loadedTxs);
      setFinanceStats(loadedFinStats);

      // Default active note
      setActiveNote(current => current ? loadedNotes.find(note => note.id === current.id) || loadedNotes[0] || null : loadedNotes[0] || null);
    } catch (err) {
      console.error('Failed to load initial database:', err);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Refresh functions
  const refreshNotes = async () => {
    const [list, trashList] = await Promise.all([
      api.getNotes(),
      api.getNotes({ is_deleted: 1 }),
    ]);
    setNotes(list);
    setTrashNotes(trashList);
  };

  const refreshTasks = async () => {
    const [list, stats] = await Promise.all([api.getTasks(), api.getTaskStats()]);
    setTasks(list);
    setTaskStats(stats);
  };

  const refreshFinance = async () => {
    const [list, stats] = await Promise.all([api.getTransactions(), api.getFinanceStats()]);
    setTransactions(list);
    setFinanceStats(stats);
  };

  // Folder Actions
  const createFolder = async (name: string, icon: string = 'folder', color: string = '#f59e0b') => {
    const newFolder = await api.createFolder({
      id: generateId('f'),
      name,
      icon,
      color,
      sort_order: folders.length + 1,
    });
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    const updated = await api.updateFolder(id, updates);
    setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
  };

  const deleteFolder = async (id: string) => {
    await api.deleteFolder(id);
    // The DB trashes the folder subtree (children included); reload folders from
    // the source of truth so descendant folders don't linger in the UI.
    setFolders(await api.getFolders());
    await refreshNotes();
  };

  // Notes Actions
  const createNote = async (folderId?: string | null, parentId?: string | null) => {
    const newNote = await api.createNote({
      id: generateId('n'),
      folder_id: folderId || null,
      parent_id: parentId || null,
      title: document.documentElement.lang === 'ar' ? 'ملاحظة جديدة' : 'New note',
      content: '',
      content_html: '',
      is_pinned: 0,
      is_favorite: 0,
    });

    setNotes((prev) => [newNote, ...prev]);
    setActiveNote(newNote);
    return newNote;
  };

  // Auto-Save Note with Debounce
  const updateActiveNote = (updates: Partial<Note>) => {
    if (!activeNote) return;

    const pending = pendingNoteUpdatesRef.current.get(activeNote.id) || {};
    const merged = { ...pending, ...updates };
    const updated = { ...activeNote, ...merged, updated_at: new Date().toISOString() };
    setActiveNote(updated);
    setNotes(prev => prev.map(note => note.id === updated.id ? { ...note, ...merged } : note));
    pendingNoteUpdatesRef.current.set(updated.id, merged);
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { void flushPending().catch(console.error); }, preferences.saveDelay);
  };

  const deleteNote = async (id: string, permanent: boolean = false) => {
    await flushPending();
    await api.deleteNote(id, permanent);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNote?.id === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setActiveNote(remaining.length > 0 ? remaining[0] : null);
    }
    // Reload from the DB: the delete cascades to sub-pages and the trash side
    // (trashNotes) must refresh immediately for the badge and TrashView.
    await refreshNotes();
  };

  const restoreNote = async (id: string) => {
    await api.restoreNote(id);
    await refreshNotes();
  };

  const togglePinNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const nextVal = note.is_pinned ? 0 : 1;
    await api.updateNote(id, { is_pinned: nextVal });
    setNotes((prev) =>
      prev
        .map((n) => (n.id === id ? { ...n, is_pinned: nextVal } : n))
        .sort((a, b) => b.is_pinned - a.is_pinned)
    );
    if (activeNote?.id === id) {
      setActiveNote((prev) => (prev ? { ...prev, is_pinned: nextVal } : null));
    }
  };

  const toggleFavoriteNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const nextVal = note.is_favorite ? 0 : 1;
    await api.updateNote(id, { is_favorite: nextVal });
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, is_favorite: nextVal } : n)));
    if (activeNote?.id === id) {
      setActiveNote((prev) => (prev ? { ...prev, is_favorite: nextVal } : null));
    }
  };

  const emptyTrash = async () => {
    await api.emptyTrash();
    await refreshNotes();
  };

  // Task Actions
  const createTask = async (data: {
    title: string;
    description?: string;
    priority?: any;
    category?: string;
    due_date?: string | null;
  }) => {
    const newTask = await api.createTask({
      id: generateId('t'),
      title: data.title,
      description: data.description || '',
      priority: data.priority || 'medium',
      category: data.category || 'عام',
      due_date: data.due_date || null,
      status: 'todo',
      is_completed: 0,
    });
    setTasks((prev) => [newTask, ...prev]);
    const updatedStats = await api.getTaskStats();
    setTaskStats(updatedStats);
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updated = await api.updateTask(id, updates);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    const updatedStats = await api.getTaskStats();
    setTaskStats(updatedStats);
  };

  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const isCompleted = task.is_completed ? 0 : 1;
    await updateTask(id, { is_completed: isCompleted });
  };

  const deleteTask = async (id: string) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const updatedStats = await api.getTaskStats();
    setTaskStats(updatedStats);
  };

  // Finance Actions
  const createTransaction = async (txData: {
    title: string;
    type: 'income' | 'expense';
    amount_cents: number;
    category: string;
    date: string;
    notes?: string;
  }) => {
    const newTx = await api.createTransaction({
      id: generateId('tx'),
      title: txData.title,
      type: txData.type,
      amount_cents: txData.amount_cents,
      category: txData.category,
      date: txData.date,
      notes: txData.notes || '',
    });
    setTransactions((prev) => [newTx, ...prev]);
    const stats = await api.getFinanceStats();
    setFinanceStats(stats);
    return newTx;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const updated = await api.updateTransaction(id, updates);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    const stats = await api.getFinanceStats();
    setFinanceStats(stats);
  };

  const deleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const stats = await api.getFinanceStats();
    setFinanceStats(stats);
  };

  // Backup & Restore
  const exportBackup = async () => {
    await flushPending();
    return api.exportBackup();
  };

  const saveBackupToFile = async () => {
    await flushPending();
    return api.saveBackupToFile();
  };

  const restoreBackupFromFile = async () => {
    await flushPending();
    const result = await api.restoreBackupFromFile();
    if (result.success) {
      window.location.reload();
    }
    return result;
  };

  return (
    <DatabaseContext.Provider
      value={{
        folders,
        createFolder,
        updateFolder,
        deleteFolder,

        notes,
        trashNotes,
        activeNote,
        setActiveNote,
        createNote,
        updateActiveNote,
        deleteNote,
        restoreNote,
        togglePinNote,
        toggleFavoriteNote,
        emptyTrash,
        refreshNotes,

        tasks,
        taskStats,
        createTask,
        updateTask,
        toggleTaskCompletion,
        deleteTask,
        refreshTasks,

        transactions,
        financeStats,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        refreshFinance,

        saveStatus,
        flushPendingSaves: flushPending,
        lastSavedAt,
        exportBackup,
        saveBackupToFile,
        restoreBackupFromFile,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase must be used within DatabaseProvider');
  return context;
};
