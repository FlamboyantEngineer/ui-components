// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as glyphPaths from './glyph-paths.js';
import * as glyphStrokes from './glyph-strokes.js';
import type { GlyphComponent } from './glyph-types.js';
import * as core from './index.js';

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

describe('built-in glyph paths', () => {
  it('UIC-PROVIDER-2.1 carries only drawn Heroicons paths, with the MIT notice', () => {
    const glyphs = read('src/core/glyphs.tsx') + read('src/core/drawn-glyphs.tsx');
    for (const [name, path] of Object.entries(glyphPaths)) {
      expect(glyphs, name).toMatch(new RegExp(`createGlyph\\([^)]*\\b${name}\\b`));
      expect(path, name).toMatch(/^[Mm][-\d.\s]/);
    }
    for (const [name, strokes] of Object.entries(glyphStrokes)) {
      expect(glyphs, name).toMatch(new RegExp(`createGlyph\\([^)]*\\b${name}\\b`));
      for (const stroke of strokes) expect(stroke.d, name).toMatch(/^M[-\d.\s]/);
    }
    const notice = read('src/core/glyph-paths.ts');
    expect(notice).toContain('MIT License');
    expect(notice).toContain('Copyright (c) Tailwind Labs, Inc.');
  });

  it('UIC-PROVIDER-2.1 draws each lone dot as an open circle that renders at small sizes', () => {
    const dot = /a\.3\.3 0 1 1-\.6 0 \.3\.3 0 1 1 \.6 0$/;
    for (const name of [
      'informationCirclePath',
      'questionMarkCirclePath',
      'exclamationCirclePath',
      'warningTrianglePath',
      'gripVerticalPath',
      'abbreviationPath',
      'signalSlashPath',
      'wrenchPath',
    ] as const) {
      expect(glyphPaths[name], name).toMatch(dot);
    }
  });
});
