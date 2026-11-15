// This repository's root, the directory that holds `scripts/`, whatever the working directory. The
// shared checks in tooling/ run from other repositories too, so they take the working directory.

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
