#!/usr/bin/env node
// Fails when a public type declaration exposes the library's building blocks (specs/PRIMITIVES.md):
// every .d.ts under dist/, except dist/primitives/, must not import from the primitives directory
// or from React Aria and its companion packages. Run after `npm run build`.
//   node scripts/check-public-types.mjs                      check all of dist/
//   node scripts/check-public-types.mjs --dir <path>         check another declaration directory
//   node scripts/check-public-types.mjs button menu          check only these components

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const LEAK =
  /(?:from\s+|import\(\s*)['"]((?:\.{1,2}\/)+(?:\.\.\/)*primitives\/[^'"]*|react-aria(?:-components)?(?:\/[^'"]*)?|react-stately(?:\/[^'"]*)?|@react-(?:aria|stately|types)\/[^'"]*|@internationalized\/[^'"]*)['"]/g;

const args = process.argv.slice(2);
const dirIndex = args.indexOf('--dir');
const dir = dirIndex === -1 ? join(root, 'dist') : resolve(args[dirIndex + 1]);
const components = args.filter(
  (arg, index) => !arg.startsWith('--') && (dirIndex === -1 || index !== dirIndex + 1),
);

function walk(path) {
  return readdirSync(path).flatMap((name) => {
    const full = join(path, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

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

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(
    `\n${problems.length} public declaration(s) expose building blocks; declare library-owned types instead (UIC-PRIMITIVES-2.1).`,
  );
  process.exit(1);
}
console.log(`No building block exposed in ${files.length} public declaration files.`);
