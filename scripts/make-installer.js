#!/usr/bin/env node
// Compile installer.nsi with NSIS into a Windows installer .exe.
// Falls back gracefully if NSIS isn't installed.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const candidates = [
  'C:\\Program Files (x86)\\NSIS\\makensis.exe',
  'C:\\Program Files\\NSIS\\makensis.exe',
];

const makensis = candidates.find(p => fs.existsSync(p));

if (!makensis) {
  console.error('\n[installer] makensis.exe not found.');
  console.error('[installer] Install NSIS to produce a Windows installer:');
  console.error('             winget install NSIS.NSIS');
  console.error('             then re-run "npm run installer".\n');
  console.error('[installer] The portable folder at release/Hajara Medicals-win32-x64/ is still usable.');
  process.exit(1);
}

const script = path.join(__dirname, '..', 'installer.nsi');
console.log(`[installer] Compiling ${script} with ${makensis}`);
execFileSync(makensis, ['/V2', script], { stdio: 'inherit', cwd: path.join(__dirname, '..') });
console.log('[installer] Done. Output in release/');
