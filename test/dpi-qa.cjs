// DPI gate: 125% and 150% scale factors, ar/en, maximize/restore layout integrity.
const { spawn } = require('node:child_process');
const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict');
const output = path.resolve('scratch/production-qa'); fs.mkdirSync(output, { recursive: true });
const pause = ms => new Promise(r => setTimeout(r, ms));
const executable = path.resolve('release/win-unpacked/Modawwan.exe');
async function launch(flag, lang, profile) {
  const child = spawn(executable, ['--remote-debugging-port=9337', '--remote-debugging-address=127.0.0.1', flag, `--user-data-dir=${profile}`], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env } });
  child.stdout.on('data', () => {}); child.stderr.on('data', () => {});
  let target;
  for (let i = 0; i < 100; i++) { try { const pages = await (await fetch('http://127.0.0.1:9337/json/list')).json(); target = pages.find(p => p.type === 'page'); if (target) break; } catch {} await pause(100); }
  if (!target) { child.kill(); throw new Error('No page for ' + flag); }
  const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((res, rej) => { socket.onopen = res; socket.onerror = rej; });
  let seq = 0; const pend = new Map();
  socket.onmessage = e => { const v = JSON.parse(e.data); if (v.id) { const t = pend.get(v.id); pend.delete(v.id); v.error ? t.reject(new Error(v.error.message)) : t.resolve(v.result); } };
  const call = (m, p = {}) => new Promise((res, rej) => { const id = ++seq; pend.set(id, { resolve: res, reject: rej }); socket.send(JSON.stringify({ id, method: m, params: p })); });
  const js = async expression => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
  const wait = async expression => { for (let i = 0; i < 120; i++) { if (await js(expression)) return; await pause(50); } throw new Error('Timed out: ' + expression); };
  const screenshot = async name => { await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))'); await pause(150); const shot = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(shot.data, 'base64')); };
  await pause(1200); await wait('!!window.api');
  if (await js('document.documentElement.lang') !== lang) await js(`Array.from(document.querySelectorAll('header button')).find(b => ['EN','عربي'].includes(b.textContent.trim())).click()`);
  await wait(`document.documentElement.lang === '${lang}'`);
  return { js, wait, screenshot, child, stop: async () => { await js('window.api.closeWindow()'); await pause(600); child.kill(); } };
}
const geometry = "(() => { const a=document.querySelector('aside').getBoundingClientRect(), m=document.querySelector('main').getBoundingClientRect(), t=document.querySelector('header').getBoundingClientRect(); const sideOverlap = !(a.right <= m.left + 0.5 || a.left >= m.right - 0.5); const headOverlap = !(m.top >= t.bottom - 0.5 || m.bottom <= t.top + 0.5); // icons/text must not paint over neighbour panes: all rects must have positive area\n return !sideOverlap && !headOverlap && a.width > 40 && m.width > 200; })()";
(async () => {
  for (const [pct, flag] of [['125', '--force-device-scale-factor=1.25'], ['150', '--force-device-scale-factor=1.5']]) {
    for (const lang of ['en', 'ar']) {
      const profile = path.join(output, `dpi-profile-${pct}`);
      fs.mkdirSync(profile, { recursive: true });
      const app = await launch(flag, lang, profile);
      try {
        const dpr = await app.js('window.devicePixelRatio');
        assert.ok(Math.abs(dpr - Number(pct) / 100) < 0.01, `devicePixelRatio ${pct}% (${lang}) — got ${dpr}`);
        assert.ok(await app.js(geometry), `layout sane at ${pct}% ${lang}`);
        // Overflow sanity: body must not gain horizontal scrollbars at high DPI
        assert.equal(await app.js(`document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`), true, `no horizontal overflow at ${pct}% ${lang}`);
        await app.screenshot(`dpi-${pct}-${lang}-windowed`);
        await app.js('window.api.maximizeWindow()');
        await app.wait("document.documentElement.dataset.maximized === 'true'");
        assert.ok(await app.js(geometry), `layout sane maximized at ${pct}% ${lang}`);
        assert.equal(await app.js(`document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`), true, `no horizontal overflow maximized at ${pct}% ${lang}`);
        await app.screenshot(`dpi-${pct}-${lang}-maximized`);
        await app.js('window.api.maximizeWindow()');
        await app.wait("document.documentElement.dataset.maximized === 'false'");
        assert.ok(await app.js(geometry), `layout sane after restore at ${pct}% ${lang}`);
        console.log(`DPI ${pct}% ${lang}: PASS`);
      } finally { await app.stop(); await pause(800); }
    }
  }
  console.log('DPI_QA_PASS 125/150 x ar/en');
})().catch(error => { console.error('DPI_QA_FAIL', error.message); process.exitCode = 1; });
