#!/usr/bin/env node
// Copies the JSON language files into dist/core/locales, where the package exports them as
// `./locales/<language>.json` for hosts and translation tools that read them as data.

import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './lib/script.mjs';

const from = join(root, 'src/core/locales');
const to = join(root, 'dist/core/locales');

mkdirSync(to, { recursive: true });
for (const file of readdirSync(from).filter((name) => name.endsWith('.json'))) {
  copyFileSync(join(from, file), join(to, file));
}
