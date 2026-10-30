#!/usr/bin/env node
// Builds and checks the package, then tags the version in package.json as `v<version>` on a
// release commit: the current commit plus the built `dist/`, so a git install
// of the tag needs no build. Also packs the library and standalone labs archives for the GitHub Release.
// Run on an up-to-date `main` with a clean tree, after the version bump has merged.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const BUILT = ['dist'];

const run = (command, args, options = {}) =>
  execFileSync(command, args, { cwd: root, encoding: 'utf8', ...options });
const git = (args, options) => run('git', args, options).trim();
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const tag = `v${version}`;

if (git(['status', '--porcelain', '--untracked-files=no'])) {
  fail('Commit or stash the tracked changes before releasing.');
}
if (git(['tag', '--list', tag])) fail(`${tag} already exists.`);

for (const script of ['build', 'build:labs', 'check:package', 'pack:labs']) {
  run('npm', ['run', script], { stdio: 'inherit' });
}

// A separate index adds the ignored build output without touching the working tree's index.
const indexDir = mkdtempSync(join(tmpdir(), 'ui-release-'));
try {
  const env = { ...process.env, GIT_INDEX_FILE: join(indexDir, 'index') };
  git(['read-tree', 'HEAD'], { env });
  git(['add', '--force', '--', ...BUILT], { env });
  const tree = git(['write-tree'], { env });
  const commit = git(['commit-tree', tree, '-p', 'HEAD', '-m', `Release ${tag}`]);
  git(['tag', '--annotate', tag, commit, '--message', tag]);
} finally {
  rmSync(indexDir, { recursive: true, force: true });
}

const [pack] = JSON.parse(run('npm', ['pack', '--json', '--foreground-scripts=false']));
console.log(
  `Tagged ${tag} on ${git(['rev-parse', '--short', `${tag}^{commit}`])} and packed ${pack.filename}.`,
);
console.log(
  `Publish with: git push origin ${tag}, then attach ${pack.filename} and ui-components-labs-${version}.tgz to the ${tag} GitHub Release.`,
);
