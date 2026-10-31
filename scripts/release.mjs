#!/usr/bin/env node
// Builds and checks the package once, then tags the version in package.json as `v<version>` on a
// release commit: the current commit plus every built file the package exports (`dist/` and the
// reference stylesheet), with a manifest that has no `prepare` script. Installing the tag therefore
// installs no development dependencies and builds nothing. Packs the library tarball, from the tree
// it tagged, and the standalone labs archive for the GitHub Release.
// Run on `main`, up to date with `origin/main`, with a clean tree, after the version bump merged.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REFERENCE_STYLESHEET } from './lib/reference-stylesheet.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const BUILT = ['dist', REFERENCE_STYLESHEET];

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options,
  });
const git = (args, options) => run('git', args, { shell: false, ...options }).trim();
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const manifestText = readFileSync(join(root, 'package.json'), 'utf8');
const { version } = JSON.parse(manifestText);
const tag = `v${version}`;

if (git(['status', '--porcelain', '--untracked-files=no'])) {
  fail('Commit or stash the tracked changes before releasing.');
}
if (git(['rev-parse', '--abbrev-ref', 'HEAD']) !== 'main') fail('Release from the main branch.');
git(['fetch', '--quiet', 'origin', 'main']);
if (git(['rev-parse', 'HEAD']) !== git(['rev-parse', 'origin/main'])) {
  fail('main must match origin/main: pull or push first.');
}
if (git(['tag', '--list', tag])) fail(`${tag} already exists.`);

// One build: the package, then the labs; the checks and both archives use it as built.
for (const script of ['build:package', 'build:labs', 'check:package', 'pack:labs']) {
  run('npm', ['run', script], { stdio: 'inherit' });
}

/** The manifest the tag carries: the same, without the script that would build the package again. */
function releaseManifest() {
  const manifest = JSON.parse(manifestText);
  delete manifest.scripts.prepare;
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

// A separate index adds the ignored build output without touching the working tree's index.
const indexDir = mkdtempSync(join(tmpdir(), 'ui-release-'));
try {
  const env = { ...process.env, GIT_INDEX_FILE: join(indexDir, 'index') };
  git(['read-tree', 'HEAD'], { env });
  git(['add', '--force', '--', ...BUILT], { env });
  const manifestBlob = git(['hash-object', '-w', '--stdin'], { input: releaseManifest() });
  git(['update-index', '--cacheinfo', `100644,${manifestBlob},package.json`], { env });
  const tree = git(['write-tree'], { env });
  const commit = git(['commit-tree', tree, '-p', 'HEAD', '-m', `Release ${tag}`]);
  git(['tag', '--annotate', tag, commit, '--message', tag]);
} finally {
  rmSync(indexDir, { recursive: true, force: true });
}

// Packed as built, from the files the tag holds.
const [pack] = JSON.parse(
  run('npm', ['pack', '--json', '--ignore-scripts', '--foreground-scripts=false']),
);
console.log(
  `Tagged ${tag} on ${git(['rev-parse', '--short', `${tag}^{commit}`])} and packed ${pack.filename}.`,
);
console.log(
  `Publish with: git push origin ${tag}, then attach ${pack.filename} and ui-components-labs-${version}.tgz to the ${tag} GitHub Release.`,
);
