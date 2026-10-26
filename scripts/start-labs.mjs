#!/usr/bin/env node
// Brings the labs up to date, then serves them: installs the dependencies when package-lock.json
// changed since the last install, and builds the labs when one of their sources changed since the
// last build. --dry-run prints those steps without running them or serving.
//   node scripts/start-labs.mjs [--dry-run] [--port 4173] [--host 127.0.0.1] [--dir labs]

import { spawnSync } from 'node:child_process';
import { lstatSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dryRun = process.argv.includes('--dry-run');

// What labs/build is made from. npm rewrites node_modules/.package-lock.json on every install.
const BUILD_SOURCES = [
  'src',
  'labs/src',
  'labs/reference',
  'labs/reference.css',
  'labs/samples',
  'node_modules/.package-lock.json',
  'package.json',
  'tsconfig.json',
  'scripts/build-labs.mjs',
  'scripts/lib/labs.mjs',
];

function stat(path, follow = true) {
  try {
    return follow ? statSync(path) : lstatSync(path);
  } catch {
    return undefined;
  }
}

/** The newest change under a path, 0 when it is missing; a folder changes when an entry is added or removed. */
function lastChange(path) {
  const entry = stat(path);
  if (!entry?.isDirectory()) return entry?.mtimeMs ?? 0;
  return readdirSync(path).reduce(
    (newest, name) => Math.max(newest, lastChange(join(path, name))),
    entry.mtimeMs,
  );
}

function installReason() {
  const installed = stat(join(root, 'node_modules', '.package-lock.json'));
  if (!installed) return 'the dependencies are not installed';
  if (lastChange(join(root, 'package-lock.json')) > installed.mtimeMs)
    return 'package-lock.json changed since the last install';
  return undefined;
}

function buildReason() {
  const built = stat(join(root, 'labs', 'build', 'index.js'));
  if (!built) return 'the labs are not built';
  const source = BUILD_SOURCES.find((path) => lastChange(join(root, path)) > built.mtimeMs);
  return source && `${source} changed since the last build`;
}

function run(reason, args) {
  console.log(`npm ${args.join(' ')}: ${reason}`);
  if (dryRun) return;
  const result = spawnSync('npm', args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const install = installReason();
// A linked node_modules belongs to another checkout, which installs it from its own lockfile.
const linked = stat(join(root, 'node_modules'), false)?.isSymbolicLink() ?? false;
const installing = install && !linked;
if (installing) run(install, ['ci']);
else if (install) console.log(`Not installing (${install}): node_modules links elsewhere.`);

const build = installing ? 'the dependencies were installed' : buildReason();
if (build) run(build, ['run', 'build:labs']);

if (!dryRun) await import('./serve-labs.mjs');
else if (!installing && !build) console.log('The labs are up to date.');
