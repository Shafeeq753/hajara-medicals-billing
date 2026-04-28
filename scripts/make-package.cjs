#!/usr/bin/env node
// Run @electron/packager via its JS API to avoid Windows shell-escape issues
// with regex flags when invoked from npm.

const path = require('node:path');
const { packager } = require('@electron/packager');

const ROOT = path.join(__dirname, '..');

(async () => {
  const opts = {
    dir: ROOT,
    name: 'Hajara Medicals',
    platform: 'win32',
    arch: 'x64',
    out: path.join(ROOT, 'release'),
    overwrite: true,
    asar: true,
    appVersion: '1.0.0',
    ignore: [
      /^[\\/]release(?:[\\/]|$)/,
      /^[\\/]\.git(?:[\\/]|$)/,
      /^[\\/]data[\\/]mockData\.ts$/,
      /^[\\/]\.env\.local$/,
      /^[\\/]scripts(?:[\\/]|$)/,
      /^[\\/]installer\.nsi$/,
    ],
  };

  console.log('[package] Packaging Hajara Medicals (win32/x64)…');
  const out = await packager(opts);
  console.log('[package] Wrote:', out.join(', '));
})().catch(err => {
  console.error('[package] Failed:', err);
  process.exit(1);
});
