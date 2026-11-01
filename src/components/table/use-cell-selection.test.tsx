import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { NumberField } from '../number-field/number-field.js';
import { Slider } from '../slider/slider.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';
import type { TableCellEdit } from './use-cell-editing.js';

interface Item {
  id: string;
  name: string;
  count: number;
  note: string;
}

const items: Item[] = [
  { id: 'a', name: 'Apple', count: 1, note: 'red' },
  { id: 'b', name: 'Pear', count: 3, note: 'green' },
  { id: 'c', name: 'Plum', count: 6, note: 'blue' },
  { id: 'd', name: 'Fig', count: 9, note: 'brown' },
];

const columns: TableColumn<Item>[] = [
  { id: 'name', header: 'Name', allowsEditing: true },
  {
    id: 'count',
    header: 'Count',
    allowsEditing: true,
    validateValue: (value) =>
      typeof value === 'number' && value >= 0 ? null : 'Enter a count of 0 or more.',
  },
  { id: 'note', header: 'Note' },
];

const uncheckedColumns = columns.map((column) => ({ ...column, validateValue: undefined }));

type SheetProps = Partial<TableProps<Item>> & {
  onBatch?: (edits: readonly TableCellEdit<Item>[]) => void;
};

/** A spreadsheet that applies its batches, as a caller does. */
function Sheet({ onBatch, ...props }: SheetProps) {
  const [rows, setRows] = useState(items);
  const apply = (edits: readonly TableCellEdit<Item>[]) =>
    setRows((current) =>
      current.map((row) =>
        edits
          .filter((edit) => edit.row.id === row.id)
          .reduce((next, edit) => ({ ...next, [edit.columnId]: edit.value }), row),
      ),
    );
  return (
    <Table
      aria-label="Sheet"
      rows={rows}
      columns={columns}
      cellSelection="range"
      onCellsChange={(edits) => {
        onBatch?.(edits);
        apply(edits);
      }}
      onCellEdit={(edit) => apply([edit])}
      {...props}
    />
  );
}

const cell = (rowName: string, column: string) => {
  const row = screen.getByRole('row', { name: rowName });
  return row.querySelector<HTMLElement>(`[data-column="${column}"]`) as HTMLElement;
};
const selectedText = () =>
  [...document.querySelectorAll('[data-in-range]')].map((element) => element.textContent);
const position = (rowKey: string, columnId: string) => ({ rowKey, columnId });

