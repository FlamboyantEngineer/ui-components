#!/usr/bin/env node
// Bundles every labs/src/<name>.lab.tsx into labs/build/<name>.js (ESM with shared chunks).
//   node scripts/build-labs.mjs [--dev] [--watch]

import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import * as esbuild from 'esbuild';
import { labsDir, labSourceDir, listLabSources } from './lib/labs.mjs';

const outdir = join(labsDir, 'build');
const dev = process.argv.includes('--dev');
const watch = process.argv.includes('--watch');

const labNames = listLabSources();
const entryPoints = {
  index: join(labSourceDir, 'index.entry.ts'),
  reference: join(labsDir, 'reference.css'),
  ...Object.fromEntries(labNames.map((name) => [name, join(labSourceDir, `${name}.lab.tsx`)])),
};
rmSync(outdir, { recursive: true, force: true });

// Files the labs load at runtime, shipped with the bundles so the static labs work offline:
// the PDF engine and its worker with their license, and the sample documents.
const resolvePackage = createRequire(import.meta.url).resolve;
const staticFiles = {
  'vendor/pdf.min.mjs': resolvePackage('pdfjs-dist/build/pdf.min.mjs'),
  'vendor/pdf.worker.min.mjs': resolvePackage('pdfjs-dist/build/pdf.worker.min.mjs'),
  'vendor/LICENSE': resolvePackage('pdfjs-dist/LICENSE'),
  'samples/seasonal-report.pdf': join(labsDir, 'samples', 'seasonal-report.pdf'),
  'samples/seasonal-report-locked.pdf': join(labsDir, 'samples', 'seasonal-report-locked.pdf'),
};
for (const [target, source] of Object.entries(staticFiles)) {
  mkdirSync(dirname(join(outdir, target)), { recursive: true });
  copyFileSync(source, join(outdir, target));
}

const options = {
  entryPoints,
  outdir,
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  minify: !dev,
  sourcemap: dev ? 'linked' : false,
  chunkNames: 'chunks/[name]-[hash]',
  loader: { '.pdf': 'file', '.mjs': 'js' },
  assetNames: 'assets/[name]-[hash]',
  define: { 'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production') },
  legalComments: 'none',
  logLevel: 'info',
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
  console.log(`Watching ${labNames.length} labs.`);
} else {
  await esbuild.build(options);
  console.log(`Built ${labNames.length} labs into labs/build/.`);
}
