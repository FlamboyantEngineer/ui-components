import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../button/button.js';
import { Modal, ModalTrigger } from '../modal/modal.js';
import { SearchField } from '../search-field/search-field.js';
import { Table } from './table.js';

function FilterTable({ onSort }: { onSort: () => void }) {
  const [query, setQuery] = useState('');
  return (
    <Table
      aria-label="Fruit"
      selectionMode="none"
      onSortChange={onSort}
      columns={[
        {
          id: 'name',
          header: <SearchField label="Filter fruit" value={query} onChange={setQuery} />,
          allowsSorting: true,
          renderCell: (row) => row.name,
        },
      ]}
      rows={[{ id: 'one', name: 'Apple' }].filter((row) =>
        row.name.toLowerCase().includes(query.toLowerCase()),
      )}
    />
  );
}

describe('Table header controls', () => {
  it('UIC-TABLE-3.4 keeps text editing in a sortable header and sorts the header directly', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(<FilterTable onSort={onSort} />);
    const field = screen.getByRole<HTMLInputElement>('searchbox', { name: 'Filter fruit' });
    await user.click(field);
    expect(onSort).not.toHaveBeenCalled();
    await user.keyboard('Apple{End}{ArrowLeft}x');
    expect(field).toHaveValue('Applxe');
    expect(field).toHaveFocus();
    await user.clear(field);
    await user.keyboard('Apple {Enter}');
    expect(field).toHaveValue('Apple ');
    expect(field).toHaveFocus();
    expect(onSort).not.toHaveBeenCalled();
    await user.clear(field);
    const header = screen.getByRole('columnheader');
    await act(async () => header.focus());
    await user.keyboard('{Enter}');
    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it.each(['Control', 'Meta'])(
    'UIC-TABLE-3.4 passes %s+Enter from a header field to the enclosing modal',
    async (modifier) => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      const onSave = vi.fn();
      render(
        <ModalTrigger>
          <Button>Filter</Button>
          <Modal
            title="Filter fruit"
            primaryAction={{
              label: 'Apply',
              onPress: (close) => {
                onSave();
                close();
              },
            }}
          >
            <FilterTable onSort={onSort} />
          </Modal>
        </ModalTrigger>,
      );
      await user.click(screen.getByRole('button', { name: 'Filter' }));
      const dialog = await screen.findByRole('dialog', { name: 'Filter fruit' });
      await user.click(within(dialog).getByRole('searchbox', { name: 'Filter fruit' }));
      expect(onSort).not.toHaveBeenCalled();
      await user.keyboard(`Apple{${modifier}>}{Enter}{/${modifier}}`);
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSort).not.toHaveBeenCalled();
      await waitFor(() => expect(dialog).not.toBeInTheDocument());
    },
  );
});
