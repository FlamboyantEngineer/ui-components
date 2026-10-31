#!/usr/bin/env node
// Writes each language file src/core/locales/<language>.json as the module
// src/core/locales/<language>.ts, which the library imports, so the built package needs no JSON
// import attributes. Edit the JSON files, then run:
//   node scripts/generate-locales.mjs
// src/core/locales/index.test.ts fails while a module and its JSON file disagree.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const localesDir = join(root, 'src/core/locales');
const names = new Intl.DisplayNames('en', { type: 'language' });

for (const file of readdirSync(localesDir).filter((name) => name.endsWith('.json'))) {
  const language = basename(file, '.json');
  const messages = JSON.parse(readFileSync(join(localesDir, file), 'utf8'));
  const target = join(localesDir, `${language}.ts`);
  // One line, as the emoji data is: a generated file stays within the line limits, and the
  // annotation keeps every key type-checked against UiMessages.
  const source = [
    `// Generated from ${file} by scripts/generate-locales.mjs. Edit the JSON file, not this one.`,
    `import type { UiMessages } from '../strings.js';`,
    '',
    `/** ${names.of(language)} messages${language === 'en' ? ', the built-in language' : ''}. */`,
    '// prettier-ignore',
    `export const ${language}: UiMessages = ${JSON.stringify(messages)};`,
    '',
  ].join('\n');
  writeFileSync(target, source);
  console.log(`Wrote ${target}`);
}
