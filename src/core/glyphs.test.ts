// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as outlinePaths from './glyph-paths.js';
import * as glyphStrokes from './glyph-strokes.js';
import type { GlyphComponent } from './glyph-types.js';
import * as core from './index.js';
import * as tabularGlyphPaths from './tabular-glyph-paths.js';

const glyphPaths = { ...outlinePaths, ...tabularGlyphPaths };
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

describe('tabular formatting glyphs', () => {
  it('UIC-PROVIDER-2.1 exports each formatting glyph under its provider key', () => {
    const exports: Record<string, string> = {
      FontFamilyGlyph: 'font-family',
      FontSizeGlyph: 'font-size',
      NumberFormatGlyph: 'number-format',
      PercentGlyph: 'percent',
      CurrencyGlyph: 'currency',
      ScientificNotationGlyph: 'scientific-notation',
      FractionGlyph: 'fraction',
      UnitGlyph: 'unit',
      IncreaseDecimalsGlyph: 'increase-decimals',
      DecreaseDecimalsGlyph: 'decrease-decimals',
      CellAlignmentGlyph: 'cell-alignment',
      AlignTopLeftGlyph: 'align-top-left',
      AlignTopCenterGlyph: 'align-top-center',
      AlignTopRightGlyph: 'align-top-right',
      AlignMiddleLeftGlyph: 'align-middle-left',
      AlignMiddleCenterGlyph: 'align-middle-center',
      AlignMiddleRightGlyph: 'align-middle-right',
      AlignBottomLeftGlyph: 'align-bottom-left',
      AlignBottomCenterGlyph: 'align-bottom-center',
      AlignBottomRightGlyph: 'align-bottom-right',
      TableBorderTopGlyph: 'table-border-top',
      TableBorderRightGlyph: 'table-border-right',
      TableBorderBottomGlyph: 'table-border-bottom',
      TableBorderLeftGlyph: 'table-border-left',
      TableBorderAllGlyph: 'table-border-all',
      TableBorderOutsideGlyph: 'table-border-outside',
      TableBorderNoneGlyph: 'table-border-none',
      WrapTextGlyph: 'wrap-text',
      MergeCellsGlyph: 'merge-cells',
      UnmergeCellsGlyph: 'unmerge-cells',
      CutGlyph: 'cut',
      TextAlignLeftGlyph: 'text-align-left',
      TextAlignCenterGlyph: 'text-align-center',
      TextAlignRightGlyph: 'text-align-right',
      TextAlignJustifyGlyph: 'text-align-justify',
      BookOpenGlyph: 'book-open',
    };
    const entry = core as unknown as Record<string, Partial<GlyphComponent> | undefined>;
    for (const [name, key] of Object.entries(exports)) {
      expect(entry[name]?.glyphName, name).toBe(key);
    }
  });

  it('UIC-PROVIDER-2.1 draws every alignment, border and decimal choice as its own mark', () => {
    const groups = [
      ['top', 'middle', 'bottom'].flatMap((v) =>
        ['Left', 'Center', 'Right'].map((h) => `align${v[0]?.toUpperCase()}${v.slice(1)}${h}Path`),
      ),
      ['textAlignLeftPath', 'textAlignCenterPath', 'textAlignRightPath', 'textAlignJustifyPath'],
      ['increaseDecimalsPath', 'decreaseDecimalsPath', 'plusPath', 'minusPath'],
      ['cellAlignmentPath', 'alignMiddleCenterPath'],
    ];
    const paths = glyphPaths as Record<string, string>;
    for (const group of groups) {
      const drawn = group.map((name) => paths[name]);
      expect(drawn.every(Boolean), group.join()).toBe(true);
      expect(new Set(drawn).size, group.join()).toBe(group.length);
    }
    const borders = Object.values(glyphStrokes).map((strokes) => JSON.stringify(strokes));
    expect(new Set([...borders, glyphPaths.borderAllPath]).size).toBe(7);
  });
});

describe('text colour and size glyphs', () => {
  it('UIC-PROVIDER-2.1 exports each text colour and size glyph under its provider key', () => {
    const exports: Record<string, string> = {
      FontColorGlyph: 'font-color',
      BackgroundColorGlyph: 'background-color',
      IncreaseFontSizeGlyph: 'increase-font-size',
      DecreaseFontSizeGlyph: 'decrease-font-size',
    };
    const entry = core as unknown as Record<string, Partial<GlyphComponent> | undefined>;
    for (const [name, key] of Object.entries(exports)) {
      expect(entry[name]?.glyphName, name).toBe(key);
    }
  });

  it('UIC-PROVIDER-2.1 keeps the colour glyphs above the swatch band and the size steps apart', () => {
    for (const path of [glyphPaths.fontColorPath, glyphPaths.backgroundColorPath]) {
      const ys = [...path.matchAll(/[ML](-?[\d.]+)[ ,](-?[\d.]+)/g)].map(([, , y]) => Number(y));
      expect(Math.max(...ys)).toBeLessThanOrEqual(19.5);
    }
    const sizes = [
      glyphPaths.increaseFontSizePath,
      glyphPaths.decreaseFontSizePath,
      glyphPaths.fontSizePath,
      glyphPaths.fontFamilyPath,
      glyphPaths.fontColorPath,
    ];
    expect(new Set(sizes).size).toBe(sizes.length);
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
      'increaseDecimalsPath',
      'decreaseDecimalsPath',
    ] as const) {
      expect(glyphPaths[name], name).toMatch(dot);
    }
  });
});
