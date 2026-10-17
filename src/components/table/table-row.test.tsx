import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Place {
  id: string;
  name: string;
  people: number;
  places?: Place[];
}

const places: Place[] = [
  {
    id: 'pt',
    name: 'Portugal',
    people: 10,
    places: [
      { id: 'porto', name: 'Porto', people: 2 },
      { id: 'lisbon', name: 'Lisbon', people: 3 },
    ],
  },
  { id: 'no', name: 'Norway', people: 5, places: [{ id: 'oslo', name: 'Oslo', people: 1 }] },
  { id: 'is', name: 'Iceland', people: 1 },
];
const columns: TableColumn<Place>[] = [
  { id: 'name', header: 'Name', allowsSorting: true },
  { id: 'people', header: 'People', align: 'end' },
];

const names = () =>
  screen
    .getAllByRole('rowheader')
    .map((cell) => cell.textContent?.replace(/^(Expand|Collapse) /, ''));
// The expand button sits in the row header, so a row's name starts with the button's.
const row = (name: string) => screen.getByRole('row', { name: new RegExp(`${name}$`) });

function renderPlaces(props: Partial<TableProps<Place>> = {}) {
  return render(
    <Table
      aria-label="Places"
      rows={places}
      columns={columns}
      getChildRows={(place) => place.places}
      {...props}
    />,
  );
}

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table nested and detail rows', { timeout: 15_000 }, () => {
  it('UIC-TABLE-9.1 expands nested rows from the expand button and the arrow keys', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container } = renderPlaces({ onExpandedChange });
    expect(screen.getByRole('treegrid', { name: 'Places' })).toBeInTheDocument();
    const portugal = row('Portugal');
    expect(portugal).toHaveAttribute('aria-expanded', 'false');
    expect(portugal).toHaveAttribute('aria-level', '1');
    expect(names()).toEqual(['Portugal', 'Norway', 'Iceland']);
    const expand = within(portugal).getByRole('button', { name: 'Expand Portugal' });
    expect(expand).toHaveClass('ui-table__expand');
    expect(expand.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'chevron-right');
    expect(container.querySelector('.ui-table__expand-spacer')).not.toBeNull();
    await user.click(expand);
    expect(names()).toEqual(['Portugal', 'Porto', 'Lisbon', 'Norway', 'Iceland']);
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['pt']));
    expect(within(portugal).getByRole('button', { name: 'Collapse Portugal' })).toBeInTheDocument();
    const porto = row('Porto');
    expect(porto).toHaveAttribute('aria-level', '2');
    const cell = within(porto).getByRole('rowheader');
    expect(cell).toHaveAttribute('data-tree-column', 'true');
    expect(cell.style.getPropertyValue('--ui-table-level')).toBe('2');
    row('Norway').focus();
    await user.keyboard('{ArrowRight}');
    expect(names()).toContain('Oslo');
    await user.keyboard('{ArrowLeft}');
    expect(names()).not.toContain('Oslo');
    expectHooksMatchSpec(container, 'TABLE', { slots: ['expand', 'expand-spacer'] });
  });

  it('UIC-TABLE-9.1 puts the expand buttons in a drawn treeColumn', () => {
    renderPlaces({ treeColumn: 'people', defaultExpandedKeys: ['pt'] });
    expect(within(row('Porto')).getByRole('gridcell')).toHaveAttribute('data-tree-column', 'true');
    expect(names()).toContain('Lisbon');
  });

  it('UIC-TABLE-9.3 sorts child rows among siblings and keeps the parents of matches', async () => {
    const user = userEvent.setup();
    renderPlaces({ filterable: true, defaultExpandedKeys: ['pt', 'no'] });
    await user.click(screen.getByRole('columnheader', { name: /^Name/ }));
    expect(names()).toEqual(['Iceland', 'Norway', 'Oslo', 'Portugal', 'Lisbon', 'Porto']);
    await user.type(screen.getByRole('searchbox'), 'lis');
    expect(names()).toEqual(['Portugal', 'Lisbon']);
  });

  it('UIC-TABLE-9.2 draws a detail row under an expanded row, kept out of row actions', async () => {
    const user = userEvent.setup();
    const onRowAction = vi.fn();
    const { container } = render(
      <Table
        aria-label="Places"
        rows={places}
        columns={columns}
        selectionMode="multiple"
        onRowAction={onRowAction}
        renderRowDetail={(place) =>
          place.places ? <button type="button">{`${place.name} cities`}</button> : null
        }
      />,
    );
    expect(within(row('Iceland')).queryByRole('button', { name: /^Expand/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Expand Portugal' }));
    const detail = container.querySelector('.ui-table__detail-row') as HTMLElement;
    expect(detail).toHaveAttribute('aria-level', '2');
    const cell = detail.querySelector('.ui-table__detail-cell');
    expect(cell).toHaveAttribute('colspan', '3');
    expect(within(detail).getByRole('button', { name: 'Portugal cities' })).toBeInTheDocument();
    expect(within(detail).queryByRole('checkbox')).toBeNull();
    await user.click(detail);
    await user.keyboard('{Enter}');
    expect(onRowAction).not.toHaveBeenCalled();
    expect(detail).toHaveAttribute('aria-selected', 'false');
    expectHooksMatchSpec(container, 'TABLE', { slots: ['detail-row', 'detail-cell'] });
  });
});
