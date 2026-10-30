import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { Tree, type TreeProps } from './tree.js';

interface Food {
  id: string;
  name: string;
}

const FOOD: Food[] = [
  { id: 'nuts', name: 'Nuts' },
  { id: 'oats', name: 'Oats' },
  { id: 'rice', name: 'Rice' },
];

type Changes = Partial<TreeProps<Food>>;

function renderTree(props: Changes = {}) {
  const onRename = vi.fn<(item: Food, name: string) => void>();
  const tree = (next: Changes) => (
    <Tree
      aria-label="Food"
      items={FOOD}
      getTextValue={(item) => item.name}
      onRename={onRename}
      {...next}
    />
  );
  const view = render(tree(props));
  return { onRename, update: (next: Changes) => view.rerender(tree(next)) };
}

const row = (label: string) => screen.getByRole('row', { name: label });
const field = () => screen.queryByRole('textbox');

/** Opens the name field of a row and types a new name in it. */
async function startRename(user: ReturnType<typeof userEvent.setup>, label: string, name: string) {
  await user.click(row(label));
  await user.keyboard(`{F2}{Control>}a{/Control}${name}`);
}

const tree = () => screen.getByRole('treegrid', { name: 'Food' });

// A row that still takes focus gets it back; a disabled row takes none, so the tree does.
const revocations: [string, Changes, () => HTMLElement][] = [
  ['canRename', { canRename: (item) => item.id !== 'nuts' }, () => row('Nuts')],
  ['disabledKeys', { disabledKeys: ['nuts'] satisfies Key[] }, tree],
];

describe('Tree renaming as rows change', () => {
  it.each(revocations)(
    'UIC-TREE-7.2 closes the field unrenamed when %s stops the row renaming, before Enter',
    async (_, revoked, focusTarget) => {
      const user = userEvent.setup();
      const { onRename, update } = renderTree();
      await startRename(user, 'Nuts', 'Seeds');
      update(revoked);
      expect(field()).not.toBeInTheDocument();
      expect(focusTarget()).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(onRename).not.toHaveBeenCalled();
      await user.keyboard('{ArrowDown}');
      expect(row('Oats')).toHaveFocus();
    },
  );

  it.each(revocations)(
    'UIC-TREE-7.2 closes the field unrenamed when %s stops the row renaming, before blur',
    async (_, revoked) => {
      const user = userEvent.setup();
      const { onRename, update } = renderTree();
      await startRename(user, 'Nuts', 'Seeds');
      update(revoked);
      await user.click(row('Oats'));
      expect(row('Oats')).toHaveFocus();
      expect(onRename).not.toHaveBeenCalled();
    },
  );

  it('UIC-TREE-7.2 checks eligibility again when Enter commits', async () => {
    const user = userEvent.setup();
    const locked = new Set<string>();
    const { onRename } = renderTree({ canRename: (item) => !locked.has(item.id) });
    await startRename(user, 'Nuts', 'Seeds');
    locked.add('nuts');
    await user.keyboard('{Enter}');
    expect(onRename).not.toHaveBeenCalled();
    expect(row('Nuts')).toHaveFocus();
  });

  it('UIC-TREE-7.2 checks eligibility again when leaving the field commits', async () => {
    const user = userEvent.setup();
    const locked = new Set<string>();
    const { onRename } = renderTree({ canRename: (item) => !locked.has(item.id) });
    await startRename(user, 'Nuts', 'Seeds');
    locked.add('nuts');
    await user.click(row('Rice'));
    expect(onRename).not.toHaveBeenCalled();
  });

  it('UIC-TREE-7.2 closes the field when its row leaves the tree', async () => {
    const user = userEvent.setup();
    const { onRename, update } = renderTree();
    await startRename(user, 'Nuts', 'Seeds');
    update({ items: FOOD.slice(1) });
    expect(field()).not.toBeInTheDocument();
    update({ items: FOOD });
    expect(field()).not.toBeInTheDocument();
    await user.click(row('Oats'));
    expect(onRename).not.toHaveBeenCalled();
  });

  it('UIC-TREE-7.2 renames the row as the owner draws it now', async () => {
    const user = userEvent.setup();
    const { onRename, update } = renderTree();
    await startRename(user, 'Nuts', 'Seeds');
    const current = FOOD.map((item) => ({ ...item }));
    update({ items: current });
    expect(field()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRename).toHaveBeenCalledExactlyOnceWith(current[0], 'Seeds');
    expect(onRename.mock.calls[0]?.[0]).not.toBe(FOOD[0]);
  });
});
