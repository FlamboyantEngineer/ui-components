import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { pressComposingKeys } from '../../../test/composition.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Table } from './table.js';
import type { TableCellValue, TableColumn } from './table-rows.js';
import type { TableCellEdit } from './use-cell-editing.js';

interface Fruit {
  id: string;
  name: string;
  weight: number;
  colour: string;
}

const fruit: Fruit[] = [
  { id: 'apple', name: 'Apple', weight: 30, colour: 'Red' },
  { id: 'pear', name: 'Pear', weight: 60, colour: 'Green' },
];

const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name' },
  { id: 'weight', header: 'Weight', allowsEditing: true },
  {
    id: 'colour',
    header: 'Colour',
    allowsEditing: true,
    renderEditor: (row, editor) => (
      <span>
        <button
          type="button"
          onClick={() => editor.commit('Blue')}
        >{`Blue for ${editor.label}`}</button>
        <button type="button" onClick={editor.cancel}>{`Keep ${String(editor.value)}`}</button>
        <input
          aria-label={`${row.name} colour`}
          autoFocus
          onKeyDown={(event) => {
            // The editor's own Escape clears its draft first.
            if (event.key !== 'Escape' || event.currentTarget.value === '') return;
            event.currentTarget.value = '';
            event.preventDefault();
          }}
        />
      </span>
    ),
  },
];

interface FruitsProps {
  onCellEdit: (edit: TableCellEdit<Fruit>) => void;
  disabledKeys?: readonly string[];
  cellSelection?: 'cell';
}

function Fruits({ onCellEdit, disabledKeys, cellSelection }: FruitsProps) {
  const [rows, setRows] = useState(fruit);
  return (
    <Table
      aria-label="Fruit"
      rows={rows}
      columns={columns}
      disabledKeys={disabledKeys}
      cellSelection={cellSelection}
      onCellEdit={(edit) => {
        onCellEdit(edit);
        setRows((current) =>
          current.map((row) => (row === edit.row ? { ...row, [edit.columnId]: edit.value } : row)),
        );
      }}
    />
  );
}

