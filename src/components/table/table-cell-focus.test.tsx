import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlusGlyph } from '../../core/glyphs.js';
import { Button } from '../button/button.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Entry {
  id: string;
  label: string;
  children?: Entry[];
}

const columns: TableColumn<Entry>[] = [
  { id: 'name', header: 'Name', isRowHeader: true, getValue: (entry) => entry.label },
];
const flat: Entry[] = [
  { id: 'first', label: 'First' },
  { id: 'second', label: 'Second' },
];
const nested: Entry[] = [
  { id: 'section', label: 'Section', children: [{ id: 'entry', label: 'Entry' }] },
];

function AddButton({ entry, isDisabled = false }: { entry: Entry; isDisabled?: boolean }) {
  return (
    <Button
      icon={PlusGlyph}
      label={`Add to ${entry.label}`}
      tooltip={`Add to ${entry.label}`}
      focusableWhenDisabled
      isDisabled={isDisabled}
      onPress={() => {}}
    />
  );
}

function EntryTable({
  rows,
  isDisabled = false,
  ...props
}: Partial<TableProps<Entry>> & { rows: Entry[]; isDisabled?: boolean }) {
  return (
    <Table
      aria-label="Entries"
      rows={rows}
      columns={columns}
      getChildRows={(entry) => entry.children}
      expandedKeys={['section', 'more']}
      renderRowActions={(entry) =>
        entry.children ? null : <AddButton entry={entry} isDisabled={isDisabled} />
      }
      {...props}
    />
  );
}

// Full React Aria tables are slow in jsdom on a busy machine.
describe('Table cell focus', { timeout: 15_000 }, () => {
  it('UIC-TABLE-3.4 keeps focus on a control focused in a flat row after the first', async () => {
    render(<EntryTable rows={flat} />);
    const button = screen.getByRole('button', { name: 'Add to Second' });
    await act(async () => button.focus());
    expect(button).toHaveFocus();
  });

  it('UIC-TABLE-3.4 keeps focus on a control focused in a nested row', async () => {
    render(<EntryTable rows={nested} />);
    const button = screen.getByRole('button', { name: 'Add to Entry' });
    await act(async () => button.focus());
    expect(button).toHaveFocus();
  });

  it('UIC-TABLE-3.4 keeps focus and the element when the focused control becomes unavailable', async () => {
    const { rerender } = render(<EntryTable rows={nested} />);
    const button = screen.getByRole('button', { name: 'Add to Entry' });
    await act(async () => button.focus());
    rerender(<EntryTable rows={nested} isDisabled />);
    expect(screen.getByRole('button', { name: 'Add to Entry' })).toBe(button);
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveFocus();
    rerender(<EntryTable rows={nested} />);
    expect(button).not.toHaveAttribute('aria-disabled');
    expect(button).toHaveFocus();
  });

  it('UIC-TABLE-3.4 keeps focus and the element when a section is appended', async () => {
    const { rerender } = render(<EntryTable rows={nested} />);
    const button = screen.getByRole('button', { name: 'Add to Entry' });
    await act(async () => button.focus());
    const more: Entry = { id: 'more', label: 'More', children: [{ id: 'extra', label: 'Extra' }] };
    rerender(<EntryTable rows={[...nested, more]} />);
    expect(screen.getByRole('button', { name: 'Add to Extra' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Entry' })).toBe(button);
    expect(button).toHaveFocus();
  });

  it('UIC-TABLE-3.4 moves on with the arrow keys from a focused control', async () => {
    const user = userEvent.setup();
    render(<EntryTable rows={flat} />);
    const button = screen.getByRole('button', { name: 'Add to First' });
    await act(async () => button.focus());
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Add to Second' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('rowheader', { name: 'Second' })).toHaveFocus();
  });

  it('UIC-TABLE-3.4 runs a focused control by keyboard and pointer without moving focus', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <EntryTable
        rows={nested}
        renderRowActions={(entry) =>
          entry.children ? null : <Button onPress={() => onPress(entry.id)}>Add</Button>
        }
      />,
    );
    const button = screen.getByRole('button', { name: 'Add' });
    await act(async () => button.focus());
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledWith('entry');
    expect(button).toHaveFocus();
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(button).toHaveFocus();
  });
});
