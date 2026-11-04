import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { stubTextLayout } from '../../../test/overflow-fixtures.js';
import type { Key } from '../../core/props.js';
import { OverflowList } from './overflow-list.js';

interface Fruit {
  id: Key;
  name: string;
}

const [ab, cd, ef, gh, ij] = [
  { id: 'a', name: 'Ab' },
  { id: 'b', name: 'Cd' },
  { id: 'c', name: 'Ef' },
  { id: 'd', name: 'Gh' },
  { id: 'e', name: 'Ij' },
] as const;

// Each name is 20 wide, like the "+N" indicator: a 60 wide row keeps two items beside it.
function Row({
  items,
  collapseFrom = 'end',
  room = 60,
}: {
  items: readonly Fruit[];
  collapseFrom?: 'start' | 'end';
  room?: number;
}) {
  return (
    <OverflowList
      data-room={room}
      role="group"
      aria-label="Fruit"
      items={items}
      getKey={(item) => item.id}
      collapseFrom={collapseFrom}
      renderItem={(item) => (
        <label>
          {item.name}
          <input />
        </label>
      )}
      renderOverflow={(hidden) => <button type="button">+{hidden.length}</button>}
    />
  );
}

function draft(name: string): HTMLElement {
  return screen.getByRole('textbox', { name });
}

beforeEach(() => {
  stubTextLayout();
});

describe('OverflowList item identity', () => {
  it.each([
    { collapseFrom: 'end' as const, items: [ab, cd, ef, gh], reordered: [cd, ab, ef, gh] },
    { collapseFrom: 'start' as const, items: [ab, cd, ef, gh], reordered: [ab, cd, gh, ef] },
  ])(
    'UIC-OVERFLOW-LIST-1.8 keeps drafts and focus with their items across a reorder from the $collapseFrom',
    async ({ collapseFrom, items, reordered }) => {
      const user = userEvent.setup();
      const { rerender } = render(<Row items={items} collapseFrom={collapseFrom} />);
      const [first, second] = collapseFrom === 'end' ? [ab, cd] : [ef, gh];
      await user.type(draft(first.name), 'one');
      await user.type(draft(second.name), 'two');
      rerender(<Row items={reordered} collapseFrom={collapseFrom} />);
      expect(draft(first.name)).toHaveValue('one');
      expect(draft(second.name)).toHaveValue('two');
      expect(draft(second.name)).toHaveFocus();
    },
  );

  it('UIC-OVERFLOW-LIST-1.8 keeps drafts and focus of surviving items across an insert and a delete', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Row items={[ab, cd, ef]} room={500} />);
    await user.type(draft('Cd'), 'two');
    await user.type(draft('Ef'), 'three');
    rerender(<Row items={[ij, ab, cd, ef]} room={500} />);
    expect(draft('Cd')).toHaveValue('two');
    expect(draft('Ef')).toHaveValue('three');
    expect(draft('Ef')).toHaveFocus();
    rerender(<Row items={[ij, ef]} room={500} />);
    expect(draft('Ef')).toHaveValue('three');
    expect(draft('Ef')).toHaveFocus();
    expect(draft('Ij')).toHaveValue('');
  });

  it('UIC-OVERFLOW-LIST-1.8 drops the state of an item that leaves for the indicator', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Row items={[ab, cd, ef]} />);
    await user.type(draft('Ab'), 'one');
    await user.type(draft('Cd'), 'two');
    rerender(<Row items={[ij, ab, cd, ef]} />);
    expect(draft('Ab')).toHaveValue('one');
    expect(screen.queryByRole('textbox', { name: 'Cd' })).not.toBeInTheDocument();
    rerender(<Row items={[ab, cd, ef]} />);
    expect(draft('Ab')).toHaveValue('one');
    expect(draft('Cd')).toHaveValue('');
  });

  it('UIC-OVERFLOW-LIST-1.8 tells a numeric key from the string of its digits', async () => {
    const user = userEvent.setup();
    const one = { id: 1, name: 'Ab' };
    const text = { id: '1', name: 'Cd' };
    const { rerender } = render(<Row items={[one, text]} room={500} />);
    await user.type(draft('Ab'), 'number');
    await user.type(draft('Cd'), 'string');
    rerender(<Row items={[text, one]} room={500} />);
    expect(draft('Ab')).toHaveValue('number');
    expect(draft('Cd')).toHaveValue('string');
    expect(draft('Cd')).toHaveFocus();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });
});
