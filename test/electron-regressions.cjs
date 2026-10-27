const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const assert = require('node:assert/strict');

const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'modawwan-reg-'));
app.setPath('userData', tmpDir);
if (!process.env.VITE_DEV_SERVER_URL) {
  process.env.NODE_ENV = 'production';
}

app.on('browser-window-created', (_, win) => {
  win.webContents.once('did-finish-load', async () => {
    try {
      const js = code => win.webContents.executeJavaScript(code, true);
      const pause = ms => new Promise(r => setTimeout(r, ms));
      const wait = async (code, timeoutMs = 10000) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          if (await js(code)) return;
          await pause(50);
        }
        throw new Error('Timeout waiting for: ' + code);
      };

      const toggleLanguage = async targetLang => {
        const current = await js('document.documentElement.lang');
        if (current !== targetLang) {
          await js(`Array.from(document.querySelectorAll('header button')).find(b => ['EN','عربي','AR'].includes(b.textContent.trim()))?.click()`);
          await wait(`document.documentElement.lang === '${targetLang}'`);
          await pause(150);
        }
      };

      await wait("!!document.querySelector('.note-content-editable')");

      // =========================================================================
      // CASE 1: Category selection in Tasks & Finance with Arabic <-> English toggle
      // =========================================================================
      console.log('--- STARTING CASE 1 VERIFICATION ---');

      // 1.A Tasks Category Verification
      await toggleLanguage('ar');
      await js(`document.querySelectorAll('aside nav button')[1].click()`); // Tasks
      await wait("!!document.querySelector('[data-new-task]')");
      await pause(100);

      // Open Tasks Category CustomSelect dropdown
      await js(`document.querySelectorAll('.app-custom-select')[0].click()`);
      await wait("!!document.querySelector('[role=listbox]')");
      // Choose 'عمل' (Work)
      await js(`Array.from(document.querySelectorAll('[role=option]')).find(o => o.innerText.includes('عمل'))?.click()`);
      await wait("!document.querySelector('[role=listbox]')");
      await pause(100);

      // Verify category name is visible as 'عمل' in Arabic and filtered to only 1 task ('تنظيم قائمة المهام الأسبوعية')
      let taskCatAr = await js(`document.querySelectorAll('.app-custom-select')[0].querySelector('.custom-select-value').innerText.trim()`);
      assert.equal(taskCatAr, 'عمل', 'Tasks category value should be "عمل" in Arabic');

      let taskCountAr = await js(`document.querySelectorAll('main .animate-fade-in').length`);
      assert.equal(taskCountAr, 1, 'Only 1 Work task should be displayed in Arabic');
      let taskTitleAr = await js(`document.querySelector('main .animate-fade-in').innerText`);
      assert.ok(taskTitleAr.includes('تنظيم قائمة المهام الأسبوعية'), 'Should show the Work task in Arabic');

      // Toggle Arabic -> English
      await toggleLanguage('en');

      // Verify category name remains visible as 'Work' in English and filtering is intact
      let taskCatEn = await js(`document.querySelectorAll('.app-custom-select')[0].querySelector('.custom-select-value').innerText.trim()`);
      assert.equal(taskCatEn, 'Work', 'Tasks category value should stay visible as "Work" after switching to English');

      let taskCountEn = await js(`document.querySelectorAll('main .animate-fade-in').length`);
      assert.equal(taskCountEn, 1, 'Still only 1 Work task displayed after switching to English');
      let taskTitleEn = await js(`document.querySelector('main .animate-fade-in').innerText`);
      assert.ok(taskTitleEn.includes('تنظيم قائمة المهام الأسبوعية'), 'Should still show the Work task in English');

      // Toggle English -> Arabic
      await toggleLanguage('ar');
      taskCatAr = await js(`document.querySelectorAll('.app-custom-select')[0].querySelector('.custom-select-value').innerText.trim()`);
      assert.equal(taskCatAr, 'عمل', 'Tasks category value should switch back to "عمل" in Arabic');
      taskCountAr = await js(`document.querySelectorAll('main .animate-fade-in').length`);
      assert.equal(taskCountAr, 1, 'Still only 1 Work task displayed after switching back to Arabic');

      console.log('✔ Case 1.A (Tasks Category & Filtering across AR/EN): PASS');

      // 1.B Finance Category Verification
      await js(`document.querySelectorAll('aside nav button')[2].click()`); // Finance
      await wait("!!document.querySelector('[data-new-transaction]')");
      await pause(100);

      // In Finance table filter bar, open Category CustomSelect
      await js(`document.querySelectorAll('.app-custom-select')[0].click()`);
      await wait("!!document.querySelector('[role=listbox]')");
      // Choose 'طعام' (Food)
      await js(`Array.from(document.querySelectorAll('[role=option]')).find(o => o.innerText.includes('طعام'))?.click()`);
      await wait("!document.querySelector('[role=listbox]')");
      await pause(100);

      // Verify category name is visible as 'طعام' and table filtered to only 1 transaction ('مشتريات البقالة الأسبوعية')
      let finCatAr = await js(`document.querySelectorAll('.app-custom-select')[0].querySelector('.custom-select-value').innerText.trim()`);
      assert.equal(finCatAr, 'طعام', 'Finance category value should be "طعام" in Arabic');

      let txRowsAr = await js(`document.querySelectorAll('table tbody tr').length`);
      assert.equal(txRowsAr, 1, 'Only 1 Food transaction should be shown in Arabic');
      let txTextAr = await js(`document.querySelector('table tbody tr').innerText`);
      assert.ok(txTextAr.includes('مشتريات البقالة الأسبوعية'), 'Should show the Food grocery transaction');

      // Toggle Arabic -> English
      await toggleLanguage('en');

      // Verify category name remains visible as 'Food' in English and filtering is intact
      let finCatEn = await js(`document.querySelectorAll('.app-custom-select')[0].querySelector('.custom-select-value').innerText.trim()`);
      assert.equal(finCatEn, 'Food', 'Finance category value should stay visible as "Food" after switching to English');

      let txRowsEn = await js(`document.querySelectorAll('table tbody tr').length`);
      assert.equal(txRowsEn, 1, 'Still only 1 Food transaction shown after switching to English');
      let txTextEn = await js(`document.querySelector('table tbody tr').innerText`);
      assert.ok(txTextEn.includes('مشتريات البقالة الأسبوعية'), 'Should still show the Food transaction');

      // Toggle English -> Arabic
      await toggleLanguage('ar');
      finCatAr = await js(`document.querySelectorAll('.app-custom-select')[0].querySelector('.custom-select-value').innerText.trim()`);
      assert.equal(finCatAr, 'طعام', 'Finance category value should switch back to "طعام" in Arabic');
      txRowsAr = await js(`document.querySelectorAll('table tbody tr').length`);
      assert.equal(txRowsAr, 1, 'Still only 1 Food transaction shown after switching back to Arabic');

      console.log('✔ Case 1.B (Finance Category & Filtering across AR/EN): PASS');
      console.log('>>> CASE 1 PASS <<<');

      // =========================================================================
      // CASE 2: Expand -> Open Shortcuts Modal -> Escape (1st closes modal, 2nd exits Expand)
      // =========================================================================
      console.log('--- STARTING CASE 2 VERIFICATION ---');

      // Navigate to Notes
      await js(`document.querySelectorAll('aside nav button')[0].click()`);
      await wait("!!document.querySelector('.note-content-editable')");
      await pause(100);

      // Verify initial state: Sidebar is visible
      assert.equal(await js("!!document.querySelector('aside')"), true, 'Sidebar must be visible initially');

      // Activate Expand mode (Fullscreen Editor)
      const fullscreenBtnSelector = `[title="${(await js('document.documentElement.lang')) === 'ar' ? 'ملء شاشة المحرر' : 'Fullscreen Editor'}"]`;
      await js(`document.querySelector('${fullscreenBtnSelector}').click()`);
      await wait("!document.querySelector('aside')");
      assert.equal(await js("!document.querySelector('aside')"), true, 'Sidebar should be hidden in Expand mode');

      // Verify Exit Fullscreen button is visible
      const exitFullscreenBtnSelector = `[title="${(await js('document.documentElement.lang')) === 'ar' ? 'الخروج من ملء الشاشة' : 'Exit Fullscreen'}"]`;
      assert.equal(await js(`!!document.querySelector('${exitFullscreenBtnSelector}')`), true, 'Exit Fullscreen button must exist');

      // Open Shortcuts modal
      await js(`Array.from(document.querySelectorAll('header button')).find(b => (b.title && (b.title.includes('Shortcuts') || b.title.includes('اختصارات'))) || b.innerHTML.includes('keyboard'))?.click()`);
      await wait("!!document.querySelector('[role=dialog]')");
      assert.equal(await js("!!document.querySelector('[role=dialog]')"), true, 'Shortcuts modal should be open');
      assert.equal(await js("!document.querySelector('aside')"), true, 'Expand mode should remain active while modal is open');

      // Press Escape (1st time)
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await wait("!document.querySelector('[role=dialog]')");

      // Verify: Modal closed, but Expand is STILL active!
      assert.equal(await js("!!document.querySelector('[role=dialog]')"), false, 'Shortcuts modal must be closed after 1st Escape');
      assert.equal(await js("!document.querySelector('aside')"), true, 'Expand mode must REMAIN active after 1st Escape (sidebar still hidden)');
      assert.equal(await js(`!!document.querySelector('${exitFullscreenBtnSelector}')`), true, 'Exit Fullscreen button must still be present after 1st Escape');
      console.log('✔ Case 2.1 (First Escape closes shortcuts modal only, Expand remains active): PASS');

      // Press Escape (2nd time)
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await wait("!!document.querySelector('aside')");

      // Verify: Exited Expand mode!
      assert.equal(await js("!!document.querySelector('aside')"), true, 'Expand mode must be EXITED after 2nd Escape (sidebar visible again)');
      console.log('✔ Case 2.2 (Second Escape exits Expand mode): PASS');
      console.log('>>> CASE 2 PASS <<<');

      console.log('ELECTRON_REGRESSIONS_PASS: Both Case 1 and Case 2 passed with 100% assertions.');
      app.exit(0);
    } catch (err) {
      console.error('REGRESSION_TEST_FAIL:', err.stack || err);
      app.exit(1);
    }
  });
});

require('../src/main/main.cjs');
