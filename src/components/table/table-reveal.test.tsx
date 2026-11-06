import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Table, type TableProps } from './table.js';
import type { TableHandle } from './table-reveal.js';
import type { TableColumn } from './table-rows.js';

interface Place {
  id: string | number;
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
  { id: 'no', name: 'Norway', people: 5 },
  { id: 1, name: 'Numeric one', people: 1 },
  { id: '1', name: 'Text one', people: 1 },
];
const columns: TableColumn<Place>[] = [
  { id: 'name', header: 'Name' },
  { id: 'people', header: 'People', align: 'end' },
];

const scrollIntoView = vi.fn();
const original = Element.prototype.scrollIntoView;

beforeEach(() => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  Element.prototype.scrollIntoView = original;
});

function renderPlaces(props: Partial<TableProps<Place>> = {}) {
  const handleRef = createRef<TableHandle>();
  const view = render(
    <>
      <button type="button">Elsewhere</button>
      <Table
        aria-label="Places"
        rows={places}
        columns={columns}
        getChildRows={(place) => place.places}
        handleRef={handleRef}
        {...props}
      />
    </>,
  );
  const handle = () => {
    if (!handleRef.current) throw new Error('The table gave no handle.');
    return handleRef.current;
  };
  return { ...view, handle };
}

/** The element the last reveal scrolled into view. */
const scrolled = () => scrollIntoView.mock.contexts.at(-1) as HTMLElement | undefined;

describe('Table handle', { timeout: 15_000 }, () => {
  it('UIC-TABLE-19.1 reveals a shown row by id without moving focus', async () => {
    const user = userEvent.setup();
    const { handle } = renderPlaces();
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    await user.click(elsewhere);
    expect(await handle().revealKey('no')).toEqual({ found: true });
    expect(scrolled()).toHaveTextContent('Norway');
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest', inline: 'nearest' });
    expect(elsewhere).toHaveFocus();
  });

  it('UIC-TABLE-19.1 focuses a row, or one cell of it by column id', async () => {
    const { handle } = renderPlaces();
    expect(await handle().focusKey('no')).toEqual({ found: true });
    expect(screen.getByRole('row', { name: /Norway/ })).toHaveFocus();
    expect(await handle().focusKey('no', { columnId: 'people' })).toEqual({ found: true });
    const cell = within(screen.getByRole('row', { name: /Norway/ })).getByText('5');
    expect(cell.closest('[data-column]')).toHaveFocus();
    expect(cell.closest('[data-column]')).toHaveAttribute('data-column', 'people');
  });

  it('UIC-TABLE-19.1 keeps numeric and text ids apart', async () => {
    const { handle } = renderPlaces();
    await handle().revealKey(1);
    expect(scrolled()).toHaveTextContent('Numeric one');
    await handle().revealKey('1');
    expect(scrolled()).toHaveTextContent('Text one');
  });

  it('UIC-TABLE-19.2 UIC-COLLECTIONS-1.6 reports rows it does not show and why, without expanding, filtering or paging', async () => {
    const onExpandedChange = vi.fn();
    const { handle } = renderPlaces({ onExpandedChange });
    expect(await handle().revealKey('lisbon')).toEqual({ found: false, reason: 'collapsed' });
    expect(await handle().revealKey('nowhere')).toEqual({ found: false, reason: 'missing' });
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
    const { handle: filtered } = renderPlaces({
      filterable: true,
      defaultFilter: { query: 'Nor' },
    });
    expect(await filtered().revealKey('pt')).toEqual({ found: false, reason: 'filtered' });
    const { handle: paged } = renderPlaces({ pagination: { pageSize: 1 } });
    expect(await paged().revealKey('no')).toEqual({ found: false, reason: 'paged' });
  });

  it('UIC-TABLE-19.2 reveals a nested row under an expanded parent', async () => {
    const { handle } = renderPlaces({ defaultExpandedKeys: ['pt'] });
    expect(await handle().revealKey('lisbon')).toEqual({ found: true });
    expect(scrolled()).toHaveTextContent('Lisbon');
  });

  it('UIC-TABLE-19.3 draws an offscreen row of a virtualized table, and settles when rows are replaced or it unmounts', async () => {
    // React Aria's virtualizer treats an unmocked test DOM as infinitely large.
    const sizes = { clientWidth: 600, clientHeight: 200 };
    for (const [name, value] of Object.entries(sizes)) {
      Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get: () => value });
    }
    const many: Place[] = Array.from({ length: 500 }, (_, index) => ({
      id: `row-${index}`,
      name: `Place ${index + 1}`,
      people: index,
    }));
    const renderMany = (rows: Place[], handleRef = createRef<TableHandle>()) => (
      <Table
        aria-label="Many"
        rows={rows}
        columns={columns}
        virtualized
        rowHeight={28}
        handleRef={handleRef}
      />
    );
    try {
      const handleRef = createRef<TableHandle>();
      const view = render(renderMany(many, handleRef));
      expect(screen.queryByRole('row', { name: /Place 401/ })).not.toBeInTheDocument();
      const revealed = await act(() => handleRef.current?.revealKey('row-400'));
      expect(revealed).toEqual({ found: true });
      expect(scrolled()).toHaveTextContent('Place 401');
      expect(view.container.querySelector('.ui-table__scroll')?.scrollTop).toBeGreaterThan(0);

      const replacedRef = createRef<TableHandle>();
      const { rerender } = render(renderMany(many, replacedRef));
      const replaced = replacedRef.current?.revealKey('row-450');
      rerender(renderMany(many.slice(0, 100), replacedRef));
      expect(await act(() => replaced)).toEqual({ found: false, reason: 'missing' });

      const unmountedRef = createRef<TableHandle>();
      const { unmount } = render(renderMany(many, unmountedRef));
      const pending = unmountedRef.current?.revealKey('row-450');
      unmount();
      expect(await pending).toEqual({ found: false, reason: 'unmounted' });
    } finally {
      for (const name of Object.keys(sizes)) {
        Reflect.deleteProperty(HTMLElement.prototype, name);
      }
    }
  });
});
