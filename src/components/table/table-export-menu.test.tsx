import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table, type TableProps } from './table.js';
import type { TableExportFile } from './table-export.js';
import type { TableColumn } from './table-rows.js';

interface Item {
  id: string;
  name: string;
  weight: number;
}

const items: Item[] = [
  { id: 'a', name: 'Pear', weight: 5 },
  { id: 'b', name: 'Apple', weight: 3 },
  { id: 'c', name: 'Mint', weight: 1 },
];

const columns: TableColumn<Item>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  { id: 'weight', header: 'Weight', allowsHiding: true },
];

function renderExport({ csvExport, ...props }: Partial<TableProps<Item>> = {}) {
  const onExport = vi.fn<(file: TableExportFile) => void>();
  const view = render(
    <Table
      aria-label="Items"
      rows={items}
      columns={columns}
      csvExport={{ fileName: 'items.csv', onExport, ...csvExport }}
      {...props}
    />,
  );
  return { ...view, onExport };
}

async function exportScope(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: 'Export CSV' }));
  const menu = await screen.findByRole('menu');
  await user.click(within(menu).getByRole('menuitem', { name }));
}

afterEach(() => {
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('Table CSV export', () => {
  it('UIC-TABLE-16.3 offers the page, every row and the selection, the selection disabled while empty', async () => {
    const user = userEvent.setup();
    const { container } = renderExport({
      pagination: { pageSize: 2 },
      selectionMode: 'multiple',
    });
    expectHooksMatchSpec(container, 'TABLE', { slots: ['toolbar', 'export-menu'] });
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    const menu = await screen.findByRole('menu');
    const names = within(menu)
      .getAllByRole('menuitem')
      .map((item) => item.textContent);
    expect(names).toEqual(['Current page', 'All rows', 'Selected rows']);
    expect(within(menu).getByRole('menuitem', { name: 'Selected rows' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('UIC-TABLE-16.3 writes the presented rows in the table’s order and the drawn columns', async () => {
    const user = userEvent.setup();
    const { onExport } = renderExport({
      filterable: true,
      defaultSortDescriptor: { column: 'name', direction: 'ascending' },
      defaultColumnLayout: { hidden: ['weight'] },
    });
    await user.type(screen.getByRole('searchbox', { name: 'Filter rows' }), 'p');
    await exportScope(user, 'All rows');
    expect(onExport).toHaveBeenCalledWith({
      fileName: 'items.csv',
      scope: 'rows',
      text: 'Name\r\nApple\r\nPear',
    });
  });

  it('UIC-TABLE-16.3 writes the current page or the selected rows', async () => {
    const user = userEvent.setup();
    const { onExport } = renderExport({
      pagination: { pageSize: 2, defaultPage: 2 },
      selectionMode: 'multiple',
      defaultSelectedKeys: ['a', 'c'],
    });
    await exportScope(user, 'Current page');
    expect(onExport).toHaveBeenLastCalledWith(
      expect.objectContaining({ scope: 'page', text: 'Name,Weight\r\nMint,1' }),
    );
    await exportScope(user, 'Selected rows');
    expect(onExport).toHaveBeenLastCalledWith(
      expect.objectContaining({ scope: 'selected', text: 'Name,Weight\r\nPear,5\r\nMint,1' }),
    );
  });

  it('UIC-TABLE-16.4 names caller-paged rows as loaded unless the caller gives every row', async () => {
    const user = userEvent.setup();
    const paged = { pageSize: 3, rowCount: 6 };
    const { onExport, unmount } = renderExport({
      pagination: paged,
      csvExport: { fileName: 'a.csv', scopes: ['rows'] },
    });
    await exportScope(user, 'Loaded rows');
    expect(onExport).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Name,Weight\r\nPear,5\r\nApple,3\r\nMint,1' }),
    );
    unmount();
    const all = [...items, { id: 'd', name: 'Sage', weight: 2 }];
    const onAll = vi.fn<(file: TableExportFile) => void>();
    render(
      <Table
        aria-label="Items"
        rows={items}
        columns={columns}
        pagination={paged}
        csvExport={{
          fileName: 'all.csv',
          scopes: ['rows'],
          allRows: all,
          columns: ['weight'],
          onExport: onAll,
        }}
      />,
    );
    await exportScope(user, 'All rows');
    expect(onAll).toHaveBeenCalledWith({
      fileName: 'all.csv',
      scope: 'rows',
      text: 'Weight\r\n5\r\n3\r\n1\r\n2',
    });
  });

  it('UIC-TABLE-16.4 downloads a UTF-8 file with a byte order mark', async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((blob: Blob) => {
        blobs.push(blob);
        return `blob:${location.origin}/file`;
      }),
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(
      <Table
        aria-label="Items"
        rows={items.slice(0, 1)}
        columns={columns}
        csvExport={{ fileName: 'items.csv' }}
      />,
    );
    await exportScope(user, 'All rows');
    expect(click).toHaveBeenCalledTimes(1);
    expect(blobs[0]?.type).toBe('text/csv;charset=utf-8');
    const bytes = new Uint8Array(await (blobs[0] as Blob).arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('Name,Weight\r\nPear,5');
  });
});
