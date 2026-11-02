import { describe, expect, it } from 'vitest';
import { readGridTracks, toGridTrack } from './table-grid-tracks.js';
import type { TableColumn } from './table-rows.js';
import type { TableStructure } from './table-structure.js';

interface Item {
  id: string;
}

const column = (sizing: Partial<TableColumn<Item>> = {}): TableColumn<Item> => ({
  id: 'name',
  header: 'Name',
  ...sizing,
});

describe('table grid tracks', () => {
  it('UIC-TABLE-4.6 draws pixels as they are and percentages inside the bounds', () => {
    expect(toGridTrack(column(), 120)).toBe('120px');
    expect(toGridTrack(column(), '30%')).toBe('30%');
    expect(toGridTrack(column({ minWidth: 80 }), '30%')).toBe('max(80px, 30%)');
    expect(toGridTrack(column({ maxWidth: 200 }), '30%')).toBe('min(30%, 200px)');
    expect(toGridTrack(column({ minWidth: 80, maxWidth: 200 }), '30%')).toBe(
      'clamp(80px, 30%, 200px)',
    );
  });

  it('UIC-TABLE-4.6 shares the room left with flexible columns, never below their minimum', () => {
    expect(toGridTrack(column(), '1fr')).toBe('minmax(75px, 1fr)');
    expect(toGridTrack(column({ minWidth: 120 }), '2fr')).toBe('minmax(120px, 2fr)');
    expect(toGridTrack(column({ minWidth: 120, maxWidth: 240 }), '1fr')).toBe(
      'minmax(120px, 240px)',
    );
  });

  it('UIC-TABLE-4.6 lists the selection, data and actions tracks in display order', () => {
    const structure = {
      columns: [
        column({ id: 'name', width: 'content' }),
        column({ id: 'notes' }),
        column({ id: 'size', width: 90 }),
      ],
      hasSelection: true,
      hasActions: true,
      actionsColumnWidth: 56,
      cellWrap: 'nowrap',
      treeColumn: null,
      isVirtualized: false,
    } satisfies TableStructure<Item>;
    expect(
      readGridTracks({
        structure,
        widths: { size: 110 },
        contentWidths: { name: 140 },
        selectionWidth: 44,
      }),
    ).toBe('44px 140px minmax(75px, 1fr) 110px 56px');
  });
});
