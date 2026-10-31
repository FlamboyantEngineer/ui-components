// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as core from './index.js';
import type { GlyphComponent } from './glyph-types.js';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

/** The glyph names the spec lists. */
function specNames() {
  const spec = read('specs/PROVIDER.md');
  const list = /built-in glyphs \(([^)]*)\)/.exec(spec)?.[1] ?? '';
  return [...list.matchAll(/`([^`]+)`/g)].map(([, name]) => name);
}

/** The members of the `GlyphName` union. */
function typeNames() {
  const types = read('src/core/glyph-types.ts');
  const union = /export type GlyphName =([^;]*);/.exec(types)?.[1] ?? '';
  return [...union.matchAll(/'([^']+)'/g)].map(([, name]) => name);
}

/** The names of the glyph components the core entry exports. */
function exportedNames() {
  return Object.values(core)
    .map((value) => (value as Partial<GlyphComponent>).glyphName)
    .filter((name) => name !== undefined);
}

describe('built-in glyph names', () => {
  it('UIC-PROVIDER-2.1 lists the same glyphs in the spec, the type and the exports', () => {
    const names = typeNames();
    expect(names.length).toBeGreaterThan(100);
    expect(new Set(names).size).toBe(names.length);
    expect(specNames().sort()).toEqual([...names].sort());
    expect(exportedNames().sort()).toEqual([...names].sort());
  });
});
