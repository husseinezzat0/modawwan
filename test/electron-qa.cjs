const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict');
const out = path.resolve(__dirname, '../scratch/qa-20261026'); fs.mkdirSync(out, { recursive: true });
app.setPath('userData', path.join(out, 'userdata'));
process.env.NODE_ENV = 'development'; process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173/';
const handlers = new Map(); const originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = (channel, handler) => { handlers.set(channel, handler); originalHandle(channel, handler); };
const errors = [];
app.on('browser-window-created', (_, win) => {
  const wc = win.webContents; wc.setBackgroundThrottling(false);
  wc.on('console-message', event => { if (event.level === 'error' || event.level === 3) { errors.push(event.message); console.error('RENDERER:', event.message); } });
  wc.on('render-process-gone', (_, detail) => errors.push(JSON.stringify(detail)));
  wc.once('did-finish-load', () => run(win).catch(async error => { console.error(error.stack); console.error(await wc.executeJavaScript('document.body.innerText.slice(0,800)')); fs.writeFileSync(path.join(out, 'failure.png'), (await wc.capturePage()).toPNG()); app.exit(1); }));
});
async function run(win) {
  const wc = win.webContents;
  const js = code => wc.executeJavaScript(code, true);
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async (code, message) => { for (let i = 0; i < 100; i++) { if (await js(code)) return; await pause(50); } throw new Error(message || code); };
  await wait("!!document.querySelector('.note-content-editable')", 'Editor did not load');
  if (process.env.QA_RESTART === '1') {
    assert.equal(await js("document.documentElement.lang"), 'en');
    assert.equal(await js("document.documentElement.dataset.theme"), 'dark');
    assert.equal(await js("getComputedStyle(document.querySelector('.note-content-editable')).fontSize"), '20px');
    const note = await js("(async () => (await window.api.getNotes()).find(note => note.title === 'Close persistence check'))()");
    assert.ok(note?.content_html.includes('Pending on close'));
    console.log('RESTART_PERSISTENCE_PASS'); app.exit(0); return;
  }
  const prefs = wc.getLastWebPreferences(); assert.equal(prefs.sandbox, true); assert.equal(prefs.contextIsolation, true); assert.equal(prefs.nodeIntegration, false);
  assert.throws(() => handlers.get('db:getFolders')({ sender: wc, senderFrame: {} }), /Untrusted/);
  assert.throws(() => handlers.get('db:getFolders')({ sender: {}, senderFrame: wc.mainFrame }), /Untrusted/);
  await js(`window.__qaErrors = []; addEventListener('error', e => window.__qaErrors.push(e.message)); addEventListener('unhandledrejection', e => window.__qaErrors.push(String(e.reason)));`);
  assert.equal(await js(`(async () => { try { await window.api.updateNote('n-welcome', { unexpected: 'value' }); return false; } catch { return true; } })()`), true);
  const xss = await js(`(async () => { const {sanitizeHtml} = await import('/src/utils/sanitizeHtml.ts'); const clean = sanitizeHtml('<p onclick="alert(1)">Text<img src=x onerror=alert(1)><svg onload=alert(1)></svg><a href="javascript:alert(1)">link</a><iframe srcdoc="bad"></iframe><span style="background-image:url(https://evil.invalid)">safe</span></p>'); return !/onclick|onerror|onload|javascript:|iframe|url\\(/i.test(clean) && clean.includes('Text'); })()`);
  assert.equal(xss, true, 'HTML allowlist');
  const nav = async index => { await js(`document.querySelectorAll('aside nav button')[${index}].click()`); await pause(120); await wait("document.querySelector('main').innerText.trim().length > 0", 'Blank page'); };
  const shot = async name => { await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))'); await pause(150); fs.writeFileSync(path.join(out, `${name}.png`), (await wc.capturePage()).toPNG()); };
  const choose = async (selector, key = 'ArrowDown') => {
    await js(`document.querySelector(${JSON.stringify(selector)}).click()`);
    await wait("!!document.querySelector('[role=listbox]')", 'Select popup');
    for (const code of (key === 'Dark' ? ['Home', 'ArrowDown'] : [key])) { await wc.sendInputEvent({ type: 'keyDown', keyCode: code.replace('Arrow', '') }); await wc.sendInputEvent({ type: 'keyUp', keyCode: code.replace('Arrow', '') }); await pause(80); }
    await wc.sendInputEvent({ type: 'keyDown', keyCode: 'Return' }); await wc.sendInputEvent({ type: 'keyUp', keyCode: 'Return' }); await pause(120);
  };
  for (const language of ['ar', 'en']) {
    // Use the actual language switch and verify the persisted value.
    if (await js('document.documentElement.lang') !== language) {
      await js(`Array.from(document.querySelectorAll('header button')).find(button => ['EN','عربي','AR'].includes(button.textContent.trim()))?.click()`);
      await wait(`document.documentElement.lang === '${language}'`, 'Language toggle failed');
    }
    assert.equal(await js("window.api.getSetting('language', document.documentElement.lang)"), language);
    for (const theme of ['light', 'dark']) {
      await nav(4); await choose('#setting-theme', theme === 'light' ? 'Home' : 'Dark');
      await wait(`document.documentElement.dataset.theme === '${theme}'`, 'Theme selection failed');
      assert.equal(await js("window.api.getSetting('theme')"), theme);
      const key = `${language}-${theme}`;
      for (const [index, name] of [[0, 'notes'], [1, 'tasks'], [2, 'finance'], [3, 'trash'], [4, 'settings']]) {
        await nav(index);
        const layout = await js(`(() => { const sidebar = document.querySelector('aside').getBoundingClientRect(); const main = document.querySelector('main').getBoundingClientRect(); return { sidebarLeft: sidebar.left, sidebarRight: sidebar.right, mainLeft: main.left, mainRight: main.right, direction: getComputedStyle(document.querySelector('.app-body')).direction, overflow: document.documentElement.scrollWidth > innerWidth }; })()`);
        assert.equal(layout.direction, language === 'ar' ? 'rtl' : 'ltr'); assert.equal(layout.overflow, false);
        assert.ok(language === 'ar' ? layout.sidebarLeft >= layout.mainRight - 2 : layout.sidebarRight <= layout.mainLeft + 2, `${key} sidebar position`);
        assert.equal(await js("!!document.querySelector('aside')?.innerText.includes('SQLite')"), false);
        await shot(`${key}-${name}`);
        if (index === 0) {
          await js("document.querySelector('[data-folder-menu-trigger]').click()");
          await wait("!!document.querySelector('[data-folder-menu]')", 'Context menu failed');
          await shot(`${key}-context-menu`);
          await wc.sendInputEvent({type:'keyDown',keyCode:'Escape'}); await wc.sendInputEvent({type:'keyUp',keyCode:'Escape'});
          await wait("!document.querySelector('[data-folder-menu]')", 'Context Escape');

          assert.equal(await js("!!document.querySelector('[data-save-status]')"), false, 'Permanent save badge');
          const beforeIds = await js('(async () => (await window.api.getNotes()).map(note => note.id))()');
          await js(`document.querySelector('[data-new-note]').click()`); await pause(100);
          const noteId = await js(`(async () => (await window.api.getNotes()).find(note => !${JSON.stringify(beforeIds)}.includes(note.id)).id)()`);
          // Rapid changes to two fields must both reach storage.
          await js(`(() => { const input = document.querySelector('input[placeholder]') && document.querySelector('main input[type=text]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'QA ${key}'); input.dispatchEvent(new Event('input', {bubbles:true})); const editor = document.querySelector('.note-content-editable'); editor.innerHTML = '<p>Saved ${key}</p>'; editor.dispatchEvent(new Event('input', {bubbles:true})); })()`);
          await wait(`(async () => { const note = await window.api.getNoteById('${noteId}'); return note?.title === 'QA ${key}' && note.content_html.includes('Saved ${key}'); })()`, 'Merged autosave fields');
          await wait("!document.querySelector('[data-save-status]')", 'Success badge did not expire');
        }
        if (index === 1 || index === 2) {
          await js(`document.querySelector('${index === 1 ? '[data-new-task]' : '[data-new-transaction]'}').click()`);
          await wait("!!document.querySelector('[role=dialog]')", 'Dialog failed');
          assert.equal(await js("getComputedStyle(document.querySelector('[role=dialog]')).direction"), language === 'ar' ? 'rtl' : 'ltr');
          await shot(`${key}-${index === 1 ? 'task' : 'transaction'}-dialog`);
          await js("document.querySelector('[role=dialog] button[role=combobox]').click()");
          await wait("!!document.querySelector('[role=listbox]')");
          await shot(`${key}-dialog-dropdown-${index}`);
          if (await js("!!document.querySelector('.custom-select-search')")) {
            await js(`(() => {const input=document.querySelector('.custom-select-search'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'zzzz-no-match'); input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
            assert.equal(await js("document.querySelectorAll('[role=option]').length"), 0);
          }
          await wc.sendInputEvent({type:'keyDown',keyCode:'Escape'}); await wc.sendInputEvent({type:'keyUp',keyCode:'Escape'});
          assert.equal(await js("!!document.querySelector('[role=dialog]')"), true, 'Escape from select closed dialog');
          await wc.sendInputEvent({type:'keyDown',keyCode:'Escape'}); await wc.sendInputEvent({type:'keyUp',keyCode:'Escape'});
          await wait("!document.querySelector('[role=dialog]')", 'Escape did not close dialog');
        }
        if (index === 1) {
          for (const [mode, label] of [['kanban', language === 'ar' ? 'كانبان' : 'Kanban'], ['calendar', language === 'ar' ? 'التقويم' : 'Calendar']]) {
            const found = await js(`(() => { const button = Array.from(document.querySelectorAll('main button')).find(button => button.textContent.includes(${JSON.stringify(label)})); if (!button) return false; button.click(); return true; })()`);
            if (!found) throw new Error(`Task mode missing: ${label}`);
            await shot(`${key}-${mode}`);
          }
        }
        if (index === 4) {
          await js("document.querySelector('#setting-start').click()"); await wait("!!document.querySelector('[role=listbox]')"); await shot(`${key}-dropdown`);
          const bounds = await js(`(() => { const r = document.querySelector('.custom-select-popup').getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })()`); assert.equal(bounds, true);
          await wc.sendInputEvent({type:'keyDown',keyCode:'Escape'}); await wc.sendInputEvent({type:'keyUp',keyCode:'Escape'});
        }
      }
    }
  }
  assert.deepEqual(await js('window.__qaErrors'), []);
  // Deliberately rejected IPC is logged by Electron; all other runtime errors fail QA.
  const unexpected = errors.filter(error => !error.includes('Invalid input') && !error.includes('Content Security Policy'));
  assert.deepEqual(unexpected, []);
  await nav(4);
  await choose('#setting-editor-size', 'End');
  await wait("(async () => (await window.api.getSetting('preferences')).editorSize === 20)()", 'Editor preference did not persist');
  // Move one existing trigger to the viewport edge to exercise upward placement.
  await js("document.querySelector('#setting-start').style.cssText='position:fixed;bottom:4px;left:10px;width:200px;z-index:9999'");
  await js("document.querySelector('#setting-start').click()"); await wait("!!document.querySelector('[role=listbox]')");
  assert.equal(await js("document.querySelector('.custom-select-popup').getBoundingClientRect().bottom <= document.querySelector('#setting-start').getBoundingClientRect().top"), true, 'Popup did not flip upward');
  await wc.sendInputEvent({type:'keyDown',keyCode:'Escape'}); await wc.sendInputEvent({type:'keyUp',keyCode:'Escape'});
  await js("document.querySelector('#setting-start').style.cssText=''");
  await nav(0); await js("document.querySelector('[data-new-note]').click()"); await pause(100);
  await js(`(() => { const input=document.querySelector('main input[type=text]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Close persistence check'); input.dispatchEvent(new Event('input',{bubbles:true})); const editor=document.querySelector('.note-content-editable'); editor.innerHTML='<p>Pending on close</p>'; editor.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ passed: true, cases: 'Arabic/English × light/dark: notes, tasks, kanban, calendar, finance, settings, dropdowns, dialogs, context menus, autosave, sandbox, IPC, sanitizer, upward popup placement', errors: unexpected }, null, 2));
  console.log('QA_PASS', out); win.close();

}
require('../src/main/main.cjs');
setTimeout(() => { console.error('QA timeout'); app.exit(1); }, 180000);
