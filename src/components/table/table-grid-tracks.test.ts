import { describe, expect, it } from 'vitest';
import { readGridTracks } from './table-grid-tracks.js';
import type { TableColumn } from './table-rows.js';
import type { TableStructure } from './table-structure.js';

interface Item {
  id: string;
}

const column = (id: string, sizing: Partial<TableColumn<Item>> = {}): TableColumn<Item> => ({
  id,
  header: id,
  ...sizing,
});

function tracksOf(
  columns: TableColumn<Item>[],
  extras: Partial<TableStructure<Item>> = {},
  widths: Record<string, number> = {},
): string {
  const structure = {
    columns,
    hasSelection: false,
    hasActions: false,
    actionsColumnWidth: 56,
    cellWrap: 'nowrap',
    treeColumn: null,
    isVirtualized: false,
    ...extras,
  } satisfies TableStructure<Item>;
  return readGridTracks({ structure, widths, contentWidths: { name: 140 }, selectionWidth: 44 });
}

// Rendered widths are checked in a browser by e2e/table-fluid-columns.spec.ts; these pin the
// tracks the CSS is built from.
describe('table grid tracks', () => {
  it('UIC-TABLE-4.6 draws pixels as they are and percentages inside the bounds', () => {
    expect(
      tracksOf([
        column('a', { width: 120 }),
        column('b', { width: '30%' }),
        column('c', { width: '30%', minWidth: 80 }),
        column('d', { width: '30%', maxWidth: 200 }),
        column('e', { width: '30%', minWidth: 80, maxWidth: 200 }),
      ]),
    ).toBe('120px 30% max(80px, 30%) min(30%, 200px) clamp(80px, 30%, 200px)');
  });

  it('UIC-TABLE-4.6 shares the room left by weight, never below the minimum', () => {
    expect(tracksOf([column('a'), column('b', { width: '2fr', minWidth: 120 })])).toBe(
      'minmax(75px, 1fr) minmax(120px, 2fr)',
    );
  });

  it('UIC-TABLE-4.6 keeps the weights of capped shares until their caps stop them', () => {
    // 1fr and 2fr capped at 1000: one unit is the room over 3, or with the 2fr share stopped at
    // its cap, the room less 1000 pixels over 1.
    expect(
      tracksOf([
        column('a', { width: '1fr', maxWidth: 1000 }),
        column('b', { width: '2fr', maxWidth: 1000 }),
      ]),
    ).toBe(
      'clamp(75px, calc(max(calc((100%) / 3), calc((100% - 1000px) / 1)) * 1), 1000px) ' +
        'clamp(75px, calc(max(calc((100%) / 3), calc((100% - 1000px) / 1)) * 2), 1000px)',
    );
  });

  it('UIC-TABLE-4.6 leaves uncapped shares the room capped ones leave, after fixed tracks', () => {
    const unit =
      'max(calc((100% - 90px - 44px - 56px) / 3), calc((100% - 90px - 44px - 56px - 200px) / 2))';
    expect(
      tracksOf(
        [
          column('a', { width: '1fr', maxWidth: 200, minWidth: 100 }),
          column('b', { width: '2fr' }),
          column('c', { width: 90 }),
        ],
        { hasSelection: true, hasActions: true },
      ),
    ).toBe(`44px clamp(100px, calc(${unit} * 1), 200px) minmax(75px, 2fr) 90px 56px`);
  });

  it('UIC-TABLE-4.6 draws resized and content widths as pixels and lists the extra columns', () => {
    expect(
      tracksOf(
        [column('name', { width: 'content' }), column('notes'), column('size', { width: 90 })],
        { hasSelection: true, hasActions: true },
        { size: 110 },
      ),
    ).toBe('44px 140px minmax(75px, 1fr) 110px 56px');
  });
});
