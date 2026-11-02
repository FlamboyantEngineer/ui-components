import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Button } from '../button/button.js';
import { Table } from './table.js';

const rows = [
  { id: 'alpha', name: 'Alpha' },
  { id: 'blue', name: 'Blue' },
];
const columns = [{ id: 'name', header: 'Name' }];

it.each([undefined, false, true])(
  'UIC-TABLE-3.5 reports repeated pointer and keyboard selection only when enabled=%s',
  async (enabled) => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Table
        aria-label="Repeated choices"
        rows={rows}
        columns={columns}
        selectionMode="multiple"
        selectionBehavior="replace"
        selectedKeys={new Set(['alpha'])}
        allowDuplicateSelectionEvents={enabled}
        onSelectionChange={onSelectionChange}
      />,
    );
    const row = screen.getByRole('row', { name: 'Alpha' });
    await user.click(row);
    await user.click(row);
    await user.keyboard('{Enter}{Enter}');
    expect(onSelectionChange).toHaveBeenCalledTimes(enabled ? 4 : 0);
    for (const [keys] of onSelectionChange.mock.calls) expect(keys).toEqual(new Set(['alpha']));
  },
);

it('UIC-TABLE-3.5 suppresses passive controlled rerenders, disabled rows and nested controls', async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  const onPress = vi.fn();
  const props = {
    'aria-label': 'Repeated choices',
    rows,
    selectionMode: 'multiple' as const,
    selectionBehavior: 'replace' as const,
    allowDuplicateSelectionEvents: true,
    onSelectionChange,
    disabledKeys: ['blue'],
    columns: [
      { id: 'name', header: 'Name' },
      {
        id: 'actions',
        header: 'Actions',
        renderCell: () => <Button onPress={onPress}>Inspect</Button>,
      },
    ],
  };
  const { rerender } = render(<Table {...props} selectedKeys={new Set(['alpha'])} />);
  rerender(<Table {...props} selectedKeys={new Set(['alpha'])} />);
  expect(onSelectionChange).not.toHaveBeenCalled();
  await user.click(screen.getByRole('row', { name: 'Blue' }));
  const row = screen.getByRole('row', { name: 'Alpha' });
  await user.click(within(row).getByRole('button', { name: 'Inspect' }));
  expect(onPress).toHaveBeenCalledOnce();
  expect(onSelectionChange).not.toHaveBeenCalled();
});
