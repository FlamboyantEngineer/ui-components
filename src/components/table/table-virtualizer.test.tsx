import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Note {
  id: string;
  title: string;
}

const notes: Note[] = Array.from({ length: 200 }, (_, index) => ({
  id: `note-${index}`,
  title: `Note ${index + 1}`,
}));
const columns: TableColumn<Note>[] = [
  { id: 'title', header: 'Title', renderFooter: (rows) => `${rows.length} notes` },
  { id: 'id', header: 'Id' },
];
const groups = [{ id: 'all', header: 'All', columns: ['title', 'id'] }];
const source = readFileSync(
  join(process.cwd(), 'src/components/table/table-virtualizer.tsx'),
  'utf8',
);
const top = (row: HTMLElement) => Number.parseFloat(row.parentElement?.style.top ?? '');

function renderNotes(props: Partial<TableProps<Note>> = {}) {
  return render(<Table aria-label="Notes" rows={notes} columns={columns} {...props} />);
}

// React Aria's virtualizer treats an unmocked test DOM as infinitely large, and measures every
// cell as 44 pixels tall here.
const sizes = { clientWidth: 600, clientHeight: 200, scrollHeight: 44 };

describe('Table virtual layout', { timeout: 15_000 }, () => {
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

  it('UIC-TABLE-7.4 UIC-TABLE-8.7 lowers the rows when a group header row appears or goes', () => {
    const { rerender } = renderNotes({ virtualized: true, rowHeight: 36 });
    // Each drawn item is placed relative to its parent, so the row's top sums its ancestors'.
    const first = () => {
      let offset = 0;
      for (
        let node: HTMLElement | null = screen.getByRole('row', { name: /^Note 1\b/ });
        node;
        node = node.parentElement
      ) {
        offset += Number.parseFloat(node.style.top || '0');
      }
      return offset;
    };
    const ungrouped = first();
    rerender(
      <Table
        aria-label="Notes"
        rows={notes}
        columns={columns}
        columnGroups={groups}
        virtualized
        rowHeight={36}
      />,
    );
    expect(first()).toBe(ungrouped + 36);
    rerender(
      <Table aria-label="Notes" rows={notes} columns={columns} virtualized rowHeight={36} />,
    );
    expect(first()).toBe(ungrouped);
  });
});

describe('Table measured rows', { timeout: 15_000 }, () => {
  beforeEach(() => {
    for (const [name, value] of Object.entries(sizes)) {
      Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get: () => value });
    }
  });
  afterEach(() => {
    for (const name of Object.keys(sizes)) Reflect.deleteProperty(HTMLElement.prototype, name);
  });

  it('UIC-TABLE-7.5 publishes data-measured-rows only on a virtualized table', () => {
    const { container, rerender } = renderNotes({ virtualized: true, rowHeight: 'auto' });
    const root = container.querySelector('.ui-table');
    expect(root).toHaveAttribute('data-measured-rows', 'true');
    rerender(<Table aria-label="Notes" rows={notes} columns={columns} rowHeight="auto" />);
    expect(root).not.toHaveAttribute('data-measured-rows');
  });

  it('UIC-TABLE-7.5 stacks the drawn rows at their measured heights', () => {
    renderNotes({ virtualized: true, rowHeight: 'auto', estimatedRowHeight: 30 });
    const second = screen.getByRole('row', { name: 'Note 2' });
    const third = screen.getByRole('row', { name: 'Note 3' });
    expect(top(third) - top(second)).toBe(44);
    expect(screen.getAllByRole('row').length).toBeLessThan(20);
  });

  it('UIC-TABLE-7.5 UIC-TABLE-12.1 keeps the summary row in the document while measuring', () => {
    renderNotes({ virtualized: true, rowHeight: 'auto' });
    expect(screen.getByRole('row', { name: 'Summary' })).toHaveTextContent('200 notes');
    expect(screen.queryByRole('row', { name: 'Note 200' })).not.toBeInTheDocument();
  });

  it('UIC-TABLE-7.5 keeps the rows and their order when measuring turns off', () => {
    const { container, rerender } = renderNotes({ virtualized: true, rowHeight: 'auto' });
    rerender(
      <Table aria-label="Notes" rows={notes} columns={columns} virtualized rowHeight={36} />,
    );
    expect(container.querySelector('.ui-table')).not.toHaveAttribute('data-measured-rows');
    const second = screen.getByRole('row', { name: 'Note 2' });
    const third = screen.getByRole('row', { name: 'Note 3' });
    expect(top(third) - top(second)).toBe(36);
  });
});
