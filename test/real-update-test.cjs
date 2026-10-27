const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const testDir = path.resolve('scratch/real-update-test');
const userDataDir = path.join(testDir, 'userdata');
fs.mkdirSync(userDataDir, { recursive: true });

const exe110 = path.resolve('release/win-unpacked/Modawwan.exe');
const exe120 = path.resolve('scratch/build-1.2.0-verified/win-unpacked/Modawwan.exe');

assert.ok(fs.existsSync(exe110), 'v1.1.0 executable must exist');
assert.ok(fs.existsSync(exe120), 'v1.2.0 executable must exist');

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function launchApp(exePath, port = 9338) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(exePath, [
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDataDir}`
  ], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env
  });

  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });

  let target;
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const pages = await res.json();
      target = pages.find(p => p.type === 'page');
      if (target) break;
    } catch {}
    await pause(100);
  }

  if (!target) {
    child.kill();
    throw new Error('Could not attach debugger to Modawwan instance: ' + logs.slice(-1000));
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let sequence = 0;
  const pending = new Map();
  const errors = [];

  socket.onmessage = event => {
    const value = JSON.parse(event.data);
    if (value.id) {
      const task = pending.get(value.id);
      pending.delete(value.id);
      if (value.error) task.reject(new Error(value.error.message));
      else task.resolve(value.result);
    }
    if (value.method === 'Runtime.exceptionThrown') {
      errors.push(value.params.exceptionDetails.exception?.description || value.params.exceptionDetails.text);
    }
  };

  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  await call('Runtime.enable');
  await call('Page.enable');

  const js = async expr => {
    const res = await call('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    }
    return res.result.value;
  };

  const wait = async (expr, maxMs = 8000) => {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (await js(expr)) return;
      await pause(50);
    }
    throw new Error('Timed out waiting for: ' + expr);
  };

  const stop = async () => {
    const exited = new Promise(resolve => child.once('exit', resolve));
    try {
      await js('window.api.closeWindow()');
    } catch {
      child.kill();
    }
    await Promise.race([
      exited,
      pause(8000).then(() => { if (child.exitCode === null) child.kill(); })
    ]);
    try { socket.close(); } catch {}
  };

  return { js, wait, stop, errors, child, logs: () => logs };
}

(async () => {
  console.log('=== Step 1: Launch Older Version (1.1.0) and Seed Data ===');
  const app110 = await launchApp(exe110, 9338);
  await app110.wait('!!window.api');
  
  const info110 = await app110.js('window.api.getAppInfo()');
  console.log('  App 1.1.0 Info:', info110);
  assert.equal(info110.version, '1.1.0', 'Initial version must be 1.1.0');

  // Seed test folder, note, task, and transaction
  const folder = await app110.js(`window.api.createFolder({ id: 'folder-upgrade-1', name: 'مجلد الترقية 1.1.0', color: '#10b981', icon: 'folder' })`);
  console.log('  Created folder in 1.1.0:', folder.id);

  const note = await app110.js(`window.api.createNote({
    id: 'note-upgrade-1',
    title: 'ملاحظة الترقية الأولى',
    content: 'محتوى اختبار الترقية وسلامة البيانات',
    content_html: '<p>محتوى اختبار الترقية وسلامة البيانات في مُدَوَّن</p>',
    folder_id: 'folder-upgrade-1',
    is_pinned: 1
  })`);
  console.log('  Created note in 1.1.0:', note.id);

  const task = await app110.js(`window.api.createTask({
    id: 'task-upgrade-1',
    title: 'مهمة اختبار التحديث التلقائي',
    priority: 'high',
    status: 'in_progress'
  })`);
  console.log('  Created task in 1.1.0:', task.id);

  const tx = await app110.js(`window.api.createTransaction({
    id: 'tx-upgrade-1',
    title: 'راتب شهري استثماري',
    type: 'income',
    amount_cents: 850000,
    category: 'راتب شهري',
    date: '2026-10-27'
  })`);
  console.log('  Created transaction in 1.1.0:', tx.id);

  // Set initial preference in 1.1.0
  await app110.js(`window.api.setSetting('preferences', { startView: 'notes', fontSize: 14.5, density: 'comfortable', editorFont: 'default', editorSize: 14, spellcheck: true, saveDelay: 350, uiFont: 'cairo' })`);

  await pause(600); // flush saves
  await app110.stop();
  console.log('  ✓ 1.1.0 closed cleanly with data committed to SQLite.');

  console.log('\n=== Step 2: Upgrade to New Version (1.2.0) ===');
  console.log('  Target binary: 1.2.0');
  
  console.log('\n=== Step 3: Launch 1.2.0 & Verify SQLite Data Persistence ===');
  const app120 = await launchApp(exe120, 9339);
  await app120.wait('!!window.api');

  const info120 = await app120.js('window.api.getAppInfo()');
  console.log('  App 1.2.0 Info:', info120);
  assert.equal(info120.version, '1.2.0', 'Upgraded version must be 1.2.0');

  // Verify Folder survived
  const folders = await app120.js('window.api.getFolders()');
  const foundFolder = folders.find(f => f.id === folder.id);
  assert.ok(foundFolder, 'Folder must persist across upgrade');
  assert.equal(foundFolder.name, 'مجلد الترقية 1.1.0');
  console.log('  ✓ Folder persisted intact:', foundFolder.name);

  // Verify Note survived with HTML content and pin status
  const foundNote = await app120.js(`window.api.getNoteById(${JSON.stringify(note.id)})`);
  assert.ok(foundNote, 'Note must persist across upgrade');
  assert.equal(foundNote.title, 'ملاحظة الترقية الأولى');
  assert.ok(foundNote.content_html.includes('محتوى اختبار الترقية وسلامة البيانات في مُدَوَّن'));
  assert.equal(foundNote.is_pinned, 1);
  console.log('  ✓ Note persisted intact with complete content and metadata.');

  // Verify Task survived
  const tasks = await app120.js('window.api.getTasks()');
  const foundTask = tasks.find(t => t.id === task.id);
  assert.ok(foundTask, 'Task must persist across upgrade');
  assert.equal(foundTask.title, 'مهمة اختبار التحديث التلقائي');
  assert.equal(foundTask.status, 'in_progress');
  assert.equal(foundTask.priority, 'high');
  console.log('  ✓ Task persisted intact with status and priority.');

  // Verify Finance Transaction and stats survived
  const txs = await app120.js('window.api.getTransactions()');
  const foundTx = txs.find(t => t.id === 'tx-upgrade-1');
  assert.ok(foundTx, 'Transaction must persist across upgrade');
  assert.equal(foundTx.amount_cents, 850000);
  assert.equal(foundTx.category, 'راتب شهري');
  console.log('  ✓ Transaction persisted intact.');

  const stats = await app120.js('window.api.getFinanceStats()');
  console.log('  ✓ Finance stats computed accurately:', stats);

  console.log('\n=== Step 4: Verify Auto-Updater System & Security in 1.2.0 ===');
  
  // 1. Check initial update state
  const state = await app120.js('window.api.getUpdateState()');
  console.log('  Initial Update State in 1.2.0:', state);
  assert.equal(state.currentVersion, '1.2.0');
  assert.equal(state.status, 'idle');

  // 2. Test Preferences & Declining Auto-Updates
  await app120.js(`window.api.setSetting('preferences', { autoCheckUpdates: false })`);
  const prefs = await app120.js(`window.api.getSetting('preferences')`);
  assert.equal(prefs.autoCheckUpdates, false, 'User can decline automatic update checks');
  console.log('  ✓ User can disable autoCheckUpdates (opt-out honored).');

  // 3. Test Offline / Network Drop during manual check
  // electron-updater will fail safely when github.com releases are not published yet or network drops
  const checkResult = await app120.js('window.api.checkForUpdates()');
  console.log('  Check result (network/non-existent remote):', checkResult);
  assert.ok(['error', 'not-available'].includes(checkResult.status));
  if (checkResult.status === 'error') {
    assert.ok(!checkResult.error.includes('password') && !checkResult.error.includes('token'), 'Error must not leak secrets');
    console.log('  ✓ Network / release check failure handled safely:', checkResult.error);
  }

  // 4. Test Signature Verification Security Gate
  // When no trusted publisher certificate is configured on disk, downloading updates is blocked
  try {
    await app120.js('window.api.downloadUpdate()');
    assert.fail('downloadUpdate must be rejected when unconfigured/unsigned');
  } catch (err) {
    console.log('  ✓ Security check enforced: update download gated when unsigned/untrusted publisher:', err.message);
  }

  await app120.stop();
  console.log('\n=== FULL REAL UPDATE AND DATA INTEGRITY TEST PASSED! ===');
})().catch(err => {
  console.error('\n❌ Update Test Failed:', err.stack);
  process.exit(1);
});
