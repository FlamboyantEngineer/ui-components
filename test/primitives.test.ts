// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import * as primitives from '../src/primitives/index.js';
import { requireDefined } from '../src/utils/require-defined.js';

const root = process.cwd();
const primitivesDir = join(root, 'src', 'primitives');
const ARIA_SOURCE =
  /from\s+'(react-aria(?:-components)?(?:\/[^']*)?|react-stately(?:\/[^']*)?|@react-(?:aria|stately|types)\/[^']*|@internationalized\/[^']*)'/;
const PRIMITIVES_IMPORT =
  /(?:import|export)\s+(?:type\s+)?\{([^}]*)\}\s*from\s+'[./]*(?:src\/)?primitives\/index\.js'/g;
const AREA_EXPORT = /export\s+(type\s+)?\{([^}]*)\}\s*from\s+'([^']+)';/g;
const AREA_FUNCTION = /^export function (\w+)/gm;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function sourceFiles() {
  return ['src', 'labs/src', 'test']
    .flatMap((dir) => walk(join(root, dir)))
    .filter((path) => /\.tsx?$/.test(path) && !path.startsWith(primitivesDir));
}

function names(list: string) {
  return list
    .split(',')
    .map((part) => part.trim().replace(/^type\s+/, ''))
    .filter(Boolean)
    .map((part) => requireDefined(part.split(/\s+as\s+/)[0]));
}

function areaExports() {
  const exported = new Map<string, { area: string; isType: boolean }>();
  const areas = readdirSync(primitivesDir).filter((name) => name !== 'index.ts');
  for (const area of areas) {
    const text = readFileSync(join(primitivesDir, area), 'utf8');
    for (const [, isType, list = ''] of text.matchAll(AREA_EXPORT)) {
      for (const name of names(list)) {
        expect(exported.has(name), `${name} is exported by two areas`).toBe(false);
        exported.set(name, { area, isType: Boolean(isType) });
      }
    }
    for (const [, name = ''] of text.matchAll(AREA_FUNCTION)) {
      exported.set(name, { area, isType: false });
    }
  }
  return { areas, exported };
}

// Probe files are not on disk, so the type-aware rules, which need the TypeScript program, are off.
const eslint = new ESLint({ cwd: root, overrideConfig: tseslint.configs.disableTypeChecked });
// Built from parts so the repository scan below does not match this file.
const probe = `import { Button } from '${'react-aria'}-components';\nexport const Probe = Button;\n`;

const primitivesProbe = `import { Button } from '../../src/${'primitives'}/index.js';\nexport const Probe = Button;\n`;

async function isRejected(filePath: string, text = probe) {
  const [result] = await eslint.lintText(text, { filePath });
  return (result?.messages ?? []).some((message) => message.ruleId === 'no-restricted-imports');
}

// Loading the ESLint config and TypeScript parser is slow on a busy machine.
describe('primitives boundary', { timeout: 30_000 }, () => {
  it('UIC-PRIMITIVES-1.1 rejects React Aria imports outside src/primitives', async () => {
    expect(await isRejected('src/components/probe/probe.tsx')).toBe(true);
    expect(await isRejected('src/components/probe/probe.test.tsx')).toBe(true);
    expect(await isRejected('src/core/probe.ts')).toBe(true);
    expect(await isRejected('labs/src/probe.lab.tsx')).toBe(true);
    expect(await isRejected('test/probe.ts')).toBe(true);
    expect(await isRejected('src/primitives/probe.ts')).toBe(false);
  });

  it('UIC-PRIMITIVES-1.1 leaves no direct React Aria import in the repository', () => {
    const offenders = sourceFiles()
      .filter((path) => ARIA_SOURCE.test(readFileSync(path, 'utf8')))
      .map((path) => relative(root, path));
    expect(offenders).toEqual([]);
  });

  it('UIC-PRIMITIVES-1.4 rejects a lab import of src/primitives', async () => {
    expect(await isRejected('labs/src/probe.lab.tsx', primitivesProbe)).toBe(true);
    expect(await isRejected('labs/src/chrome/probe.tsx', primitivesProbe)).toBe(true);
    expect(await isRejected('src/components/probe/probe.tsx', primitivesProbe)).toBe(false);
  });

  it('UIC-PRIMITIVES-1.2 groups the inventory by area and re-exports every area by name', () => {
    const { areas, exported } = areaExports();
    const index = readFileSync(join(primitivesDir, 'index.ts'), 'utf8');
    expect(index).not.toMatch(/^export \*/m);
    const listed = [...index.matchAll(AREA_EXPORT)].map(([, , list = '', from = '']) => ({
      area: from.replace(/^\.\/|\.js$/g, ''),
      names: names(list),
    }));
    expect(listed.map(({ area }) => `${area}.ts`).sort()).toEqual(areas.sort());
    for (const { area, names: reexported } of listed) {
      const own = [...exported].filter(([, entry]) => entry.area === `${area}.ts`);
      expect(reexported.sort(), area).toEqual(own.map(([name]) => name).sort());
    }
  });

  it('UIC-PRIMITIVES-1.2 re-exports exactly the building blocks the library uses', () => {
    const { exported } = areaExports();
    const used = new Set(
      sourceFiles().flatMap((path) =>
        [...readFileSync(path, 'utf8').matchAll(PRIMITIVES_IMPORT)].flatMap(([, list = '']) =>
          names(list),
        ),
      ),
    );
    expect([...used].filter((name) => !exported.has(name))).toEqual([]);
    expect([...exported.keys()].filter((name) => !used.has(name))).toEqual([]);
  });

  it('UIC-PRIMITIVES-1.3 resolves every value building block under its stable name', () => {
    const { exported } = areaExports();
    const values = [...exported].filter(([, entry]) => !entry.isType).map(([name]) => name);
    const missing = values.filter(
      (name) => (primitives as Record<string, unknown>)[name] === undefined,
    );
    expect(values.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
});
