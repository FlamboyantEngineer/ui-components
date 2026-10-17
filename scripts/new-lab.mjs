#!/usr/bin/env node
// Scaffolds a lab and regenerates labs/index.html.
//   npm run new:lab -- <name> --title "Button" --group "Actions and navigation" --description "…"
//   npm run new:lab -- --sync     rewrite every lab page from its metadata, regenerate the index
//                                 and the reference stylesheet's import list

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LAB_GROUPS,
  collectLabs,
  labsDir,
  labSourceDir,
  renderIndex,
  renderLabPage,
  renderReferenceIndex,
} from './lib/labs.mjs';

const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
}

function sync() {
  const labs = collectLabs();
  for (const lab of labs) {
    if (lab.title && lab.group && lab.description) {
      writeFileSync(join(labsDir, `${lab.name}.html`), renderLabPage(lab));
    }
  }
  writeFileSync(join(labsDir, 'index.html'), renderIndex(collectLabs()));
  writeFileSync(join(labsDir, 'reference.css'), renderReferenceIndex());
  console.log(`Synced ${labs.length} lab pages, labs/index.html and labs/reference.css.`);
}

if (args.includes('--sync')) {
  sync();
  process.exit(0);
}

const name = args[0];
const title = option('title');
const group = option('group');
const description = option('description');
if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || !title || !group || !description) {
  console.error(
    'Usage: npm run new:lab -- <kebab-name> --title <title> --group <group> --description <text>',
  );
  console.error(`Groups: ${LAB_GROUPS.join(', ')}`);
  process.exit(2);
}
if (!LAB_GROUPS.includes(group)) {
  console.error(`Unknown group "${group}". Groups: ${LAB_GROUPS.join(', ')}`);
  process.exit(2);
}

const page = join(labsDir, `${name}.html`);
const source = join(labSourceDir, `${name}.lab.tsx`);
if (existsSync(page) || existsSync(source)) {
  console.error(`Lab "${name}" already exists.`);
  process.exit(1);
}

writeFileSync(page, renderLabPage({ name, title, group, description }));
writeFileSync(
  source,
  `import { LabSection, mountLab } from './chrome/index.js';

mountLab(
  <>
    <LabSection title="${title}">
      <p>Render the component here.</p>
    </LabSection>
  </>,
);
`,
);
sync();
console.log(`Created labs/${name}.html and labs/src/${name}.lab.tsx.`);
