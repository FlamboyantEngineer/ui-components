import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
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

/** A drag event with the pointer position and data transfer jsdom's plain events lack. */
function dragEvent(type: 'dragStart' | 'dragOver' | 'drop', target: Element, clientX = 0) {
  const event = createEvent[type](target);
  const data = new Map<string, string>();
  Object.defineProperty(event, 'clientX', { value: clientX });
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      setData: (format: string, value: string) => data.set(format, value),
      getData: (format: string) => data.get(format) ?? '',
      effectAllowed: 'all',
      dropEffect: 'none',
      types: [],
    },
  });
  fireEvent(target, event);
  return event;
}

function box(element: Element, left: number, width: number) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    left,
    width,
    right: left + width,
    top: 0,
    bottom: 40,
    height: 40,
    x: left,
    y: 0,
    toJSON: () => ({}),
  });
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

  it('UIC-TABLE-8.4 drops a dragged label before or after another header', () => {
    const onColumnLayoutChange = vi.fn();
    renderCities({ onColumnLayoutChange });
    const label = header('Country').querySelector('.ui-table__column-label')!;
    expect(label).toHaveAttribute('draggable', 'true');
    const people = header('People');
    box(people, 300, 100);
    dragEvent('dragStart', label);
    const over = dragEvent('dragOver', people, 380);
    expect(over.defaultPrevented).toBe(true);
    expect(people).toHaveAttribute('data-drop-position', 'after');
    dragEvent('dragOver', people, 310);
    expect(people).toHaveAttribute('data-drop-position', 'before');
    dragEvent('drop', people, 380);
    expect(headers()).toEqual(['Code', 'Name', 'People', 'Country']);
    expect(people).not.toHaveAttribute('data-drop-position');
    expect(onColumnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-TABLE-8.4 refuses drops beside a column pinned to another edge', () => {
    renderCities();
    const label = header('Name').querySelector('.ui-table__column-label')!;
    const code = header('Code');
    box(code, 0, 80);
    dragEvent('dragStart', label);
    dragEvent('dragOver', code, 10);
    dragEvent('drop', code, 10);
    expect(headers()).toEqual(['Code', 'Name', 'Country', 'People']);
    expect(header('People').querySelector('[draggable]')).toBeNull();
  });
});
