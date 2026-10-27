const { spawn } = require('node:child_process'); const path = require('node:path');
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
const file = path.resolve(process.argv[2] || 'test/electron-qa.cjs');
function run(restart = false) {
  const child = spawn(require('electron'), [file], { env: { ...env, ...(restart ? { QA_RESTART:'1' } : {}) }, windowsHide:true, stdio:'inherit' });
  child.on('exit', code => { if (!code && !restart) run(true); else process.exitCode=code; });
  child.on('error', error => { console.error(error); process.exitCode=1; });
}
run();
