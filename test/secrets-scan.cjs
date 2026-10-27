// Scan both the actual Git index and any different working-tree/untracked content.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const PATTERNS = [
  [/ghp_[A-Za-z0-9]{20,}/, 'GitHub token'],
  [/gh[ousr]_[A-Za-z0-9]{20,}/, 'GitHub token (variant)'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
  [/sk-[A-Za-z0-9]{20,}/, 'OpenAI-style key'],
  [/-----BEGIN (RSA |EC |OPENSSH |PGP |)PRIVATE KEY-----/, 'private key block'],
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, 'JWT token'],
  [/[a-zA-Z0-9+/]{40,}={0,2}['"`]/, 'possible base64 secret literal'],
  [/mongodb(\+srv)?:\/\/[^\s'"]+/, 'MongoDB connection string'],
  [/postgres(s|ql)?:\/\/[^\s'"]*:[^\s'"]*@/, 'Postgres connection string'],
  [/mysql:\/\/[^\s'"]*:[^\s'"]*@/, 'MySQL connection string'],
  [/(api[_-]?key|secret|password|passwd|pwd)\s*[:=]\s*['"`][A-Za-z0-9_\-./+]{12,}['"`]/i, 'hardcoded credential literal'],
  [/bearer [A-Za-z0-9_\-.\=]{20,}/i, 'bearer token literal'],
  [/https?:\/\/[^:\s/]+:[^@\s/]+@/i, 'URL with embedded credentials'],
];
const gitFiles = args => execFileSync('git', args, { cwd: process.cwd() }).toString('utf8').split('\0').filter(Boolean);
const staged = gitFiles(['ls-files', '--cached', '-z']);
const untracked = gitFiles(['ls-files', '--others', '--exclude-standard', '-z']);
const findings = [];
const isBinary = name => /\.(png|ico|exe|jpg|jpeg|gif|woff2?|ttf)$/i.test(name);
function scan(file, text, source) {
  for (const [regex, label] of PATTERNS) {
    // The lockfile has many integrity hashes; all other rules still scan it.
    if (file === 'package-lock.json' && label === 'possible base64 secret literal') continue;
    // Only this heuristic excludes two exact quoted public URLs in this one source file.
    const scanText = file.replace(/\\/g, '/') === 'src/main/main.cjs' && label === 'possible base64 secret literal'
      ? text.replaceAll("'" + ['https:', '', 'github.com', 'husseinezzat0', 'modawwan', 'releases', 'latest'].join('/') + "'", "'[public release page]'")
            .replaceAll("'" + ['https:', '', 'api.github.com', 'repos', 'husseinezzat0', 'modawwan', 'releases', 'latest'].join('/') + "'", "'[public release API]'")
      : text;
    if (scanText.length > 20 && regex.test(scanText)) findings.push(`${source}:${file}: ${label}`);
  }
}
for (const file of staged) {
  if (isBinary(file)) continue;
  const indexText = execFileSync('git', ['show', `:${file}`], { cwd: process.cwd(), maxBuffer: 20 * 1024 * 1024 }).toString('utf8');
  scan(file, indexText, 'index');
  const full = path.join(process.cwd(), file);
  if (fs.existsSync(full)) {
    const workingText = fs.readFileSync(full, 'utf8');
    if (workingText !== indexText) scan(file, workingText, 'working');
  }
}
for (const file of untracked) if (!isBinary(file)) scan(file, fs.readFileSync(path.join(process.cwd(), file), 'utf8'), 'untracked');
if (findings.length) { console.error('SECRET SCAN FINDINGS:'); console.error(findings.join('\n')); process.exit(1); }
console.log(`✓ Secret scan clean — ${staged.length} index files and ${untracked.length} untracked files checked (binary assets reviewed separately).`);