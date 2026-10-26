import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Table, type TableColumn } from '../components/table/index.js';
import { Tree } from '../components/tree/tree.js';
import { getTableCell, toggleTreeItem } from './index.js';

interface Food {
  id: string;
  name: string;
  children?: Food[];
}

const food: Food[] = [
  { id: 'fruit', name: 'Fruit', children: [{ id: 'apple', name: 'Apple' }] },
  { id: 'nuts', name: 'Nuts' },
];

interface Fruit {
  id: string;
  name: string;
  colour: string;
  weight: number;
}

const fruit: Fruit[] = [
  { id: 'banana', name: 'Banana', colour: 'Yellow', weight: 120 },
  { id: 'apple', name: 'Apple', colour: 'Red', weight: 30 },
];

const columns: TableColumn<Fruit>[] = [
  { id: 'name', header: 'Name' },
  { id: 'colour', header: 'Colour' },
  { id: 'weight', header: 'Weight', align: 'end' },
];

describe('testing collections', () => {
  it('UIC-TESTING-2.5 expands and collapses a tree row from its expand button', async () => {
    const user = userEvent.setup();
    render(<Tree aria-label="Food" items={food} getTextValue={(item: Food) => item.name} />);
    const tree = screen.getByRole('treegrid', { name: 'Food' });
    await toggleTreeItem(user, tree, 'Fruit');
    expect(screen.getByRole('row', { name: 'Fruit' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('row', { name: 'Apple' })).toBeInTheDocument();
    await toggleTreeItem(user, tree, 'Fruit');
    expect(screen.getByRole('row', { name: 'Fruit' })).toHaveAttribute('aria-expanded', 'false');
    await expect(toggleTreeItem(user, tree, 'Nuts')).rejects.toThrow(
      'The tree row Nuts has no children to expand.',
    );
  });

  it('UIC-TESTING-2.6 finds a table cell by row and column names', () => {
    render(<Table aria-label="Fruit" rows={fruit} columns={columns} />);
    const table = screen.getByRole('grid', { name: 'Fruit' });
    expect(getTableCell(table, 'Apple', 'Colour')).toHaveTextContent('Red');
    expect(getTableCell(table, 'Banana', /^Weight/)).toHaveTextContent('120');
    expect(getTableCell(table, 'Banana', 'Name')).toHaveAttribute('role', 'rowheader');
  });
});
