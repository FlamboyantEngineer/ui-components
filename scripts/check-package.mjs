#!/usr/bin/env node
// Checks the installed library independently from the standalone labs archive.
// Packing runs prepare to build the entry points from source.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const STYLING_DEPENDENCY =
  /^(@heroui\/|tailwind|styled-components$|@emotion\/|@stitches\/|@vanilla-extract\/|goober$|@linaria\/|styled-jsx$|jss$|react-jss$)/;
const CSS_IMPORT = /(?:from\s*|import\s*\(?\s*)['"][^'"]+\.(?:css|scss|sass|less)['"]/;

const problems = [];
const workDir = mkdtempSync(join(tmpdir(), 'ui-package-'));

try {
  const output = execFileSync(
    'npm',
    ['pack', '--json', '--foreground-scripts=false', '--pack-destination', workDir],
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
  ]) {
    if (!files.has(required)) problems.push(`tarball is missing ${required}`);
  }
  for (const file of files) {
    if (file.startsWith('labs/')) problems.push(`library tarball must not contain ${file}`);
    if (
      /\.test\.|(^|\/)(src|e2e|test|scripts|labs\/src)\//.test(file) &&
      !file.startsWith('dist/')
    ) {
      problems.push(`tarball must not contain ${file}`);
    }
    if (/^dist\/.*\.test\./.test(file)) problems.push(`tarball must not contain ${file}`);
    if (file.endsWith('.js') && file.startsWith('dist/')) {
      const text = readFileSync(join(root, file), 'utf8');
      if (CSS_IMPORT.test(text)) problems.push(`${file} imports a stylesheet`);
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
      `${pack.filename}: ${files.size} files, ${(pack.size / 1024).toFixed(0)} KiB packed.`,
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
