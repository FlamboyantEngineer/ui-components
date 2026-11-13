// Follows a module's relative imports, for tests that check what an entry point loads.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const modules = new Map<string, { imports: string[]; packages: string[] }>();

/** Import-boundary fixtures are immutable, so each source is read once for the entry matrix. */
function readModule(file: string) {
  const absolute = resolve(file);
  const cached = modules.get(absolute);
  if (cached) return cached;
  const source = readFileSync(absolute, 'utf8');
  const imports = [...source.matchAll(/from '(\.[^']+)\.js'/g)].flatMap(([, path = '']) => {
    const base = resolve(dirname(absolute), path);
    const next = [`${base}.ts`, `${base}.tsx`].find(existsSync);
    return next ? [next] : [];
  });
  const packages = [...source.matchAll(/(?:from |import\()'([^.'][^']*)'/g)].map(
    ([, name = '']) => name,
  );
  const entry = { imports, packages };
  modules.set(absolute, entry);
  return entry;
}

/** Every module a module loads through relative imports, itself included. */
export function collectImports(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const next of readModule(file).imports) collectImports(next, seen);
  return seen;
}

/** The packages the modules an entry point loads import, statically or on demand, the entry given from the repository root. */
export function collectPackages(entry: string): string[] {
  const files = [...collectImports(join(process.cwd(), entry))];
  return files.flatMap((file) => readModule(file).packages);
}
