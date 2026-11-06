import { describe, expect, it } from 'vitest';
import { formatTableCsv, listExportRows, resolveExportColumns } from './table-export.js';
import type { TableColumn } from './table-rows.js';
import { buildTableNodes } from './table-tree.js';

interface Item {
  id: string;
  name: string;
  weight: number | null;
  picked?: Date;
  parts?: Item[];
}

const columns: TableColumn<Item>[] = [
  { id: 'name', header: 'Name' },
  { id: 'weight', header: 'Weight' },
  { id: 'picked', header: 'Picked', textValue: 'Picked on' },
];

const rows: Item[] = [
  { id: 'a', name: 'Apple', weight: 3, picked: new Date('2026-10-01T00:00:00Z') },
  {
    id: 'b',
    name: 'Basket, small',
    weight: null,
    parts: [{ id: 'b1', name: 'Handle "long"', weight: 1 }],
  },
];

const getChildRows = (row: Item) => row.parts;

describe('table CSV', () => {
  it('UIC-TABLE-16.2 writes a header of column names and each value as text', () => {
    expect(formatTableCsv({ rows, columns })).toBe(
      ['Name,Weight,Picked on', 'Apple,3,2026-10-01T00:00:00.000Z', '"Basket, small",,'].join(
        '\r\n',
      ),
    );
  });

  it('UIC-TABLE-16.2 writes a column’s export text instead of its value or rendered content', () => {
    const formatted: TableColumn<Item>[] = [
      { id: 'name', header: 'Name', renderCell: () => 'never' },
      {
        id: 'weight',
        header: 'Weight',
        getExportText: (row) =>
          row.weight === null ? '' : new Intl.NumberFormat('fr-FR').format(row.weight + 1000.5),
      },
    ];
    expect(formatTableCsv({ rows, columns: formatted, delimiter: ';' })).toBe(
      [
        'Name;Weight',
        `Apple;${new Intl.NumberFormat('fr-FR').format(1003.5)}`,
        'Basket, small;',
      ].join('\r\n'),
    );
  });

  it('UIC-TABLE-16.2 guards formula-like text and leaves its inputs unchanged', () => {
    const frozenRows = Object.freeze([
      Object.freeze({ id: 'x', name: '=HYPERLINK("x")', weight: -2 }),
    ]);
    const frozenColumns = Object.freeze(columns.slice(0, 2).map((column) => Object.freeze(column)));
    expect(formatTableCsv({ rows: frozenRows, columns: frozenColumns })).toBe(
      'Name,Weight\r\n"\'=HYPERLINK(""x"")",-2',
    );
    expect(
      formatTableCsv({ rows: frozenRows, columns: frozenColumns, escapeFormulas: false }),
    ).toBe('Name,Weight\r\n"=HYPERLINK(""x"")",-2');
    expect(frozenRows[0]?.name).toBe('=HYPERLINK("x")');
  });

  it('UIC-TABLE-16.3 lists each scope’s rows with child rows after their parent', () => {
    const nodes = buildTableNodes(rows, getChildRows);
    const parts = {
      page: nodes.slice(1),
      presented: nodes,
      selected: [rows[0] as Item],
      getChildRows,
    };
    const ids = (list: readonly Item[]) => list.map((row) => row.id);
    expect(ids(listExportRows('page', parts, undefined))).toEqual(['b', 'b1']);
    expect(ids(listExportRows('rows', parts, undefined))).toEqual(['a', 'b', 'b1']);
    expect(ids(listExportRows('selected', parts, undefined))).toEqual(['a']);
    const all = [...rows, { id: 'c', name: 'Cherry', weight: 1 }];
    expect(ids(listExportRows('rows', parts, all))).toEqual(['a', 'b', 'b1', 'c']);
  });

  it('UIC-TABLE-16.3 writes the chosen columns in their order, hidden ones included', () => {
    const drawn = columns.slice(0, 1);
    expect(resolveExportColumns(undefined, columns, drawn)).toBe(drawn);
    expect(
      resolveExportColumns(['picked', 'missing', 'name'], columns, drawn).map(
        (column) => column.id,
      ),
    ).toEqual(['picked', 'name']);
  });
});
