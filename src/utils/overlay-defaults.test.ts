import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as defaults from './overlay-defaults.js';

const componentsDir = join(import.meta.dirname, '..', 'components');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : [];
  });
}

describe('overlay defaults', () => {
  it('UIC-OVERLAY-POSITION-4.1 names the shared distances and delays', () => {
    expect({ ...defaults }).toEqual({
      DEFAULT_OVERLAY_GUTTER: 8,
      DEFAULT_OVERLAY_GAP: 6,
      DEFAULT_SUBMENU_OVERLAP: 6,
      DEFAULT_DROPDOWN_OFFSET: 4,
      DEFAULT_POINT_OFFSET: 2,
      SUBMENU_OFFSET: -2,
      SUBMENU_CROSS_OFFSET: -4,
      TOOLTIP_OFFSET: 8,
      POPOVER_OFFSET: 8,
      POPOVER_ARROW_OFFSET: 7,
      TOOLTIP_DELAY: 500,
      HOVER_CARD_DELAY: 600,
      HOVER_CARD_CLOSE_DELAY: 200,
      LONG_PRESS_DELAY: 500,
    });
  });

  it('UIC-OVERLAY-POSITION-4.1 leaves no overlay distance as a literal in a component', () => {
    const literal = /\b(?:offset|crossOffset|containerPadding)=\{-?\d/;
    const offenders = sourceFiles(componentsDir).filter((file) =>
      literal.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});
