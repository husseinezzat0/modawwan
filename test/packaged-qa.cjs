const { spawn } = require('node:child_process');
const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict');
const output = path.resolve(process.env.MOD_QA_OUTPUT || 'scratch/production-qa'); fs.mkdirSync(output, { recursive: true });
const data = path.join(output, 'userdata'); const executable = path.resolve(process.env.MOD_QA_EXE || 'release/win-unpacked/Modawwan.exe');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function launch() {
  const environment = { ...process.env }; delete environment.ELECTRON_RUN_AS_NODE;
  const child = spawn(executable, ['--remote-debugging-port=9337', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${data}`], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: environment });
  let logs = ''; child.stdout.on('data', chunk => logs += chunk); child.stderr.on('data', chunk => logs += chunk);
  let target;
  for (let i = 0; i < 100; i++) { try { const pages = await (await fetch('http://127.0.0.1:9337/json/list')).json(); target = pages.find(page => page.type === 'page'); if (target) break; } catch {} await pause(100); }
  if (!target) { child.kill(); throw new Error('No production page: ' + logs.slice(-1000)); }
  const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0; const pending = new Map(); const errors = [];
  socket.onmessage = event => { const value = JSON.parse(event.data); if (value.id) { const task = pending.get(value.id); pending.delete(value.id); if (value.error) task.reject(new Error(value.error.message)); else task.resolve(value.result); } if (value.method === 'Runtime.exceptionThrown') errors.push(value.params.exceptionDetails.exception?.description || value.params.exceptionDetails.text); };
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  await call('Runtime.enable'); await call('Page.enable');
  const js = async expression => { const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
  const wait = async expression => { for (let i = 0; i < 100; i++) { if (await js(expression)) return; await pause(50); } throw new Error('Timed out: ' + expression); };
  const screenshot = async name => { await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))'); await pause(150); const shot = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(shot.data, 'base64')); };
  const stop = async () => { const exited = new Promise(resolve => child.once('exit', resolve)); await js('window.api.closeWindow()'); await Promise.race([exited, pause(8000).then(() => { if (child.exitCode === null) { child.kill(); throw new Error('Close handshake timeout'); } })]); socket.close(); };
  return { js, wait, screenshot, stop, errors, child, logs: () => logs };
}
(async () => {
  const run = await launch(); const { js, wait, screenshot } = run;
  try {
    await wait("!!window.api && !!document.querySelector('.note-content-editable')");
    const info = await js('window.api.getAppInfo()');
    assert.equal(info.version, require('../package.json').version); assert.ok(info.dataPath.toLowerCase().startsWith(data.toLowerCase()), 'Test profile is not isolated');
    const nav = async index => { await js(`document.querySelectorAll('aside nav button')[${index}].click()`); await pause(100); await wait("document.querySelector('main').innerText.trim().length > 0"); };
    const choose = async (selector, index) => { await js(`document.querySelector('${selector}').click()`); await wait("!!document.querySelector('[role=listbox]')"); await js(`document.querySelectorAll('[role=option]')[${index}].click()`); await pause(100); };
    if (process.env.QA_RESUME !== '1') for (const language of ['ar', 'en']) {
      if (await js('document.documentElement.lang') !== language) await js("Array.from(document.querySelectorAll('header button')).find(button => ['EN','عربي'].includes(button.textContent.trim())).click()");
      await wait(`document.documentElement.lang === '${language}'`);
      for (const theme of ['light', 'dark']) {
        await nav(4); await choose('#setting-theme', theme === 'light' ? 0 : 1); await wait(`document.documentElement.dataset.theme === '${theme}'`);
        const key = `${language}-${theme}`;
        for (const [index, name] of [[0, 'notes'], [1, 'tasks'], [2, 'finance'], [3, 'trash'], [4, 'settings']]) {
          await nav(index);
          assert.equal(await js("getComputedStyle(document.querySelector('.app-body')).direction"), language === 'ar' ? 'rtl' : 'ltr');
          const goodLayout = await js(`(() => { const a=document.querySelector('aside').getBoundingClientRect(), m=document.querySelector('main').getBoundingClientRect(); return '${language}'==='ar' ? a.left>=m.right-2 : a.right<=m.left+2; })()`); assert.ok(goodLayout);
          await screenshot(`${key}-${name}`);
          if (index === 1) for (const mode of [language === 'ar' ? 'كانبان' : 'Kanban', language === 'ar' ? 'التقويم' : 'Calendar']) { await js(`Array.from(document.querySelectorAll('main button')).find(button=>button.textContent.includes(${JSON.stringify(mode)})).click()`); await screenshot(`${key}-${mode === 'Calendar' || mode === 'التقويم' ? 'calendar' : 'kanban'}`); }
          if (index === 2) { await js("document.querySelector('[data-new-transaction]').click()"); await wait("!!document.querySelector('[role=dialog]')"); await screenshot(`${key}-dialog`); await js("document.querySelector('[role=dialog] .custom-select-trigger').click()"); await wait("!!document.querySelector('[role=listbox]')"); await screenshot(`${key}-dropdown`); await js("document.querySelector('[role=option]').click()"); await js("document.querySelector('[role=dialog]').parentElement.click()"); }
        }
      }
    }
    await nav(0);
    await js(`(async()=>{if(await window.api.getNoteById('qa-xss')) return; return window.api.createNote({id:'qa-xss', title:'XSS fixture', content_html:'<p>Inert HTML test<img src=x onerror="window.__xss=true"><a href="file:///C:/Windows/win.ini">Blocked file link</a></p>'});})()`);
    await js('location.reload()'); await pause(1000); await wait("!!window.api && !!document.querySelector('aside nav button')"); await nav(0); await wait("!!Array.from(document.querySelectorAll('main *')).find(element=>element.textContent==='XSS fixture')");
    await js("Array.from(document.querySelectorAll('main *')).find(element=>element.textContent==='XSS fixture').click()");
    await wait("document.querySelector('.note-content-editable').textContent.includes('Inert HTML test')");
    assert.equal(await js("!!window.__xss || !!document.querySelector('.note-content-editable img') || !!document.querySelector('.note-content-editable a[href]')"), false);
    await js("document.querySelector('[data-new-note]').click()"); await pause(100);
    await js(`(() => { const input=document.querySelector('main input[type=text]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Packaged close check'); input.dispatchEvent(new Event('input',{bubbles:true})); const editor=document.querySelector('.note-content-editable'); editor.innerHTML='<p>Packaged pending edit</p>'; editor.dispatchEvent(new Event('input',{bubbles:true})); })()`);

    // --- Trash lifecycle: UI create -> delete -> trash view -> restore -> cascade -> confirm dialog -> permanent delete ---
    // Precision: scoped from the exact title node to the nearest ancestor holding the action button
    // (an unrestricted ancestor walk can ascend into the shared list container and click the WRONG card).
    const cardAction = (title, at) => `(() => { const el = Array.from(document.querySelectorAll('main *')).find(x => x.textContent === ${JSON.stringify(title)}); if (!el) throw new Error('Card ${title} not visible'); let node = el, btn = null; while (node && node !== document.body && !btn) { btn = node.querySelector('button[title="${at}"]'); node = node.parentElement; } if (!btn) throw new Error('Card action button not found: ${at}'); btn.click(); })()`;
    const trashState = async () => await js('(async()=>({ trash: (await window.api.getNotes({ is_deleted: 1 })).map(n => n.id), live: (await window.api.getNotes()).map(n => n.id) }))()');
    await nav(0);
    // Wipe leftovers from previous QA runs so the titles below are unique
    await js("(async()=>{ for (const n of [...await window.api.getNotes(), ...await window.api.getNotes({ is_deleted: 1 })]) if (['QA trash item', 'QA trash sub-page'].includes(n.title)) await window.api.deleteNote(n.id, true); })()"); await pause(300);
    // Create the fixture through the UI itself (context owns the render — no reload race)
    await js("document.querySelector('[data-new-note]').click()"); await pause(300);
    await js(`(() => { const input = document.querySelector('main input[type=text]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'QA trash item'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
    await pause(700); // debounced save flush window
    const qaId = await js("(async()=> (await window.api.getNotes()).find(n => n.title === 'QA trash item').id)()");
    await js(cardAction('QA trash item', 'Move to trash')); await pause(400);
    let state = await trashState(); assert.ok(state.trash.includes(qaId) && !state.live.includes(qaId), 'UI delete puts note in trash (soft)');
    await nav(3);
    await wait("document.querySelector('main').innerText.includes('QA trash item')");
    await screenshot('trash-item-listed');
    await js(cardAction('QA trash item', 'Delete permanently')); // first a CANCEL pass
    await wait("!!document.querySelector('[data-confirm-dialog]')");
    await screenshot('trash-confirm-dialog');
    await js("document.querySelector('[data-dialog-cancel]').click()");
    await wait("!document.querySelector('[data-dialog-confirm]')");
    state = await trashState(); assert.ok(state.trash.includes(qaId), 'Dialog cancel keeps note in trash');
    await js(`(() => { const el = Array.from(document.querySelectorAll('main *')).find(x => x.textContent === 'QA trash item'); if (!el) throw new Error('Trash card not visible'); let node = el, btn = null; while (node && node !== document.body && !btn) { btn = Array.from(node.querySelectorAll('button')).find(b => b.textContent.trim() === 'Restore'); node = node.parentElement; } if (!btn) throw new Error('Restore button not found'); btn.click(); })()`); await pause(400);
    state = await trashState(); assert.ok(state.live.includes(qaId) && !state.trash.includes(qaId), 'Restore returns note to live list');
    await nav(0);
    await pause(300);
    // Sub-page cascade: API child under the live parent, then delete the parent via UI
    await js(`(async()=>{ await window.api.createNote({ id: 'qa-sub', title: 'QA trash sub-page', content_html: '<p>child</p>', folder_id: null, parent_id: ${JSON.stringify(qaId)} }); })()`); await pause(400);
    const subId = await js("(async()=> (await window.api.getNotes()).find(n => n.title === 'QA trash sub-page').id)()");
    await js(cardAction('QA trash item', 'Move to trash')); await pause(400);
    state = await trashState(); assert.ok(state.trash.includes(qaId) && state.trash.includes(subId), 'Sub-page cascades to trash with parent');
    await nav(3);
    await wait("document.querySelector('main').innerText.includes('QA trash sub-page')");
    await screenshot('trash-subpage');
    // Confirm path: permanent delete removes the whole subtree
    await js(cardAction('QA trash item', 'Delete permanently'));
    await wait("!!document.querySelector('[data-dialog-confirm]')");
    await js("document.querySelector('[data-dialog-confirm]').click()"); await pause(500);
    state = await trashState(); assert.ok(!state.trash.includes(qaId) && !state.trash.includes(subId), 'Permanent delete removes parent + sub-page');
    await wait("!document.querySelector('main').innerText.includes('QA trash item')");

    // --- Fonts settings: interface font -> Cairo with live data attribute + computed style ---
    await nav(4);
    await choose('#setting-ui-font', 1);
    await wait("document.documentElement.dataset.uiFont === 'cairo'");
    assert.ok((await js("getComputedStyle(document.body).fontFamily"))?.toLowerCase().includes('cairo'), 'UI font Cairo applied');
    await screenshot('font-ui-cairo');
    await choose('#setting-editor-font', 1);
    await wait("(document.querySelector('#setting-editor-font') || {}).textContent?.includes('Cairo')");
    await screenshot('font-editor-cairo');
    const prefsNow = await js('window.api.getSetting("preferences")');
    assert.equal(prefsNow?.uiFont, 'cairo'); assert.equal(prefsNow?.editorFont, 'cairo');
    // Back to system UI font so the app default remains in this profile
    await choose('#setting-ui-font', 0);
    await wait("document.documentElement.dataset.uiFont === 'system'");

    // --- Maximize / restore: layout integrity via live window-state sync ---
    const geometry = "(() => { const a=document.querySelector('aside').getBoundingClientRect(), m=document.querySelector('main').getBoundingClientRect(), t=document.querySelector('header').getBoundingClientRect(); const sideOverlap = !(a.right <= m.left + 0.5 || a.left >= m.right - 0.5); const headOverlap = !(m.top >= t.bottom - 0.5 || m.bottom <= t.top + 0.5); return !sideOverlap && !headOverlap && a.width > 40 && m.width > 200; })()";
    await nav(0);
    assert.ok(await js(geometry), 'layout intact before maximize');
    await js('window.api.maximizeWindow()');
    await wait("document.documentElement.dataset.maximized === 'true'");
    assert.ok(await js(geometry), 'sidebar/main non-overlap while maximized');
    await screenshot('maximized-notes');
    await js('window.api.maximizeWindow()');
    await wait("document.documentElement.dataset.maximized === 'false'");
    assert.ok(await js(geometry), 'layout intact after restore');

    assert.deepEqual(run.errors, []);
    await run.stop();
    const restarted = await launch(); await restarted.wait("!!window.api && !!document.querySelector('.note-content-editable')");
    const saved = await restarted.js("(async()=> (await window.api.getNotes()).find(note=>note.title==='Packaged close check'))()");
    assert.ok(saved?.content_html.includes('Packaged pending edit')); assert.equal(await restarted.js('document.documentElement.lang'), 'en'); assert.equal(await restarted.js('document.documentElement.dataset.theme'), 'dark');
    const prefsAfter = await restarted.js('window.api.getSetting("preferences")');
    assert.equal(prefsAfter?.uiFont, 'system', 'UI font preference persisted across restart');
    assert.equal(prefsAfter?.editorFont, 'cairo', 'Editor font preference persisted across restart');
    assert.ok(await restarted.js("!!document.querySelector('main')"), 'Trash and notes survived restart');
    assert.deepEqual(restarted.errors, []);
    await restarted.stop();
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ passed: true, version:info.version, isolatedDataPath:info.dataPath, rendererErrors:[], matrix:'ar/en × light/dark', tested:['Notes','Tasks','Kanban','Calendar','Finance','Trash lifecycle (delete/restore/cascade/permanent+dialog)','Fonts (ui+editor, persisted)','Maximize/Restore layout','Settings','Dialog','Dropdown','XSS fixture','Close and restart persistence'] },null,2));
    console.log('PACKAGED_QA_PASS', info.version, output);
  } catch(error) { try { await run.screenshot('qa-failure'); } catch {} run.child.kill(); throw error; }
})().catch(error=> { console.error(error.stack); process.exitCode=1; });
