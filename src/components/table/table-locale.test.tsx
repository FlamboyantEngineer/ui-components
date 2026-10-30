import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { Table } from './table.js';
import type { TableColumn } from './table-rows.js';

interface Word {
  id: string;
  word: string;
}

// Swedish orders ä as a letter after z; German orders it as a, so äa comes before ab.
const words: readonly Word[] = [
  { id: 'zed', word: 'z' },
  { id: 'umlaut', word: 'äa' },
  { id: 'plain', word: 'ab' },
];

const columns: TableColumn<Word>[] = [
  { id: 'word', header: 'Word', allowsSorting: true, filter: { type: 'set' } },
];

const cells = () =>
  screen.queryAllByRole('rowheader', { hidden: true }).map((cell) => cell.textContent);

function SortedWords({ locale }: { locale: string }) {
  return (
    <UiProvider locale={locale}>
      <Table
        aria-label="Words"
        rows={words}
        columns={columns}
        defaultSortDescriptor={{ column: 'word', direction: 'ascending' }}
      />
    </UiProvider>
  );
}

describe('Table locale', { timeout: 15_000 }, () => {
  it('UIC-TABLE-2.10 sorts text in the provider locale and follows a locale change', () => {
    const { rerender } = render(<SortedWords locale="sv-SE" />);
    expect(cells()).toEqual(['ab', 'z', 'äa']);
    rerender(<SortedWords locale="de-DE" />);
    expect(cells()).toEqual(['äa', 'ab', 'z']);
  });

  it('UIC-TABLE-2.10 orders groups in the provider locale', () => {
    render(
      <UiProvider locale="sv-SE">
        <Table aria-label="Words" rows={words} columns={columns} groupBy={['word']} />
      </UiProvider>,
    );
    const groups = screen
      .getAllByRole('row')
      .filter((row) => row.classList.contains('ui-table__group-row'))
      .map((row) => row.querySelector('.ui-table__group-label')?.textContent);
    expect(groups).toEqual(['Word: ab', 'Word: z', 'Word: äa']);
  });

  it('UIC-TABLE-2.10 lists set filter values in the provider locale', async () => {
    const user = userEvent.setup();
    render(
      <UiProvider locale="sv-SE">
        <Table aria-label="Words" rows={words} columns={columns} />
      </UiProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Filter word' }));
    const dialog = screen.getByRole('dialog', { name: 'Filter word' });
    expect(
      within(dialog)
        .getAllByRole('checkbox')
        .map((box) => box.getAttribute('value')),
    ).toEqual(['ab', 'z', 'äa']);
  });
});
