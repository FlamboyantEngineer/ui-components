import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table } from './table.js';
import type { TableColumn } from './table-rows.js';
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
        <input aria-label={`${row.name} colour`} autoFocus />
      </span>
    ),
  },
];

function Fruits({ onCellEdit }: { onCellEdit: (edit: TableCellEdit<Fruit>) => void }) {
  const [rows, setRows] = useState(fruit);
  return (
    <Table
      aria-label="Fruit"
      rows={rows}
      columns={columns}
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
    expect(onCellEdit.mock.lastCall![0]).toMatchObject({
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
    expect(within(row).getByRole('textbox', { name: 'Apple colour' })).toHaveFocus();
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
});
