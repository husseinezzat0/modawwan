const fail = () => { throw new Error('Invalid input'); };
const object = value => value && typeof value === 'object' && !Array.isArray(value) || fail();
const string = (value, max = 256) => typeof value === 'string' && value.length <= max && !value.includes('\0') || fail();
const fields = {
  folders: { id: 256, name: 512, parent_id: 256, icon: 128, color: 64, sort_order: 'integer' },
  notes: { id: 256, folder_id: 256, parent_id: 256, title: 4096, content: 2000000, content_html: 2000000, is_pinned: 'flag', is_favorite: 'flag', is_deleted: 'flag', deleted_at: 64 },
  tasks: { id: 256, title: 4096, description: 100000, priority: ['low', 'medium', 'high', 'urgent'], category: 512, due_date: 64, status: ['todo', 'in_progress', 'done'], is_completed: 'flag', completed_at: 64 },
  transactions: { id: 256, title: 4096, type: ['income', 'expense'], amount_cents: 'money', category: 512, date: 64, notes: 100000 },
};
function record(table, value, update = false, backup = false) {
  object(value);
  for (const [key, val] of Object.entries(value)) {
    if (backup && ['created_at', 'updated_at'].includes(key)) { string(val, 64); continue; }
    const rule = fields[table][key];
    if (!Object.hasOwn(fields[table], key) || !rule || update && key === 'id') fail();
    if (val === null && ['parent_id', 'folder_id', 'deleted_at', 'completed_at', 'due_date'].includes(key)) continue;
    if (typeof rule === 'number') string(val, rule);
    else if (Array.isArray(rule)) { if (!rule.includes(val)) fail(); }
    else if (rule === 'flag') { if (![0, 1, false, true].includes(val)) fail(); }
    else if (!Number.isSafeInteger(val) || rule === 'money' && val < 0) fail();
  }
  if (!update) {
    string(value.id); if (!value.id) fail();
    for (const key of table === 'transactions' ? ['title', 'type', 'amount_cents', 'category', 'date'] : [table === 'folders' ? 'name' : 'title']) {
      if (value[key] === undefined) fail();
    }
  }
}
function setting(key, value) {
  string(key, 128);
  if (value === undefined || JSON.stringify(value).length > 65536) fail();
  if (key === 'theme' && !['light', 'dark', 'system'].includes(value)) fail();
  if (key === 'language' && !['ar', 'en'].includes(value)) fail();
  if (key === 'preferences') {
    object(value);
    const rules = { startView: ['notes', 'tasks', 'finance'], fontSize: [14.5, 16, 18], density: ['comfortable', 'compact'], editorFont: ['default', 'serif', 'monospace', 'cairo', 'inter'], editorSize: [14, 16, 18, 20], spellcheck: [true, false], saveDelay: [0, 350, 1000], uiFont: ['system', 'cairo', 'inter'], autoCheckUpdates: [true, false] };
    for (const [k, v] of Object.entries(value)) if (!rules[k]?.includes(v)) fail();
  }
}
function validateBackup(data) {
  object(data); if (data.version !== 1 || JSON.stringify(data).length > 32000000) fail();
  for (const table of Object.keys(fields)) {
    if (!Array.isArray(data[table]) || data[table].length > 100000) fail();
    const ids = new Set();
    for (const row of data[table]) {
      record(table, row, false, true);
      if (ids.has(row.id)) fail(); ids.add(row.id);
    }
  }
  for (const table of ['folders', 'notes']) {
    const rows = new Map(data[table].map(row => [row.id, row]));
    const checked = new Set();
    for (const row of rows.values()) {
      const seen = new Set(); let current = row;
      while (current?.parent_id && !checked.has(current.id)) {
        if (seen.has(current.id) || !rows.has(current.parent_id)) fail();
        seen.add(current.id); current = rows.get(current.parent_id);
      }
      for (const id of seen) checked.add(id);
    }
  }
  const folders = new Set(data.folders.map(row => row.id));
  for (const note of data.notes) if (note.folder_id && !folders.has(note.folder_id)) fail();
  if (data.settings !== undefined) {
    if (!Array.isArray(data.settings)) fail();
    const keys = new Set();
    for (const row of data.settings) { object(row); string(row.value, 65536); setting(row.key, JSON.parse(row.value)); if (keys.has(row.key)) fail(); keys.add(row.key); }
  }
  return data;
}
function validateArgs(channel, args) {
  if (args.length > 2) fail();
  const match = channel.match(/^db:(create|update)(Folder|Note|Task|Transaction)$/);
  if (match) {
    const table = { Folder: 'folders', Note: 'notes', Task: 'tasks', Transaction: 'transactions' }[match[2]];
    if (match[1] === 'update') { string(args[0]); record(table, args[1], true); }
    else record(table, args[0]);
  } else if (/^db:(deleteFolder|deleteNote|restoreNote|getNoteById|deleteTask|deleteTransaction)$/.test(channel)) {
    string(args[0]); if (args[1] !== undefined && typeof args[1] !== 'boolean') fail();
  } else if (channel === 'db:importBackup') validateBackup(args[0]);
  else if (channel === 'db:setSetting') setting(args[0], args[1]);
  else if (channel === 'db:getSetting') string(args[0], 128);
  else if (channel === 'db:getFinanceStats') {
    if (args[0] != null && !/^\d{4}$/.test(String(args[0]))) fail();
    if (args[1] != null && (!Number.isInteger(args[1]) || args[1] < 1 || args[1] > 12)) fail();
  } else if (['db:getNotes', 'db:getTasks', 'db:getTransactions'].includes(channel) && args[0] !== undefined) {
    object(args[0]);
    const allowed = ['folder_id', 'parent_id', 'parentId', 'is_deleted', 'is_favorite', 'is_pinned', 'search', 'status', 'category', 'priority', 'type', 'startDate', 'endDate'];
    for (const [key, value] of Object.entries(args[0])) {
      if (!allowed.includes(key)) fail();
      if (value != null && ![0, 1, true, false].includes(value)) string(value, 4096);
    }
  }
}
module.exports = { record, setting, validateBackup, validateArgs };
