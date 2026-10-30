#!/usr/bin/env node
// Packages and verifies the standalone labs after npm run build:labs.
// Usage: node scripts/pack-labs.mjs [output-directory]
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { labsDir, listLabPages, root } from './lib/labs.mjs';

const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const destination = resolve(process.argv[2] ?? root);
const filename = `ui-components-labs-${version}.tgz`;
const required = [
  'index.html',
  'reference.css',
  'reference/base.css',
  'build/index.js',
  'build/boot.js',
  'build/reference.css',
  'build/vendor/pdf.min.mjs',
  'build/vendor/pdf.worker.min.mjs',
  'build/vendor/LICENSE',
  'build/samples/seasonal-report.pdf',
  'build/samples/seasonal-report-locked.pdf',
  ...listLabPages().flatMap((name) => [`${name}.html`, `build/${name}.js`]),
];
for (const file of required) {
  if (!existsSync(join(labsDir, file)))
    throw new Error(`Missing labs/${file}; run npm run build:labs.`);
}
const entries = [
  ...readdirSync(labsDir).filter((file) => /\.(html|css)$/.test(file)),
  'reference',
  'build',
].map((file) => `labs/${file}`);
const workDir = mkdtempSync(join(tmpdir(), 'ui-labs-package-'));
mkdirSync(destination, { recursive: true });
try {
  const archive = join(workDir, filename);
  execFileSync('tar', ['-czf', archive, '-C', root, ...entries]);
  const extract = join(workDir, 'extract');
  mkdirSync(extract);
  execFileSync('tar', ['-xzf', archive, '-C', extract]);
  for (const file of required) {
    if (statSync(join(extract, 'labs', file)).size === 0) throw new Error(`Empty labs/${file}`);
  }
  execFileSync('node', [join(root, 'scripts/check-references.mjs'), '--dir', extract], {
    stdio: 'inherit',
  });
  // Publish only after the extracted archive passes all checks.
  copyFileSync(archive, join(destination, filename));
  console.log(
    `${filename}: ${listLabPages().length} labs, ${(statSync(archive).size / 1024).toFixed(0)} KiB packed.`,
  );
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
