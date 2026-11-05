// Follows a module's relative imports, for tests that check what an entry point loads.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** Every module a module loads through relative imports, itself included. */
export function collectImports(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file)) return seen;
  seen.add(file);
  const source = readFileSync(file, 'utf8');
  for (const [, path = ''] of source.matchAll(/from '(\.[^']+)\.js'/g)) {
    const base = resolve(dirname(file), path);
    const next = [`${base}.ts`, `${base}.tsx`].find(existsSync);
    if (next) collectImports(next, seen);
  }
  return seen;
}

/** The packages the modules an entry point loads import, statically or on demand, the entry given from the repository root. */
export function collectPackages(entry: string): string[] {
  const files = [...collectImports(join(process.cwd(), entry))];
  return files.flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/(?:from |import\()'([^.'][^']*)'/g)].map(
      ([, name = '']) => name,
    ),
  );
}
