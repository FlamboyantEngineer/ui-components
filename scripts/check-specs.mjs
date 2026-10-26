#!/usr/bin/env node
// Validates specs/ against the format in specs/README.md:
//   - unique UIC- requirement IDs with Implementation: and Verification: lines;
//   - every referenced path exists, and a referenced test names the requirement ID;
//   - Hooks tables use the hook contract's names;
//   - every component directory is implemented by some spec;
//   - the reference stylesheet partials (labs/reference/) style every root and slot hook.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const specsDir = join(root, 'specs');

const ID = String.raw`UIC-[A-Z0-9]+(?:-[A-Z0-9]+)*-T?\d+(?:\.\d+)?[a-z]?`;
const HEADING = new RegExp(`^(#{2,3}) (${ID}) - (.+)$`);
const TEST_FILE = /(\.test\.tsx?|\.spec\.ts)$/;
const HOOK_KINDS = new Set(['root', 'slot', 'attribute', 'state', 'property']);
const ROOT_HOOK = /^ui-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLOT_HOOK = /^(ui-[a-z0-9]+(?:-[a-z0-9]+)*)__[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ATTRIBUTE_HOOK = /^data-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PROPERTY_HOOK = /^--ui-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const problems = [];
const ids = new Map();
const implemented = new Set();
const classHooks = new Map();

function backticked(text) {
  return [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

function checkRequirement(file, requirement) {
  const { id, lines } = requirement;
  const implementation = lines.find((line) => line.startsWith('Implementation:'));
  const verification = lines.find((line) => line.startsWith('Verification:'));
  if (!implementation) problems.push(`${file}: ${id} has no Implementation: line`);
  if (!verification) problems.push(`${file}: ${id} has no Verification: line`);
  if (!implementation || !verification) return;

  for (const path of backticked(implementation)) {
    if (!existsSync(join(root, path)))
      problems.push(`${file}: ${id} implementation path ${path} does not exist`);
    const component = path.match(/^src\/components\/([^/]+)/);
    if (component) implemented.add(component[1]);
  }

  const tests = backticked(verification).filter((entry) => !new RegExp(`^${ID}$`).test(entry));
  if (tests.length === 0) problems.push(`${file}: ${id} Verification: names no test file`);
  let named = false;
  for (const path of tests) {
    const full = join(root, path);
    if (!existsSync(full)) {
      problems.push(`${file}: ${id} verification path ${path} does not exist`);
      continue;
    }
    if (!TEST_FILE.test(path)) {
      problems.push(`${file}: ${id} verification path ${path} is not a test file`);
      continue;
    }
    if (readFileSync(full, 'utf8').includes(id)) named = true;
  }
  if (tests.length > 0 && !named) {
    problems.push(`${file}: ${id} is not named by any test it lists in Verification:`);
  }
}

function checkHooks(file, lines) {
  const rows = lines.filter((line) => line.startsWith('|')).slice(2);
  if (rows.length === 0) problems.push(`${file}: ## Hooks has no table rows`);
  const roots = new Set();
  const parsed = rows.map((row) =>
    row
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim()),
  );
  for (const cells of parsed) {
    const [hookCell = '', kind = ''] = cells;
    const hooks = backticked(hookCell);
    if (hooks.length !== 1) {
      problems.push(`${file}: hook row "${hookCell}" must name exactly one backticked hook`);
      continue;
    }
    if (!HOOK_KINDS.has(kind))
      problems.push(`${file}: hook ${hooks[0]} has unknown kind "${kind}"`);
    if (kind === 'root') {
      if (!ROOT_HOOK.test(hooks[0]))
        problems.push(`${file}: root hook ${hooks[0]} must match ui-<component>`);
      roots.add(hooks[0]);
    }
  }
  for (const cells of parsed) {
    const [hookCell = '', kind = ''] = cells;
    const [hook] = backticked(hookCell);
    if (!hook) continue;
    if (kind === 'root' || kind === 'slot') {
      if (classHooks.has(hook))
        problems.push(`${file}: hook ${hook} is also declared in ${classHooks.get(hook)}`);
      classHooks.set(hook, file);
    }
    if (kind === 'slot') {
      const match = hook.match(SLOT_HOOK);
      if (!match) problems.push(`${file}: slot hook ${hook} must match ui-<component>__<slot>`);
      else if (!roots.has(match[1]))
        problems.push(`${file}: slot hook ${hook} has no root ${match[1]} in this table`);
    }
    if ((kind === 'attribute' || kind === 'state') && !ATTRIBUTE_HOOK.test(hook)) {
      problems.push(`${file}: ${kind} hook ${hook} must be a data-* attribute`);
    }
    if (kind === 'property' && !PROPERTY_HOOK.test(hook)) {
      problems.push(`${file}: property hook ${hook} must be a --ui-* custom property`);
    }
  }
}

const specFiles = existsSync(specsDir)
  ? readdirSync(specsDir)
      .filter((name) => name.endsWith('.md') && name !== 'README.md')
      .sort()
  : [];

for (const name of specFiles) {
  const file = `specs/${name}`;
  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*\.md$/.test(name))
    problems.push(`${file}: spec file names are UPPER-KEBAB.md`);
  const lines = readFileSync(join(specsDir, name), 'utf8').split('\n');
  if (!lines[0]?.startsWith('# ')) problems.push(`${file}: first line must be a "# Title" heading`);

  let requirement = null;
  let hooks = null;
  const flush = () => {
    if (requirement) checkRequirement(file, requirement);
    if (hooks) checkHooks(file, hooks);
    requirement = null;
    hooks = null;
  };

  for (const line of lines) {
    if (line.startsWith('#')) {
      flush();
      const match = line.match(HEADING);
      if (match) {
        const [, level, id] = match;
        if (ids.has(id)) problems.push(`${file}: ${id} is also defined in ${ids.get(id)}`);
        ids.set(id, file);
        const isSequence = /-T\d/.test(id);
        if (level === '###' && !isSequence) requirement = { id, lines: [] };
      } else if (/^#{2,3} UIC-/.test(line)) {
        problems.push(
          `${file}: malformed requirement heading "${line}" (expected "### UIC-AREA-1.1 - Title")`,
        );
      } else if (line === '## Hooks') {
        hooks = [];
      }
      continue;
    }
    requirement?.lines.push(line.trim());
    hooks?.push(line.trim());
  }
  flush();
}

const componentsDir = join(root, 'src', 'components');
if (existsSync(componentsDir)) {
  for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !implemented.has(entry.name)) {
      problems.push(
        `src/components/${entry.name} is not the Implementation: of any spec requirement`,
      );
    }
  }
}

const referenceDir = join(root, 'labs', 'reference');
if (existsSync(referenceDir)) {
  const reference = readdirSync(referenceDir)
    .filter((name) => name.endsWith('.css'))
    .map((name) => readFileSync(join(referenceDir, name), 'utf8'))
    .join('\n');
  for (const [hook, file] of classHooks) {
    if (!new RegExp(`\\.${hook}(?![a-z0-9_-])`).test(reference)) {
      problems.push(`labs/reference/ does not style ${hook} (declared in ${file})`);
    }
  }
}

if (problems.length > 0) {
  console.error('Spec problems:');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(
  `${specFiles.length} specs, ${ids.size} IDs and ${classHooks.size} class hooks are consistent.`,
);
