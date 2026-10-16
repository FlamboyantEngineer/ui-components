#!/usr/bin/env node
// Bundles every labs/src/<name>.lab.tsx into labs/build/<name>.js (ESM with shared chunks).
//   node scripts/build-labs.mjs [--dev] [--watch]

import { rmSync } from 'node:fs';
import { join } from 'node:path';
import * as esbuild from 'esbuild';
import { labsDir, labSourceDir, listLabSources } from './lib/labs.mjs';

const outdir = join(labsDir, 'build');
const dev = process.argv.includes('--dev');
const watch = process.argv.includes('--watch');

const entryPoints = {
  index: join(labSourceDir, 'index.entry.ts'),
  ...Object.fromEntries(
    listLabSources().map((name) => [name, join(labSourceDir, `${name}.lab.tsx`)]),
  ),
};
rmSync(outdir, { recursive: true, force: true });

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
  console.log(`Watching ${Object.keys(entryPoints).length - 1} labs.`);
} else {
  await esbuild.build(options);
  console.log(`Built ${Object.keys(entryPoints).length - 1} labs into labs/build/.`);
}
