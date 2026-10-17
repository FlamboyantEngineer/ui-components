import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ProseTable } from './prose-table.js';

const header = [
  { key: 'fruit', content: 'Fruit' },
  { key: 'colour', content: 'Colour' },
];
const rows = [
  {
    key: 'apple',
    cells: [
      { key: 'fruit', content: <strong>Apple</strong> },
      { key: 'colour', content: 'Red' },
    ],
  },
  {
    key: 'pear',
    cells: [
      { key: 'fruit', content: <a href="#pear">Pear</a> },
      { key: 'colour', content: 'Green' },
    ],
  },
];

describe('ProseTable', () => {
  it('UIC-PROSE-TABLE-1.1 renders column headings and body rows with their content', () => {
    const { container } = render(<ProseTable header={header} rows={rows} />);
    const table = container.querySelector('table') as HTMLElement;
    expect(table).toHaveClass('ui-prose-table');
    const headings = [...table.querySelectorAll('thead > tr > th')];
    expect(headings.map((heading) => heading.textContent)).toEqual(['Fruit', 'Colour']);
    expect(headings.every((heading) => heading.getAttribute('scope') === 'col')).toBe(true);
    const bodyRows = table.querySelectorAll('tbody > tr');
    expect(bodyRows).toHaveLength(2);
    expect(
      [...(bodyRows[0]?.querySelectorAll('td') ?? [])].map((cell) => cell.textContent),
    ).toEqual(['Apple', 'Red']);
    expect(table.querySelector('tbody strong')).toHaveTextContent('Apple');
    expectHooksMatchSpec(container, 'PROSE-TABLE');
  });

  it('UIC-PROSE-TABLE-1.2 pads short rows with empty cells', () => {
    const { container } = render(
      <ProseTable
        header={header}
        rows={[{ key: 'plum', cells: [{ key: 'fruit', content: 'Plum' }] }]}
      />,
    );
    const cells = container.querySelectorAll('tbody td');
    expect(cells).toHaveLength(2);
    expect(cells[1]?.textContent).toBe('');
  });

  it('UIC-PROSE-TABLE-1.3 keeps native table semantics and cell controls', () => {
    render(<ProseTable header={header} rows={rows} />);
    const table = screen.getByRole('table');
    expect(table).not.toHaveAttribute('role');
    expect(table).not.toHaveAttribute('tabindex');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Fruit', 'Colour']);
    expect(within(table).queryAllByRole('rowheader')).toHaveLength(0);
    expect(within(table).getAllByRole('cell')).toHaveLength(4);
    expect(within(table).getByRole('link', { name: 'Pear' })).toHaveAttribute('href', '#pear');
    expect(document.querySelector('[role="grid"], [aria-live]')).toBeNull();
  });

  it('UIC-PROSE-TABLE-1.4 appends the caller class and forwards id, name and data attributes', () => {
    const { container } = render(
      <ProseTable
        header={header}
        rows={rows}
        className="caller"
        id="fruit-table"
        aria-label="Fruit colours"
        data-testid="probe"
      />,
    );
    const table = container.querySelector('table');
    expect(table).toHaveClass('ui-prose-table', 'caller');
    expect(table).toHaveAttribute('id', 'fruit-table');
    expect(table).toHaveAttribute('data-testid', 'probe');
    expect(screen.getByRole('table', { name: 'Fruit colours' })).toBe(table);
    expectHooksMatchSpec(container, 'PROSE-TABLE');
  });
});
