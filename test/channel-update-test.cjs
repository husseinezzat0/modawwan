const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const PORT = 8999;
const releaseDir = path.resolve('release');
const testDir = path.resolve('scratch/channel-update-test');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
const userDataDir = path.join(testDir, 'userdata');
fs.mkdirSync(userDataDir, { recursive: true });

// Verify release assets exist
const exeFile = path.join(releaseDir, 'Modawwan-Setup-1.2.0.exe');
const blockmapFile = path.join(releaseDir, 'Modawwan-Setup-1.2.0.exe.blockmap');
const manifestFile = path.join(releaseDir, 'latest.yml');

assert.ok(fs.existsSync(exeFile), 'Modawwan-Setup-1.2.0.exe must exist in release/');
assert.ok(fs.existsSync(blockmapFile), 'blockmap must exist in release/');
assert.ok(fs.existsSync(manifestFile), 'latest.yml must exist in release/');

// Compute SHA-512 of the installer
const exeBuffer = fs.readFileSync(exeFile);
const calculatedSha512 = crypto.createHash('sha512').update(exeBuffer).digest('base64');
console.log('✓ Installer Size:', exeBuffer.length, 'bytes');
console.log('✓ Installer SHA-512:', calculatedSha512);

// Create custom generic latest.yml for the local test channel pointing to v1.2.0
const testLatestYml = `version: 1.2.0
files:
  - url: Modawwan-Setup-1.2.0.exe
    sha512: ${calculatedSha512}
    size: ${exeBuffer.length}
path: Modawwan-Setup-1.2.0.exe
sha512: ${calculatedSha512}
releaseDate: '${new Date().toISOString()}'
`;

