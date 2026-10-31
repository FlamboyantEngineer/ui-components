#!/usr/bin/env node
// Fails when a public type declaration exposes the library's building blocks (specs/PRIMITIVES.md):
// every .d.ts under dist/, except dist/primitives/, must not import from the primitives directory
// or from React Aria and its companion packages. Also fails when an exported type names a library
// type that no entry point exports (coding guideline N4). Run after `npm run build`.
//   node scripts/check-public-types.mjs                      check all of dist/
//   node scripts/check-public-types.mjs --dir <path>         check another declaration directory
//   node scripts/check-public-types.mjs button menu          check only these components

import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { option, reportProblems, root, walk } from './lib/script.mjs';
import { findUnexportedTypes } from './lib/unexported-types.mjs';

const LEAK =
  /(?:from\s+|import\(\s*)['"]((?:\.{1,2}\/)+(?:\.\.\/)*primitives\/[^'"]*|react-aria(?:-components)?(?:\/[^'"]*)?|react-stately(?:\/[^'"]*)?|@react-(?:aria|stately|types)\/[^'"]*|@internationalized\/[^'"]*)['"]/g;

const args = process.argv.slice(2);
const dirOption = option('dir');
const dir = dirOption === undefined ? join(root, 'dist') : resolve(dirOption);
const components = args.filter((arg) => !arg.startsWith('--') && arg !== dirOption);

if (!existsSync(dir)) {
  console.error(`${relative(root, dir) || dir} does not exist; run npm run build first.`);
  process.exit(1);
}

const problems = [];
const files = walk(dir).filter((path) => {
  const rel = relative(dir, path).split(sep).join('/');
  if (!rel.endsWith('.d.ts') || rel.startsWith('primitives/')) return false;
  return (
    components.length === 0 || components.some((name) => rel.startsWith(`components/${name}/`))
  );
});
for (const path of files) {
  for (const [, source] of readFileSync(path, 'utf8').matchAll(LEAK)) {
    problems.push(`${relative(dir, path)}: exposes '${source}'`);
  }
}

reportProblems(problems, {
  heading: `${problems.length} public declaration(s) expose building blocks`,
  hint: 'Declare library-owned types instead (UIC-PRIMITIVES-2.1).',
  success: `No building block exposed in ${files.length} public declaration files.`,
});

// The entry points package.json exports: the root, `core`, `testing` and every component index.
const entries = walk(dir).filter((path) => {
  const rel = relative(dir, path).split(sep).join('/');
  return /^(index|core\/index|testing\/index|components\/.+\/index)\.d\.ts$/.test(rel);
});
const unexported = findUnexportedTypes(dir, { entries, only: components });
reportProblems(unexported, {
  heading: `${unexported.length} public type(s) name a type no entry point exports`,
  hint: "Export the named type from its component's index.ts (coding guideline N4).",
  success: 'Every type a public type names is exported.',
});