const cell = (text: string) => screen.getByRole('gridcell', { name: text });
const rowHeader = (text: string) => screen.getByRole('rowheader', { name: text });

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table cell editing', { timeout: 15_000 }, () => {
  it('UIC-TABLE-11.1 UIC-TABLE-11.2 edits and refocuses the row with the correct key type', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(
      <Table
        aria-label="Typed rows"
        rows={[
          { id: 1, name: 'Numeric row', weight: 10 },
          { id: '1', name: 'Text row', weight: 20 },
        ]}
        columns={[
          { id: 'name', header: 'Name' },
          { id: 'weight', header: 'Weight', allowsEditing: true },
        ]}
        onCellEdit={onCellEdit}
      />,
    );
    const numeric = screen.getByRole('row', { name: 'Numeric row' });
    const text = screen.getByRole('row', { name: 'Text row' });
    const textCell = within(text).getByRole('gridcell', { name: '20' });
    textCell.focus();
    await user.keyboard('{F2}');
    expect(within(text).getByRole('textbox', { name: 'Weight' })).toHaveValue('20');
    expect(within(numeric).queryByRole('textbox')).not.toBeInTheDocument();
    await user.keyboard('{Control>}a{/Control}25{Enter}');
    expect(requireDefined(onCellEdit.mock.lastCall)[0]).toMatchObject({
      row: { id: '1' },
      columnId: 'weight',
      value: 25,
    });
    expect(textCell).toHaveFocus();
  });

  it('UIC-TABLE-11.1 UIC-TABLE-11.2 opens with F2 and commits a number with Enter', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    const { container } = render(<Fruits onCellEdit={onCellEdit} />);
    cell('30').focus();
    await user.keyboard('{F2}');
    const input = screen.getByRole('textbox', { name: 'Weight' });
    expect(input).toHaveClass('ui-table__editor');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('30');
    expect(input.closest('[role="gridcell"]')).toHaveAttribute('data-editing', 'true');
    expectHooksMatchSpec(container, 'TABLE', { slots: ['editor'] });
    await user.keyboard('{Control>}a{/Control}45{Enter}');
    expect(onCellEdit).toHaveBeenCalledWith({ row: fruit[0], columnId: 'weight', value: 45 });
    expect(cell('45')).toHaveFocus();
    expect(cell('45')).not.toHaveAttribute('data-editing');
  });

  it('UIC-TABLE-11.1 UIC-TABLE-11.2 opens on Enter and a double click, cancels on Escape', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(<Fruits onCellEdit={onCellEdit} />);
    cell('60').focus();
    await user.keyboard('{Enter}');
    await user.keyboard('x{Escape}');
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(cell('60')).toHaveFocus();
    await user.dblClick(cell('30'));
    expect(screen.getByRole('textbox', { name: 'Weight' })).toHaveValue('30');
    await user.keyboard('{Control>}a{/Control}heavy');
    await user.click(rowHeader('Apple'));
    expect(onCellEdit).toHaveBeenCalledWith({ row: fruit[0], columnId: 'weight', value: 'heavy' });
    expect(rowHeader('Apple')).toHaveFocus();
  });

  it('UIC-TABLE-11.1 ignores cells of columns that do not allow editing', async () => {
    const user = userEvent.setup();
    render(<Fruits onCellEdit={() => {}} />);
    rowHeader('Pear').focus();
    await user.keyboard('{F2}');
    await user.dblClick(rowHeader('Pear'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('UIC-TABLE-11.3 draws a custom editor that commits, cancels and keys Escape', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(<Fruits onCellEdit={onCellEdit} />);
    cell('Red').focus();
    await user.keyboard('{F2}');
    const row = screen.getByRole('row', { name: 'Apple' });
    const draft = within(row).getByRole('textbox', { name: 'Apple colour' });
    expect(draft).toHaveFocus();
    await user.keyboard('Teal{Escape}');
    expect(draft).toHaveFocus();
    expect(draft).toHaveValue('');
    await user.keyboard('{Escape}');
    expect(cell('Red')).toHaveFocus();
    await user.keyboard('{F2}');
    await user.click(screen.getByRole('button', { name: 'Keep Red' }));
    expect(onCellEdit).not.toHaveBeenCalled();
    await user.dblClick(cell('Red'));
    await user.click(screen.getByRole('button', { name: 'Blue for Colour' }));
    expect(onCellEdit).toHaveBeenCalledWith({ row: fruit[0], columnId: 'colour', value: 'Blue' });
    expect(cell('Blue')).toBeInTheDocument();
  });

  it('UIC-TABLE-11.4 opens no editor on a disabled row by pointer, keyboard or typing', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(<Fruits onCellEdit={onCellEdit} disabledKeys={['apple']} cellSelection="cell" />);
    await user.dblClick(cell('30'));
    await user.dblClick(cell('Red'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    for (const key of ['{F2}', '{Enter}', '7']) {
      cell('30').focus();
      await user.keyboard(key);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    }
    expect(onCellEdit).not.toHaveBeenCalled();
    cell('60').focus();
    await user.keyboard('7{Enter}');
    expect(onCellEdit).toHaveBeenCalledWith({ row: fruit[1], columnId: 'weight', value: 7 });
  });

  it('UIC-TABLE-11.4 closes an open editor without an edit when its row becomes disabled', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    const { rerender } = render(<Fruits onCellEdit={onCellEdit} />);
    await user.dblClick(cell('30'));
    await user.keyboard('{Control>}a{/Control}45');
    rerender(<Fruits onCellEdit={onCellEdit} disabledKeys={['apple']} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(cell('30')).toHaveFocus();
    await user.dblClick(cell('Red'));
    expect(screen.queryByRole('textbox', { name: 'Apple colour' })).not.toBeInTheDocument();
    rerender(<Fruits onCellEdit={onCellEdit} />);
    await user.dblClick(cell('Red'));
    rerender(<Fruits onCellEdit={onCellEdit} disabledKeys={['apple']} />);
    expect(screen.queryByRole('button', { name: 'Blue for Colour' })).not.toBeInTheDocument();
    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it('UIC-TABLE-11.2 reports the untouched value of a boolean, date or empty cell as it is', async () => {
    interface Kept {
      id: string;
      name: string;
      value: TableCellValue;
    }
    const picked = new Date('2026-10-01T12:00:00Z');
    const kept: Kept[] = [
      { id: 'yes', name: 'Yes', value: true },
      { id: 'no', name: 'No', value: false },
      { id: 'day', name: 'Day', value: picked },
      { id: 'none', name: 'None', value: null },
    ];
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(
      <Table
        aria-label="Kept"
        rows={kept}
        columns={[
          { id: 'name', header: 'Name' },
          {
            id: 'value',
            header: 'Value',
            allowsEditing: true,
            renderCell: (row) => String(row.value),
          },
        ]}
        onCellEdit={onCellEdit}
      />,
    );
    const valueCell = (name: string) =>
      requireDefined(
        screen.getByRole('row', { name }).querySelector<HTMLElement>('[data-column="value"]'),
      );
    await user.dblClick(valueCell('Yes'));
    expect(screen.getByRole('textbox', { name: 'Value' })).toHaveValue('true');
    await user.keyboard('{Enter}');
    expect(onCellEdit).toHaveBeenLastCalledWith(expect.objectContaining({ value: true }));
    await user.dblClick(valueCell('No'));
    await user.click(document.body);
    expect(onCellEdit).toHaveBeenLastCalledWith(expect.objectContaining({ value: false }));
    await user.dblClick(valueCell('Day'));
    expect(screen.getByRole('textbox', { name: 'Value' })).toHaveValue(picked.toISOString());
    await user.keyboard('{Enter}');
    expect(onCellEdit.mock.lastCall?.[0].value).toBe(picked);
    await user.dblClick(valueCell('None'));
    await user.keyboard('{Enter}');
    expect(onCellEdit).toHaveBeenLastCalledWith(expect.objectContaining({ value: null }));
    await user.dblClick(valueCell('Yes'));
    await user.keyboard('{Control>}a{/Control}maybe{Enter}');
    expect(onCellEdit).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'maybe' }));
    await user.dblClick(valueCell('No'));
    await user.keyboard('x{Escape}');
    expect(onCellEdit).toHaveBeenCalledTimes(5);
  });

  it('UIC-TABLE-11.5 closes an editor whose row leaves the table, focusing the grid', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    const { rerender } = render(
      <Table aria-label="Fruit" rows={fruit} columns={columns} onCellEdit={onCellEdit} />,
    );
    await user.dblClick(cell('30'));
    await user.keyboard('{Control>}a{/Control}45');
    const pears = fruit.filter((row) => row.id !== 'apple');
    rerender(<Table aria-label="Fruit" rows={pears} columns={columns} onCellEdit={onCellEdit} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Fruit' }).contains(document.activeElement)).toBe(true);
    await user.dblClick(cell('60'));
    expect(screen.getByRole('textbox')).toHaveValue('60');
    await user.keyboard('{Escape}');
    rerender(<Table aria-label="Fruit" rows={fruit} columns={columns} onCellEdit={onCellEdit} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it('UIC-TABLE-11.5 closes an editor whose column stops allowing edits, focusing the cell', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    const locked = columns.map((column) =>
      column.id === 'weight' ? { ...column, allowsEditing: false } : column,
    );
    const { rerender } = render(
      <Table aria-label="Fruit" rows={fruit} columns={columns} onCellEdit={onCellEdit} />,
    );
    await user.dblClick(cell('30'));
    await user.keyboard('{Control>}a{/Control}45');
    rerender(<Table aria-label="Fruit" rows={fruit} columns={locked} onCellEdit={onCellEdit} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(cell('30')).toHaveFocus();
    rerender(<Table aria-label="Fruit" rows={fruit} columns={columns} onCellEdit={onCellEdit} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('textbox')).toHaveValue('30');
    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it('UIC-TABLE-11.2 UIC-TABLE-11.3 leaves Enter and Escape to an input method while it composes', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(<Fruits onCellEdit={onCellEdit} />);
    await user.dblClick(cell('30'));
    const input = screen.getByRole('textbox', { name: 'Weight' });
    await user.keyboard('{Control>}a{/Control}45');
    pressComposingKeys(input);
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onCellEdit).toHaveBeenCalledWith({ row: fruit[0], columnId: 'weight', value: 45 });
    await user.dblClick(cell('Red'));
    pressComposingKeys(screen.getByRole('textbox', { name: 'Apple colour' }));
    expect(screen.getByRole('textbox', { name: 'Apple colour' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
