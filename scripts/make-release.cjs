#!/usr/bin/env node
// Build a release: generate latest.yml + upload installer to GitHub Releases.
// Run after `npm run build`. Reads version from package.json.

const { execFileSync, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const RELEASE_DIR = path.join(ROOT, 'release');

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const version = pkg.version;

const installerName = `Hajara-Medicals-Setup-${version}.exe`;
const installerPath = path.join(RELEASE_DIR, installerName);
if (!fs.existsSync(installerPath)) {
  console.error(`[release] Installer not found at ${installerPath}`);
  console.error('[release] Run "npm run build" first.');
  process.exit(1);
}

console.log(`[release] Computing sha512 + size for ${installerName}…`);
const buf = fs.readFileSync(installerPath);
const sha512 = crypto.createHash('sha512').update(buf).digest('base64');
const size = buf.length;

const releaseDate = new Date().toISOString();
const yml = [
  `version: ${version}`,
  'files:',
  `  - url: ${installerName}`,
  `    sha512: ${sha512}`,
  `    size: ${size}`,
  `path: ${installerName}`,
  `sha512: ${sha512}`,
  `releaseDate: '${releaseDate}'`,
  '',
].join('\n');

const ymlPath = path.join(RELEASE_DIR, 'latest.yml');
fs.writeFileSync(ymlPath, yml, 'utf-8');
console.log(`[release] Wrote ${ymlPath}`);

const tag = `v${version}`;

function tryGh() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const repo = 'Shafeeq753/hajara-medicals-billing';

if (!tryGh()) {
  console.log('\n[release] gh CLI not available. Manual upload steps:');
  console.log(`  1. Open https://github.com/${repo}/releases/new`);
  console.log(`  2. Tag: ${tag}, Title: ${tag}`);
  console.log(`  3. Drag-drop these files into "Attach binaries":`);
  console.log(`       - ${installerPath}`);
  console.log(`       - ${ymlPath}`);
  console.log(`  4. Publish release.\n`);
  process.exit(0);
}

console.log(`[release] Creating GitHub release ${tag} on ${repo}…`);
try {
  execFileSync('gh', [
    'release', 'create', tag,
    installerPath, ymlPath,
    '--repo', repo,
    '--title', tag,
    '--notes', `Release ${tag}`,
  ], { stdio: 'inherit', cwd: ROOT });
  console.log(`\n[release] Done. Friend's app will fetch this on next launch.`);
} catch (err) {
  console.error('\n[release] gh release create failed.');
  console.error('[release] Most common cause: gh CLI is not authenticated for this repo.');
  console.error(`[release] Fix: run "gh auth login" as the account that owns ${repo}.`);
  console.error('[release] Or upload the two files manually:');
  console.error(`           ${installerPath}`);
  console.error(`           ${ymlPath}`);
  console.error(`         to https://github.com/${repo}/releases/new`);
  process.exit(1);
}
