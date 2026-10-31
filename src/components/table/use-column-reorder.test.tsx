import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface City {
  id: string;
  name: string;
  country: string;
  people: number;
  code: string;
}

const cities: City[] = [
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal', people: 545, code: 'LIS' },
];
const columns: TableColumn<City>[] = [
  { id: 'code', header: 'Code', pin: 'start' },
  { id: 'name', header: 'Name', allowsReordering: true, allowsSorting: true },
  { id: 'country', header: 'Country', allowsReordering: true },
  { id: 'people', header: 'People' },
];

const headers = () => screen.getAllByRole('columnheader').map((header) => header.textContent);
const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(`^${name}`) });

function renderCities(props: Partial<TableProps<City>> = {}, locale?: string) {
  return render(
    <UiProvider locale={locale}>
      <Table aria-label="Cities" rows={cities} columns={columns} {...props} />
    </UiProvider>,
  );
}

/** A data transfer that keeps what a drag writes, as jsdom has none. */
function createDataTransfer() {
  const data = new Map<string, string>();
  return {
    items: {
      add: (value: string, type: string) => data.set(type, value),
      *[Symbol.iterator]() {
        for (const type of data.keys()) yield { kind: 'string', type };
      },
    },
    get types() {
      return [...data.keys()];
    },
    getData: (type: string) => data.get(type) ?? '',
    clearData: () => data.clear(),
    effectAllowed: 'all',
    dropEffect: 'none',
  };
}

type DragType = 'dragStart' | 'dragEnter' | 'dragOver' | 'drop' | 'dragEnd';

/** A drag event with the pointer position and data transfer jsdom's plain events lack. */
function drag(type: DragType, target: Element, options: { transfer: object; clientX?: number }) {
  const event = createEvent[type](target);
  Object.defineProperty(event, 'dataTransfer', { value: options.transfer });
  Object.defineProperty(event, 'clientX', { value: options.clientX ?? 0 });
  Object.defineProperty(event, 'clientY', { value: 10 });
  fireEvent(target, event);
  return event;
}

/** A header's drop target: the content beside its resizer. */
const content = (name: string) =>
  requireDefined(header(name).querySelector('.ui-table__column-content'));

/** Starts dragging a column by its label, as the browser does once the drag begins. */
async function startDrag(name: string, transfer: object) {
  const label = requireDefined(header(name).querySelector('.ui-table__column-label'));
  drag('dragStart', label, { transfer });
  await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  return label;
}

function box(element: Element, left: number, width: number) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(left, 0, width, 40));
}

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table column reordering', { timeout: 15_000 }, () => {
  it('UIC-TABLE-8.5 moves a focused header with Alt+Arrow keys and keeps focus on it', async () => {
    const user = userEvent.setup();
    const onColumnLayoutChange = vi.fn();
    const { container } = renderCities({ onColumnLayoutChange });
    expect(header('Name')).toHaveAttribute('data-allows-reordering', 'true');
    expect(header('People')).not.toHaveAttribute('data-allows-reordering');
    header('Name').focus();
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(headers()).toEqual(['Code', 'Country', 'Name', 'People']);
    expect(onColumnLayoutChange).toHaveBeenLastCalledWith({
      order: ['code', 'country', 'name', 'people'],
    });
    expect(header('Name')).toHaveFocus();
    await user.keyboard('{Alt>}{ArrowLeft}{ArrowLeft}{/Alt}');
    expect(headers()).toEqual(['Code', 'Name', 'Country', 'People']);
    expect(header('Name')).toHaveFocus();
    expectHooksMatchSpec(container, 'TABLE');
  });

  it('UIC-TABLE-8.5 mirrors the keys right to left and ignores fixed columns', async () => {
    const user = userEvent.setup();
    renderCities({}, 'ar-EG');
    header('Name').focus();
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expect(headers()).toEqual(['Code', 'Country', 'Name', 'People']);
    header('People').focus();
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expect(headers()).toEqual(['Code', 'Country', 'Name', 'People']);
  });

  it('UIC-TABLE-8.4 drops a dragged label before or after another header', async () => {
    const onColumnLayoutChange = vi.fn();
    renderCities({ onColumnLayoutChange });
    const transfer = createDataTransfer();
    const people = content('People');
    box(people, 300, 100);
    const label = await startDrag('Country', transfer);
    expect(label).toHaveAttribute('draggable', 'true');
    expect(header('Country')).toHaveAttribute('data-dragging', 'true');
    expect(transfer.types).toContain('text/plain');
    drag('dragEnter', people, { transfer, clientX: 380 });
    const over = drag('dragOver', people, { transfer, clientX: 380 });
    expect(over.defaultPrevented).toBe(true);
    expect(header('People')).toHaveAttribute('data-drop-position', 'after');
    drag('dragOver', people, { transfer, clientX: 310 });
    expect(header('People')).toHaveAttribute('data-drop-position', 'before');
    drag('drop', people, { transfer, clientX: 380 });
    drag('dragEnd', label, { transfer });
    expect(headers()).toEqual(['Code', 'Name', 'People', 'Country']);
    expect(header('People')).not.toHaveAttribute('data-drop-position');
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-TABLE-8.4 refuses drops beside a column pinned to another edge or from another table', async () => {
    const onColumnLayoutChange = vi.fn();
    renderCities({ onColumnLayoutChange });
    const code = content('Code');
    box(code, 0, 80);
    const transfer = createDataTransfer();
    const label = await startDrag('Name', transfer);
    drag('dragEnter', code, { transfer, clientX: 10 });
    drag('drop', code, { transfer, clientX: 10 });
    drag('dragEnd', label, { transfer });
    expect(headers()).toEqual(['Code', 'Name', 'Country', 'People']);
    expect(header('People').querySelector('[draggable]')).toBeNull();

    const foreign = createDataTransfer();
    foreign.items.add('name', 'application/x-ui-table-column-other');
    const country = content('Country');
    box(country, 200, 100);
    drag('dragEnter', country, { transfer: foreign, clientX: 280 });
    drag('dragOver', country, { transfer: foreign, clientX: 280 });
    expect(header('Country')).not.toHaveAttribute('data-drop-position');
    drag('drop', country, { transfer: foreign, clientX: 280 });
    expect(onColumnLayoutChange).not.toHaveBeenCalled();
  });
});