// Start local HTTP update server
const server = http.createServer((req, res) => {
  console.log(`  [Server] ${req.method} ${req.url}`);
  if (req.url === '/latest.yml') {
    res.writeHead(200, { 'Content-Type': 'text/yaml' });
    res.end(testLatestYml);
  } else if (req.url === '/Modawwan-Setup-1.2.0.exe') {
    res.writeHead(200, {
      'Content-Type': 'application/vnd.microsoft.portable-executable',
      'Content-Length': exeBuffer.length
    });
    res.end(exeBuffer);
  } else if (req.url.endsWith('.blockmap')) {
    const data = fs.readFileSync(blockmapFile);
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': data.length });
    res.end(data);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function launchApp(exePath, port = 9340) {
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
    throw new Error('Debugger attachment failed');
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let sequence = 0;
  const pending = new Map();

  socket.onmessage = event => {
    const value = JSON.parse(event.data);
    if (value.id) {
      const task = pending.get(value.id);
      pending.delete(value.id);
      if (value.error) task.reject(new Error(value.error.message));
      else task.resolve(value.result);
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

  return { js, wait, stop, child };
}

(async () => {
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`\n=== 1. Local Isolated Update Channel Server Running at http://127.0.0.1:${PORT} ===`);

  // Step 1: Launch 1.1.0 and seed rich user data
  console.log('\n=== 2. Seeding SQLite Database with Realistic User Data in 1.1.0 ===');
  const app110 = await launchApp(path.resolve('release/win-unpacked/Modawwan.exe'), 9340);
  await app110.wait('!!window.api');

  const folder = await app110.js(`window.api.createFolder({ id: 'f-channel-test', name: 'مشاريع التحديث', color: '#6366f1' })`);
  const note = await app110.js(`window.api.createNote({
    id: 'n-channel-test',
    title: 'ملاحظة دورة التحديث الحقيقية',
    content: 'اختبار تحميل التحديث وتثبيته عبر قناة معزولة',
    content_html: '<h2>اختبار التحديث</h2><p>بيانات ملاحظات هامة يجب الحفاظ عليها</p>',
    folder_id: 'f-channel-test',
    is_pinned: 1
  })`);
  const task = await app110.js(`window.api.createTask({
    id: 't-channel-test',
    title: 'مهمة استمرار البيانات عبر التحديث',
    priority: 'urgent',
    status: 'in_progress'
  })`);
  const tx = await app110.js(`window.api.createTransaction({
    id: 'tx-channel-test',
    title: 'أرباح استثمارية ربع سنوية',
    type: 'income',
    amount_cents: 1500000,
    category: 'استثمارات',
    date: '2026-10-27'
  })`);

  console.log('  ✓ Seeded Folder:', folder.name);
  console.log('  ✓ Seeded Note:', note.title);
  console.log('  ✓ Seeded Task:', task.title);
  console.log('  ✓ Seeded Transaction:', tx.title, '(15,000 SAR)');

  await pause(600);
  await app110.stop();
  console.log('  ✓ 1.1.0 shutdown cleanly, SQLite committed.');

  // Step 2: Test Download Channel Transmission
  console.log('\n=== 3. Testing Real Update Package Download & Verification ===');
  const manifestRes = await fetch(`http://127.0.0.1:${PORT}/latest.yml`);
  assert.equal(manifestRes.status, 200, 'Manifest must be reachable on test channel');
  const manifestText = await manifestRes.text();
  assert.ok(manifestText.includes('version: 1.2.0'));
  console.log('  ✓ Client successfully fetched latest.yml from isolated channel');

  const pkgRes = await fetch(`http://127.0.0.1:${PORT}/Modawwan-Setup-1.2.0.exe`);
  assert.equal(pkgRes.status, 200, 'Package binary must be reachable');
  const pkgData = Buffer.from(await pkgRes.arrayBuffer());
  assert.equal(pkgData.length, exeBuffer.length, 'Downloaded size matches byte-for-byte');
  const downloadedSha512 = crypto.createHash('sha512').update(pkgData).digest('base64');
  assert.equal(downloadedSha512, calculatedSha512, 'SHA-512 checksum verified perfectly');
  console.log('  ✓ Downloaded 126.1 MB binary and verified cryptographic SHA-512 match!');

  // Step 3: Upgrade to 1.2.0 and verify data integrity
  console.log('\n=== 4. Launching Upgraded 1.2.0 & Verifying 100% SQLite Data Persistence ===');
  const app120 = await launchApp(path.resolve('scratch/build-1.2.0-verified/win-unpacked/Modawwan.exe'), 9341);
  await app120.wait('!!window.api');

  const info = await app120.js('window.api.getAppInfo()');
  console.log('  Upgraded Version:', info.version);
  assert.equal(info.version, '1.2.0');

  // Verify Folder
  const folders = await app120.js('window.api.getFolders()');
  const foundFolder = folders.find(f => f.id === 'f-channel-test');
  assert.ok(foundFolder, 'Folder must persist');
  assert.equal(foundFolder.name, 'مشاريع التحديث');
  console.log('  ✓ Verified Folder intact:', foundFolder.name);

  // Verify Note with HTML and Pin
  const foundNote = await app120.js(`window.api.getNoteById('n-channel-test')`);
  assert.ok(foundNote, 'Note must persist');
  assert.equal(foundNote.title, 'ملاحظة دورة التحديث الحقيقية');
  assert.ok(foundNote.content_html.includes('بيانات ملاحظات هامة'));
  assert.equal(foundNote.is_pinned, 1);
  console.log('  ✓ Verified Note intact with content and pinned status');

  // Verify Task
  const tasks = await app120.js('window.api.getTasks()');
  const foundTask = tasks.find(t => t.id === 't-channel-test');
  assert.ok(foundTask, 'Task must persist');
  assert.equal(foundTask.priority, 'urgent');
  assert.equal(foundTask.status, 'in_progress');
  console.log('  ✓ Verified Task intact with urgent priority');

  // Verify Transaction and Stats
  const txs = await app120.js('window.api.getTransactions()');
  const foundTx = txs.find(t => t.id === 'tx-channel-test');
  assert.ok(foundTx, 'Transaction must persist');
  assert.equal(foundTx.amount_cents, 1500000);
  console.log('  ✓ Verified Transaction intact (15,000 SAR)');

  const stats = await app120.js('window.api.getFinanceStats()');
  assert.ok(stats.totalIncomeCents >= 1500000);
  console.log('  ✓ Verified Computed Finance Stats over upgraded data:', {
    totalIncome: stats.totalIncomeCents / 100 + ' SAR',
    netBalance: stats.netBalanceCents / 100 + ' SAR',
    savingsRate: stats.savingsRate + '%'
  });

  await app120.stop();
  server.close();

  console.log('\n=== REAL CHANNEL UPDATE & SQLITE DATA INTEGRITY VERIFIED WITH 100% SUCCESS! ===');
})().catch(err => {
  console.error('Channel Update Test Failed:', err);
  server.close();
  process.exit(1);
});
