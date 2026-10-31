import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { pressComposingKeys } from '../../../test/composition.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Tree } from './tree.js';
import type { TreeProps } from './tree-props.js';

interface Food {
  id: string;
  name: string;
  children?: Food[];
}

const FOOD: Food[] = [
  { id: 'fruit', name: 'Fruit', children: [{ id: 'apple', name: 'Apple' }] },
  { id: 'nuts', name: 'Nuts' },
  { id: 'oats', name: 'Oats' },
];

function FoodTree(props: Partial<TreeProps<Food>>) {
  return <Tree aria-label="Food" items={FOOD} getTextValue={(item) => item.name} {...props} />;
}

const row = (label: string) => screen.getByRole('row', { name: label });

describe('Tree renaming', () => {
  it('UIC-TREE-7.1 renames a row from the field F2 opens and returns focus to it', async () => {
    const onRename = vi.fn();
    const { container } = render(<FoodTree onRename={onRename} />);
    await userEvent.tab();
    expect(row('Fruit')).toHaveFocus();
    await userEvent.keyboard('{F2}');
    const field = screen.getByRole('textbox', { name: 'Rename Fruit' });
    expect(field).toHaveFocus();
    expect(field).toHaveValue('Fruit');
    expect(field).toHaveClass('ui-tree__rename-input');
    expect(field.closest('.ui-tree__label')).not.toBeNull();
    expectHooksMatchSpec(container, 'TREE', { slots: ['rename-input'] });

    // Typed keys edit the name: no typeahead, no expansion.
    await userEvent.keyboard('{Control>}a{/Control}Berries{ArrowRight} {Enter}');
    expect(onRename).toHaveBeenCalledWith(FOOD[0], 'Berries');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(row('Fruit')).toHaveFocus();
    expect(row('Fruit')).toHaveAttribute('aria-expanded', 'false');

    await userEvent.keyboard('{F2}Grains{Escape}');
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(row('Fruit')).toHaveFocus();
  });

  it('UIC-TREE-7.1 renames on blur, ignores unchanged or blank names and refused rows', async () => {
    const onRename = vi.fn();
    render(<FoodTree onRename={onRename} canRename={(item) => item.id !== 'oats'} />);
    await userEvent.click(row('Nuts'));
    await userEvent.keyboard('{F2}');
    await userEvent.keyboard('{Control>}a{/Control}Seeds');
    await userEvent.click(row('Fruit'));
    expect(onRename).toHaveBeenLastCalledWith(FOOD[1], 'Seeds');

    await userEvent.click(row('Nuts'));
    await userEvent.keyboard('{F2}{Enter}');
    await userEvent.keyboard('{F2}{Control>}a{/Control}   {Enter}');
    expect(onRename).toHaveBeenCalledTimes(1);

    await userEvent.click(row('Oats'));
    await userEvent.keyboard('{F2}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('UIC-TREE-7.1 leaves F2 alone without onRename', async () => {
    render(<FoodTree />);
    await userEvent.tab();
    await userEvent.keyboard('{F2}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('UIC-TREE-7.1 leaves Enter and Escape to an input method while it composes', async () => {
    const onRename = vi.fn();
    render(<FoodTree onRename={onRename} />);
    await userEvent.tab();
    await userEvent.keyboard('{F2}{Control>}a{/Control}Nuts and seeds');
    const field = screen.getByRole('textbox', { name: 'Rename Fruit' });
    pressComposingKeys(field);
    expect(onRename).not.toHaveBeenCalled();
    expect(field).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onRename).toHaveBeenCalledWith(FOOD[0], 'Nuts and seeds');
  });
});
