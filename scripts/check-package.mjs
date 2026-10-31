#!/usr/bin/env node
// Checks the installed library independently from the standalone labs archive.
// It packs the tree as built (`npm run build:package`, or `build` and `build:labs` in `npm run
// check`) without running the package scripts, so it never rebuilds files that checks running
// beside it read. Every source map in the tarball must resolve each of its sources to a file the
// tarball ships, or embed it (UIC-LABS-1.5).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REFERENCE_STYLESHEET, referenceStylesheetProblems } from './lib/reference-stylesheet.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const STYLING_DEPENDENCY =
  /^(@heroui\/|tailwind|styled-components$|@emotion\/|@stitches\/|@vanilla-extract\/|goober$|@linaria\/|styled-jsx$|jss$|react-jss$)/;
// Import attributes (`with { type: 'json' }`) need recent toolchains, so the build emits none.
const IMPORT_ATTRIBUTES =
  /\b(?:from\s*['"][^'"]+['"]|import\s*\(\s*['"][^'"]+['"]\s*,)\s*with\s*\{/;
const CSS_IMPORT = /(?:from\s*|import\s*\(?\s*)['"][^'"]+\.(?:css|scss|sass|less)['"]/;

for (const built of ['dist/index.js', REFERENCE_STYLESHEET]) {
  if (!existsSync(join(root, built))) {
    console.error(
      `${built} is missing: run \`npm run build:package\` before checking the package.`,
    );
    process.exit(1);
  }
}

const problems = [];
const workDir = mkdtempSync(join(tmpdir(), 'ui-package-'));

try {
  const output = execFileSync(
    'npm',
    [
      'pack',
      '--json',
      '--ignore-scripts',
      '--foreground-scripts=false',
      '--pack-destination',
      workDir,
    ],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );
  const [pack] = JSON.parse(output);
  const files = new Set(pack.files.map((file) => file.path));

  for (const required of [
    'package.json',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/testing/index.js',
    'dist/testing/index.d.ts',
    REFERENCE_STYLESHEET,
  ]) {
    if (!files.has(required)) problems.push(`tarball is missing ${required}`);
  }
  for (const file of files) {
    if (file.startsWith('labs/') && file !== REFERENCE_STYLESHEET) {
      problems.push(`library tarball must not contain ${file}`);
    }
    if (
      /\.test\.|(^|\/)(src|e2e|test|scripts|labs\/src)\//.test(file) &&
      !file.startsWith('dist/') &&
      !(file.startsWith('src/') && !file.includes('.test.'))
    ) {
      problems.push(`tarball must not contain ${file}`);
    }
    if (/^dist\/.*\.test\./.test(file)) problems.push(`tarball must not contain ${file}`);
    if (file.endsWith('.js') && file.startsWith('dist/')) {
      const text = readFileSync(join(root, file), 'utf8');
      if (CSS_IMPORT.test(text)) problems.push(`${file} imports a stylesheet`);
      if (IMPORT_ATTRIBUTES.test(text)) problems.push(`${file} uses import attributes`);
    }
  }

  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      if (STYLING_DEPENDENCY.test(name)) problems.push(`${field} includes styling package ${name}`);
    }
  }

  const extractDir = join(workDir, 'extract');
  mkdirSync(extractDir);
  execFileSync('tar', ['-xzf', join(workDir, pack.filename), '-C', extractDir]);

  const installed = join(extractDir, 'package');
  if (files.has(REFERENCE_STYLESHEET)) {
    const css = readFileSync(join(installed, REFERENCE_STYLESHEET), 'utf8');
    problems.push(...referenceStylesheetProblems(css));
  }
  let mapSources = 0;
  const unresolved = [];
  for (const file of files) {
    if (!file.endsWith('.map')) continue;
    const map = JSON.parse(readFileSync(join(installed, file), 'utf8'));
    const base = resolve(installed, dirname(file), map.sourceRoot ?? '');
    for (const [index, source] of map.sources.entries()) {
      mapSources += 1;
      const target = resolve(base, source);
      const isShipped = !relative(installed, target).startsWith('..') && existsSync(target);
      if (!isShipped && typeof map.sourcesContent?.[index] !== 'string') {
        unresolved.push(`${file} -> ${source}`);
      }
    }
  }
  if (unresolved.length > 0) {
    problems.push(
      `${unresolved.length} source map references point at sources the tarball neither ships nor embeds, such as ${unresolved.slice(0, 3).join(', ')}`,
    );
  }

  try {
    execFileSync(
      'node',
      [join(root, 'scripts', 'check-references.mjs'), '--dir', join(extractDir, 'package')],
      {
        stdio: 'inherit',
      },
    );
  } catch {
    problems.push('the packed tarball contains host references (see above)');
  }

  if (problems.length === 0) {
    console.log(
      `${pack.filename}: ${files.size} files, ${(pack.size / 1024).toFixed(0)} KiB packed, ${mapSources} source map references resolved.`,
    );
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

if (problems.length > 0) {
  console.error('Package problems:');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
