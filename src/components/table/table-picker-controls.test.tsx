import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SelectField } from '../select-field/select-field.js';
import { Table } from './table.js';

describe('Table picker controls', () => {
  it('UIC-TABLE-3.4 opens a cell picker with ArrowDown and commits without selecting a row', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onChange = vi.fn();
    render(
      <>
        <Table
          aria-label="Fruit sizes"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
          columns={[
            { id: 'name', header: 'Name', isRowHeader: true, renderCell: (row) => row.name },
            {
              id: 'size',
              header: 'Size',
              renderCell: (row) => (
                <SelectField
                  label={`${row.name} size`}
                  defaultValue="small"
                  onChange={onChange}
                  options={[
                    { id: 'small', label: 'Small' },
                    { id: 'large', label: 'Large' },
                  ]}
                />
              ),
            },
          ]}
          rows={[
            { id: 'apple', name: 'Apple' },
            { id: 'banana', name: 'Banana' },
          ]}
        />
        <button>After table</button>
      </>,
    );
    const table = screen.getByRole('grid', { name: 'Fruit sizes' });
    const trigger = within(table).getByRole('button', { name: 'Small Apple size' });
    act(() => trigger.focus());
    await user.keyboard('{ArrowDown}');
    const list = await screen.findByRole('listbox');
    expect(table).not.toContainElement(list);
    expect(table.querySelector('.ui-select-field__trigger')).toBe(trigger);
    expect(onSelectionChange).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(within(table).getByRole('button', { name: 'Small Apple size' })).toBe(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    await user.click(await screen.findByRole('option', { name: 'Large' }));
    expect(onChange).toHaveBeenLastCalledWith('large');
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(onSelectionChange).not.toHaveBeenCalled();
    await user.tab();
    expect(trigger).not.toHaveFocus();
  });
});
