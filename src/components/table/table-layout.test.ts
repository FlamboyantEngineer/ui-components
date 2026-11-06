// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createTableLayout } from './table-layout.js';

const source = readFileSync(new URL('./table-layout.ts', import.meta.url), 'utf8');

describe('Table virtual layout', () => {
  it('UIC-TABLE-7.4 reaches no protected member of React Aria’s table layout', () => {
    for (const member of [
      'rootNodes',
      'requestedRect',
      'validRect',
      'layoutNodes',
      'buildRowGroup',
      'buildHeaderRow',
      'buildCollection',
      'as unknown',
    ]) {
      expect(source, member).not.toContain(member);
    }
  });

  it('UIC-TABLE-7.4 starts without a virtualizer or content', () => {
    const layout = createTableLayout();
    expect(layout.virtualizer).toBeNull();
    expect(layout.getContentSize().height).toBe(0);
  });

  it('UIC-TABLE-7.4 UIC-TABLE-8.7 invalidates when the group row height changes', () => {
    const layout = createTableLayout();
    const grouped = { rowHeight: 36, headingHeight: 36, groupRowHeight: 36 };
    const ungrouped = { ...grouped, groupRowHeight: 0 };
    expect(layout.shouldInvalidateLayoutOptions(grouped, ungrouped)).toBe(true);
    expect(layout.shouldInvalidateLayoutOptions(grouped, { ...grouped })).toBe(false);
  });
});