function clipboard(data: Record<string, string> = {}) {
  return {
    setData: vi.fn((type: string, value: string) => {
      data[type] = value;
    }),
    getData: (type: string) => data[type] ?? '',
  };
}

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table spreadsheet mode', { timeout: 20_000 }, () => {
  it('UIC-TABLE-14.1 selects a pressed cell and extends the range with Shift and a press or the arrow keys', async () => {
    const user = userEvent.setup();
    const onSelectedRangeChange = vi.fn();
    const onSelectionChange = vi.fn();
    const { container } = render(
      <Sheet
        onSelectedRangeChange={onSelectedRangeChange}
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(cell('Apple', 'name'));
    expect(cell('Apple', 'name')).toHaveFocus();
    expect(onSelectedRangeChange).toHaveBeenLastCalledWith({
      anchor: position('a', 'name'),
      focus: position('a', 'name'),
    });
    expect(onSelectionChange).not.toHaveBeenCalled();
    await user.keyboard('{Shift>}');
    await user.click(cell('Pear', 'count'));
    await user.keyboard('{/Shift}');
    expect(selectedText()).toEqual(['Apple', '1', 'Pear', '3']);
    const corner = cell('Pear', 'count');
    expect(corner).toHaveAttribute('aria-selected', 'true');
    expect(corner).toHaveAttribute('data-range-bottom', 'true');
    expect(corner).toHaveAttribute('data-range-end', 'true');
    expect(cell('Apple', 'name')).toHaveAttribute('data-range-top', 'true');
    expect(cell('Apple', 'name')).toHaveAttribute('data-range-start', 'true');
    expect(within(corner).getByText('', { selector: '.ui-table__fill-handle' })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expectHooksMatchSpec(container, 'TABLE', { slots: ['fill-handle'] });
    await user.keyboard('{Shift>}{ArrowDown}{ArrowRight}{/Shift}');
    expect(selectedText()).toEqual([
      'Apple',
      '1',
      'red',
      'Pear',
      '3',
      'green',
      'Plum',
      '6',
      'blue',
    ]);
    expect(cell('Apple', 'name')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(selectedText()).toEqual(['Pear']);
  });

  it('UIC-TABLE-14.1 leaves presses on switches and editable content in a cell to them', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onSelectedRangeChange = vi.fn();
    const withControls: TableColumn<Item>[] = [
      ...columns.slice(0, 2),
      {
        id: 'note',
        header: 'Note',
        renderCell: (row) => (
          <>
            <span role="switch" aria-checked="false" tabIndex={0} onPointerDown={onToggle}>
              Flag {row.name}
            </span>
            <span
              suppressContentEditableWarning
              // React types allow no empty value; the attribute still counts as editable.
              ref={(node) => node?.setAttribute('contenteditable', '')}
            >
              {row.note}
            </span>
          </>
        ),
      },
    ];
    render(<Sheet columns={withControls} onSelectedRangeChange={onSelectedRangeChange} />);
    await user.click(screen.getByRole('switch', { name: 'Flag Pear' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    await user.click(screen.getByText('blue'));
    expect(onSelectedRangeChange).not.toHaveBeenCalled();
    expect(selectedText()).toEqual([]);
    await user.click(cell('Plum', 'name'));
    expect(onSelectedRangeChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-TABLE-14.1 leaves presses on a slider track and thumb and a scrub handle to them', () => {
    const onSelectedRangeChange = vi.fn();
    const withSurfaces: TableColumn<Item>[] = [
      ...columns.slice(0, 2),
      {
        id: 'note',
        header: 'Note',
        renderCell: (row) => (
          <>
            <Slider label={`Level ${row.name}`} defaultValue={row.count} maxValue={10} />
            <NumberField label={`Amount ${row.name}`} defaultValue={row.count} showScrubber />
          </>
        ),
      },
    ];
    render(<Sheet columns={withSurfaces} onSelectedRangeChange={onSelectedRangeChange} />);
    const note = cell('Pear', 'note');
    for (const surface of [
      '.ui-slider__thumb',
      '.ui-slider__track',
      '.ui-number-field__scrubber',
    ]) {
      const target = requireDefined(note.querySelector<HTMLElement>(surface));
      const pointerDown = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        isPrimary: true,
      });
      const reached = vi.fn();
      target.addEventListener('pointerdown', reached);
      fireEvent(target, pointerDown);
      expect(reached).toHaveBeenCalledOnce();
    }
    expect(onSelectedRangeChange).not.toHaveBeenCalled();
    expect(selectedText()).toEqual([]);
    expect(note).not.toHaveFocus();
  });

  it('UIC-TABLE-14.1 extends the range by dragging and takes a controlled range', async () => {
    const user = userEvent.setup();
    const onSelectedRangeChange = vi.fn();
    const { unmount } = render(
      <Sheet
        selectedRange={{ anchor: position('b', 'count'), focus: position('c', 'note') }}
        onSelectedRangeChange={onSelectedRangeChange}
      />,
    );
    expect(selectedText()).toEqual(['3', 'green', '6', 'blue']);
    await user.pointer({ keys: '[MouseLeft]', target: cell('Apple', 'name') });
    expect(onSelectedRangeChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ anchor: position('a', 'name') }),
    );
    expect(selectedText()).toEqual(['3', 'green', '6', 'blue']);
    unmount();
    render(<Sheet onSelectedRangeChange={onSelectedRangeChange} />);
    await user.pointer([
      { keys: '[MouseLeft>]', target: cell('Apple', 'name') },
      { target: cell('Pear', 'count') },
      { keys: '[/MouseLeft]' },
      { target: cell('Plum', 'note') },
    ]);
    expect(onSelectedRangeChange).toHaveBeenLastCalledWith({
      anchor: position('a', 'name'),
      focus: position('b', 'count'),
    });
    expect(selectedText()).toEqual(['Apple', '1', 'Pear', '3']);
  });

  it('UIC-TABLE-14.1 selects one cell at a time in cell mode and moves row focus onto cells', async () => {
    const user = userEvent.setup();
    render(
      <Sheet
        cellSelection="cell"
        defaultSelectedRange={{ anchor: position('c', 'name'), focus: position('c', 'name') }}
      />,
    );
    expect(selectedText()).toEqual(['Plum']);
    await user.click(cell('Apple', 'count'));
    await user.keyboard('{Shift>}');
    await user.click(cell('Pear', 'note'));
    await user.keyboard('{/Shift}');
    expect(selectedText()).toEqual(['green']);
    expect(document.querySelector('.ui-table__fill-handle')).toBeNull();
    act(() => screen.getByRole('row', { name: 'Plum' }).focus());
    expect(cell('Plum', 'note')).toHaveFocus();
  });

  it('UIC-TABLE-14.2 copies the selected cells as tab-separated text and HTML', async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    await user.click(cell('Apple', 'count'));
    await user.keyboard('{Shift>}{ArrowDown}{ArrowRight}{/Shift}');
    const data: Record<string, string> = {};
    fireEvent.copy(cell('Apple', 'count'), { clipboardData: clipboard(data) });
    expect(data['text/plain']).toBe('1\tred\n3\tgreen');
    expect(data['text/html']).toBe(
      '<table><tbody><tr><td>1</td><td>red</td></tr><tr><td>3</td><td>green</td></tr></tbody></table>',
    );
  });

  it('UIC-TABLE-14.3 pastes tab-separated text through the columns in one batch and selects it', async () => {
    const user = userEvent.setup();
    const onBatch = vi.fn();
    render(<Sheet onBatch={onBatch} />);
    await user.click(cell('Pear', 'name'));
    expect(cell('Pear', 'name')).toHaveFocus();
    await user.paste('Kiwi\t12\tgrey\nLime\t-4\r\n');
    expect(onBatch).toHaveBeenCalledTimes(1);
    expect(onBatch.mock.calls[0]?.[0]).toEqual([
      { row: items[1], columnId: 'name', value: 'Kiwi' },
      { row: items[1], columnId: 'count', value: 12 },
      { row: items[2], columnId: 'name', value: 'Lime' },
    ]);
    expect(selectedText()).toEqual(['Kiwi', '12', 'green', 'Lime', '6', 'blue']);
    await user.click(cell('Apple', 'count'));
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(cell('Apple', 'count')).toHaveFocus();
    await user.paste('5');
    expect(onBatch.mock.calls[1]?.[0]).toEqual([
      { row: items[0], columnId: 'count', value: 5 },
      { row: expect.objectContaining({ id: 'b' }), columnId: 'count', value: 5 },
    ]);
  });

  it('UIC-TABLE-14.4 clears the selected editable cells with Delete', async () => {
    const user = userEvent.setup();
    const onBatch = vi.fn();
    render(<Sheet onBatch={onBatch} columns={uncheckedColumns} />);
    await user.click(cell('Apple', 'count'));
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}{Delete}');
    expect(onBatch).toHaveBeenLastCalledWith([{ row: items[0], columnId: 'count', value: '' }]);
  });

  it('UIC-TABLE-14.5 cancels a fill without writing cells or leaving a preview', async () => {
    const user = userEvent.setup();
    const onBatch = vi.fn();
    render(<Sheet onBatch={onBatch} columns={uncheckedColumns} />);
    await user.click(cell('Apple', 'count'));
    const handle = requireDefined(document.querySelector('.ui-table__fill-handle'));
    await user.pointer([{ keys: '[MouseLeft>]', target: handle }, { target: cell('Fig', 'note') }]);
    expect(document.querySelector('[data-fill-target]')).not.toBeNull();
    fireEvent.pointerCancel(handle, { pointerId: 1 });
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onBatch).not.toHaveBeenCalled();
    expect(document.querySelector('[data-fill-target]')).toBeNull();
  });

  it.each([
    ['spreadsheet mode ends', { cellSelection: 'none' }],
    [
      'a row is inserted',
      {
        rows: [
          ...items.slice(0, 1),
          { id: 'x', name: 'Kiwi', count: 2, note: 'tan' },
          ...items.slice(1),
        ],
      },
    ],
    [
      'the source range is replaced',
      {
        selectedRange: {
          anchor: { rowKey: 'b', columnId: 'count' },
          focus: { rowKey: 'b', columnId: 'count' },
        },
      },
    ],
  ] satisfies [string, Partial<TableProps<Item>>][])(
    'UIC-TABLE-14.5 ends a fill without writing when %s',
    async (_, change) => {
      const user = userEvent.setup();
      const onCellsChange = vi.fn();
      const onSelectedRangeChange = vi.fn();
      const source = {
        anchor: { rowKey: 'a', columnId: 'count' },
        focus: { rowKey: 'a', columnId: 'count' },
      };
      const sheet = (props: Partial<TableProps<Item>>) => (
        <Table
          aria-label="Sheet"
          rows={items}
          columns={uncheckedColumns}
          cellSelection="range"
          selectedRange={source}
          onSelectedRangeChange={onSelectedRangeChange}
          onCellsChange={onCellsChange}
          {...props}
        />
      );
      const { rerender } = render(sheet({}));
      const handle = requireDefined(document.querySelector('.ui-table__fill-handle'));
      await user.pointer([
        { keys: '[MouseLeft>]', target: handle },
        { target: cell('Plum', 'count') },
      ]);
      expect(cell('Plum', 'count')).toHaveAttribute('data-fill-target', 'true');
      rerender(sheet(change));
      expect(document.querySelector('[data-fill-target]')).toBeNull();
      await user.pointer({ keys: '[/MouseLeft]' });
      expect(onCellsChange).not.toHaveBeenCalled();
      expect(onSelectedRangeChange).not.toHaveBeenCalled();
    },
  );

  it('UIC-TABLE-14.5 fills down on the D key of a non-Latin layout', async () => {
    const user = userEvent.setup();
    const onBatch = vi.fn();
    render(<Sheet onBatch={onBatch} columns={uncheckedColumns} />);
    await user.click(cell('Apple', 'name'));
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    // On a Cyrillic layout the D key types в.
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event types a key by its US layout and cannot press a Cyrillic letter on its key
    fireEvent.keyDown(document.activeElement as Element, { key: 'в', code: 'KeyD', ctrlKey: true });
    expect(onBatch).toHaveBeenLastCalledWith([
      expect.objectContaining({ columnId: 'name', value: 'Apple' }),
    ]);
  });

  it('UIC-TABLE-14.5 extends a fill and a range drag only from the pointer that started it', async () => {
    const user = userEvent.setup();
    const onBatch = vi.fn();
    render(<Sheet onBatch={onBatch} columns={uncheckedColumns} />);
    // user-event drives one mouse; a second finger is a pointer of its own.
    const otherPointer = { pointerId: 5, isPrimary: false };
    await user.click(cell('Apple', 'count'));
    const handle = requireDefined(document.querySelector('.ui-table__fill-handle'));
    await user.pointer([
      { keys: '[MouseLeft>]', target: handle },
      { target: cell('Pear', 'count') },
    ]);
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot move a second pointer
    fireEvent.pointerOver(cell('Fig', 'count'), otherPointer);
    expect(cell('Pear', 'count')).toHaveAttribute('data-fill-target', 'true');
    expect(cell('Fig', 'count')).not.toHaveAttribute('data-fill-target');
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onBatch).toHaveBeenLastCalledWith([{ row: items[1], columnId: 'count', value: 1 }]);
    await user.pointer([
      { keys: '[MouseLeft>]', target: cell('Apple', 'name') },
      { target: cell('Pear', 'name') },
    ]);
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot move a second pointer
    fireEvent.pointerOver(cell('Fig', 'note'), otherPointer);
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(selectedText()).toEqual(['Apple', 'Pear']);
  });

  it('UIC-TABLE-14.5 fills by dragging the fill handle and down and right with the keyboard', async () => {
    const user = userEvent.setup();
    const onBatch = vi.fn();
    render(<Sheet onBatch={onBatch} columns={uncheckedColumns} />);
    await user.click(cell('Apple', 'count'));
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    const handle = document.querySelector('.ui-table__fill-handle') as HTMLElement;
    await user.pointer([{ keys: '[MouseLeft>]', target: handle }, { target: cell('Fig', 'note') }]);
    expect(cell('Plum', 'count')).toHaveAttribute('data-fill-target', 'true');
    expect(cell('Fig', 'count')).toHaveAttribute('data-fill-target', 'true');
    expect(cell('Fig', 'note')).not.toHaveAttribute('data-fill-target');
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onBatch).toHaveBeenLastCalledWith([
      { row: items[2], columnId: 'count', value: 5 },
      { row: items[3], columnId: 'count', value: 7 },
    ]);
    expect(selectedText()).toEqual(['1', '3', '5', '7']);
    expect(document.querySelector('[data-fill-target]')).toBeNull();

    await user.click(cell('Plum', 'name'));
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}{Control>}d{/Control}');
    expect(onBatch).toHaveBeenLastCalledWith([
      { row: expect.objectContaining({ id: 'd' }), columnId: 'name', value: 'Plum' },
    ]);
    await user.click(cell('Apple', 'name'));
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}{Meta>}r{/Meta}');
    expect(onBatch).toHaveBeenLastCalledWith([
      { row: items[0], columnId: 'count', value: 'Apple' },
    ]);
  });

  it('UIC-TABLE-14.6 opens the editor by typing and moves on with Enter and Tab', async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    await user.click(cell('Apple', 'name'));
    await user.keyboard('K');
    const editor = screen.getByRole('textbox', { name: 'Name' });
    expect(editor).toHaveValue('K');
    await user.keyboard('iwi{Enter}');
    expect(cell('Pear', 'name')).toHaveFocus();
    expect(screen.getByRole('row', { name: 'Kiwi' })).toBeInTheDocument();
    await user.keyboard('{F2}{Tab}');
    expect(cell('Pear', 'count')).toHaveFocus();
    await user.keyboard('7{Shift>}{Enter}{/Shift}');
    expect(cell('Kiwi', 'count')).toHaveFocus();
    expect(cell('Pear', 'count')).toHaveTextContent('7');
    await user.keyboard('{Enter}{Shift>}{Tab}{/Shift}');
    expect(cell('Kiwi', 'name')).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('UIC-TABLE-14.7 keeps the editor open with the column message for a refused value', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(<Sheet onCellEdit={onCellEdit} />);
    await user.dblClick(cell('Apple', 'count'));
    const editor = screen.getByRole('textbox', { name: 'Count' });
    await user.clear(editor);
    await user.keyboard('-2{Enter}');
    expect(editor).toHaveAttribute('aria-invalid', 'true');
    expect(editor).toHaveAttribute('data-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a count of 0 or more.');
    expect(screen.getByRole('alert')).toHaveClass('ui-table__editor-message');
    expect(onCellEdit).not.toHaveBeenCalled();
    await user.click(cell('Plum', 'note'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(cell('Apple', 'count')).toHaveTextContent('1');
  });
});
