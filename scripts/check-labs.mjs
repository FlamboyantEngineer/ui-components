#!/usr/bin/env node
// Verifies that labs/ is complete: one static page per lab source, canonical page markup,
// an up-to-date index, and a lab covering every component directory.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  LAB_GROUPS,
  collectLabs,
  labsDir,
  labSourceDir,
  listLabPages,
  listLabSources,
  renderIndex,
  renderLabPage,
  root,
} from './lib/labs.mjs';

const problems = [];
const sources = new Set(listLabSources());
const pages = new Set(listLabPages());

for (const name of sources) {
  if (!pages.has(name)) problems.push(`labs/src/${name}.lab.tsx has no labs/${name}.html`);
}
for (const name of pages) {
  if (!sources.has(name)) problems.push(`labs/${name}.html has no labs/src/${name}.lab.tsx`);
}

const labs = collectLabs();
for (const lab of labs) {
  if (!lab.title) problems.push(`labs/${lab.name}.html: missing "<title>… · Labs</title>"`);
  if (!lab.description) problems.push(`labs/${lab.name}.html: missing description meta`);
  if (!LAB_GROUPS.includes(lab.group)) {
    problems.push(
      `labs/${lab.name}.html: lab-group "${lab.group}" is not one of ${LAB_GROUPS.join(', ')}`,
    );
  }
  if (lab.title && lab.description && lab.group && lab.html !== renderLabPage(lab)) {
    problems.push(
      `labs/${lab.name}.html: markup differs from the lab page template (run npm run new:lab -- --sync)`,
    );
  }
}

const index = existsSync(join(labsDir, 'index.html'))
  ? readFileSync(join(labsDir, 'index.html'), 'utf8')
  : '';
if (index !== renderIndex(labs)) {
  problems.push('labs/index.html is out of date (run npm run new:lab -- --sync)');
}

const componentsDir = join(root, 'src', 'components');
const labText = [...sources]
  .map((name) => readFileSync(join(labSourceDir, `${name}.lab.tsx`), 'utf8'))
  .join('\n');
if (existsSync(componentsDir)) {
  for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !labText.includes(`components/${entry.name}/`)) {
      problems.push(`src/components/${entry.name} is not exercised by any lab`);
    }
  }
}

if (problems.length > 0) {
  console.error('Lab problems:');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`${labs.length} labs are complete and indexed.`);
