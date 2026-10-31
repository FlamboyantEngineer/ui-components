import { MinusGlyph, MoreGlyph, PlusGlyph } from '../../core/glyphs.js';
import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { Button } from '../button/button.js';
import { Tree } from './tree.js';
import type { TreeItemState, TreeProps } from './tree-props.js';

interface Food {
  id: string;
  name: string;
  href?: string;
  children?: Food[];
}

const FOOD: Food[] = [
  {
    id: 'fruit',
    name: 'Fruit',
    children: [
      { id: 'apple', name: 'Apple' },
      { id: 'pear', name: 'Pear' },
    ],
  },
  { id: 'vegetables', name: 'Vegetables', children: [{ id: 'kale', name: 'Kale' }] },
  { id: 'nuts', name: 'Nuts' },
];

const name = (item: Food) => item.name;

function FoodTree(props: Partial<TreeProps<Food>>) {
  return <Tree aria-label="Food" items={FOOD} getTextValue={name} {...props} />;
}

const row = (label: string) => screen.getByRole('row', { name: label });
const rowNames = () =>
  screen.queryAllByRole('row').map((element) => element.getAttribute('aria-label'));

describe('Tree', () => {
  it('UIC-TREE-1.1 renders a named tree grid with one row per visible item', () => {
    const { container } = render(<FoodTree defaultExpandedKeys={['fruit']} />);
    expect(screen.getByRole('treegrid', { name: 'Food' })).toHaveClass('ui-tree');
    expect(rowNames()).toEqual(['Fruit', 'Apple', 'Pear', 'Vegetables', 'Nuts']);
    expect(row('Fruit')).toHaveAttribute('aria-level', '1');
    expect(row('Fruit')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Apple')).toHaveAttribute('aria-level', '2');
    expect(row('Apple')).not.toHaveAttribute('aria-expanded');
    expect(row('Vegetables')).toHaveAttribute('aria-expanded', 'false');
    expectHooksMatchSpec(container, 'TREE', {
      slots: ['item', 'expand', 'expand-spacer', 'label'],
    });
  });

  it('UIC-TREE-1.1 reads children through a caller accessor', () => {
    const groups = [{ id: 'g', title: 'Group', entries: [{ id: 'e', title: 'Entry' }] }];
    type Entry = { id: string; title: string; entries?: Entry[] };
    render(
      <Tree<Entry>
        aria-label="Groups"
        items={groups}
        getTextValue={(item) => item.title}
        getChildren={(item) => item.entries}
        defaultExpandedKeys={['g']}
      />,
    );
    expect(rowNames()).toEqual(['Group', 'Entry']);
  });

  it('UIC-TREE-1.2 draws icon, label, meta and actions slots and publishes each row depth', () => {
    const { container } = render(
      <FoodTree
        defaultExpandedKeys={['fruit']}
        getIcon={(item, state) =>
          item.children ? (
            state.isExpanded ? (
              MinusGlyph
            ) : (
              PlusGlyph
            )
          ) : (
            <svg role="img" aria-label={`${item.name} icon`} />
          )
        }
        renderLabel={(item) => <strong>{item.name}</strong>}
        renderMeta={(item) => (item.id === 'apple' ? 'Red' : null)}
        renderActions={(item) =>
          item.id === 'pear' ? <Button icon={MoreGlyph} label={`More for ${item.name}`} /> : null
        }
      />,
    );
    const fruit = row('Fruit');
    expect(fruit.querySelector('.ui-tree__icon')).toHaveAttribute('data-glyph', 'minus');
    expect(screen.getByRole('img', { name: 'Apple icon', hidden: true }).parentElement).toHaveClass(
      'ui-tree__icon',
    );
    expect(within(row('Apple')).getByText('Apple').tagName).toBe('STRONG');
    expect(row('Apple').querySelector('.ui-tree__meta')).toHaveTextContent('Red');
    expect(row('Pear').querySelector('.ui-tree__meta')).toBeNull();
    expect(
      within(row('Pear')).getByRole('button', { name: 'More for Pear' }).parentElement,
    ).toHaveClass('ui-tree__actions');
    expect(row('Apple').querySelector('.ui-tree__actions')).toBeNull();
    expect(fruit.style.getPropertyValue('--ui-tree-level')).toBe('1');
    expect(row('Apple').style.getPropertyValue('--ui-tree-level')).toBe('2');
    expectHooksMatchSpec(container, 'TREE', {
      slots: ['item', 'expand', 'expand-spacer', 'icon', 'label', 'meta', 'actions'],
    });
  });

  it('UIC-TREE-1.2 passes each row state to the render callbacks', () => {
    const states = new Map<string, TreeItemState>();
    render(
      <FoodTree
        defaultExpandedKeys={['fruit']}
        selectionMode="single"
        defaultSelectedKeys={['apple']}
        disabledKeys={['pear']}
        currentKey="nuts"
        renderMeta={(item, state) => {
          states.set(item.id, state);
          return null;
        }}
      />,
    );
    expect(states.get('fruit')).toEqual({
      isExpanded: true,
      hasChildItems: true,
      level: 1,
      isSelected: false,
      isDisabled: false,
      isFocusVisible: false,
      isCurrent: false,
    });
    expect(states.get('apple')).toMatchObject({ level: 2, isSelected: true, hasChildItems: false });
    expect(states.get('pear')).toMatchObject({ isDisabled: true });
    expect(states.get('nuts')).toMatchObject({ isCurrent: true, isExpanded: false });
  });

  it('UIC-TREE-1.3 draws chevrons or plus and minus as expand glyphs', () => {
    const { container, rerender } = render(<FoodTree defaultExpandedKeys={['fruit']} />);
    const glyphs = () =>
      [...container.querySelectorAll('.ui-tree__expand .ui-icon')].map((icon) =>
        icon.getAttribute('data-glyph'),
      );
    expect(screen.getByRole('treegrid')).toHaveAttribute('data-expand-glyph', 'chevron');
    expect(glyphs()).toEqual(['chevron-down', 'chevron-right']);
    rerender(<FoodTree defaultExpandedKeys={['fruit']} expandGlyph="plus-minus" />);
    expect(screen.getByRole('treegrid')).toHaveAttribute('data-expand-glyph', 'plus-minus');
    expect(glyphs()).toEqual(['minus', 'plus']);
  });

  it('UIC-TREE-2.1 expands from the expand button, the arrow keys and a press on a branch row', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <UiProvider messages={{ expand: 'Open', collapse: 'Close' }}>
        <FoodTree onExpandedChange={onExpandedChange} />
      </UiProvider>,
    );
    const button = within(row('Fruit')).getByRole('button', { name: 'Open Fruit' });
    await user.click(button);
    expect(row('Fruit')).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['fruit']));
    expect(within(row('Fruit')).getByRole('button', { name: 'Close Fruit' })).toBeInTheDocument();
    expect(rowNames()).toContain('Apple');

    await user.click(row('Vegetables'));
    expect(row('Vegetables')).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(row('Vegetables')).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{ArrowRight}');
    expect(row('Vegetables')).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-TREE-2.1 follows controlled expansion', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <FoodTree expandedKeys={['vegetables']} onExpandedChange={onExpandedChange} />,
    );
    expect(rowNames()).toEqual(['Fruit', 'Vegetables', 'Kale', 'Nuts']);
    await user.click(within(row('Fruit')).getByRole('button'));
    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['vegetables', 'fruit']));
    expect(row('Fruit')).toHaveAttribute('aria-expanded', 'false');
    rerender(<FoodTree expandedKeys={['fruit']} onExpandedChange={onExpandedChange} />);
    expect(rowNames()).toEqual(['Fruit', 'Apple', 'Pear', 'Vegetables', 'Nuts']);
  });

  it('UIC-TREE-2.2 offers expansion for children that are not loaded yet, with a loading row', async () => {
    vi.stubGlobal('IntersectionObserver', function createObserver() {
      return { observe() {}, disconnect() {} };
    });
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container, rerender } = render(
      <FoodTree hasChildItems={(item) => item.id === 'nuts'} onExpandedChange={onExpandedChange} />,
    );
    expect(row('Nuts')).toHaveAttribute('aria-expanded', 'false');
    await user.click(within(row('Nuts')).getByRole('button'));
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['nuts']));
    expect(row('Nuts')).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.ui-tree__loader')).toBeNull();
    rerender(
      <FoodTree
        hasChildItems={(item) => item.id === 'nuts'}
        isItemPending={(item) => item.id === 'nuts'}
        defaultExpandedKeys={['nuts']}
      />,
    );
    const loader = container.querySelector('.ui-tree__loader') as HTMLElement;
    expect(loader).toHaveAttribute('role', 'row');
    expect(loader).toHaveTextContent('Loading');
    expect(within(loader).getByRole('status')).toHaveClass('ui-empty-state');
    expect(loader.style.getPropertyValue('--ui-tree-level')).toBe('2');
    expectHooksMatchSpec(container, 'TREE', { slots: ['loader'] });
    vi.unstubAllGlobals();
  });

  it('UIC-TREE-2.3 persists uncontrolled expansion through the provider storage', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const view = (props: Partial<TreeProps<Food>> = {}) => (
      <UiProvider storage={storage}>
        <FoodTree persistKey="food-tree" defaultExpandedKeys={['vegetables']} {...props} />
      </UiProvider>
    );
    const { unmount } = render(view());
    expect(rowNames()).toContain('Kale');
    await user.click(within(row('Fruit')).getByRole('button'));
    expect(JSON.parse(storage.getItem('food-tree') ?? 'null')).toEqual(['vegetables', 'fruit']);
    unmount();

    const { unmount: unmountSecond } = render(view());
    expect(rowNames()).toEqual(['Fruit', 'Apple', 'Pear', 'Vegetables', 'Kale', 'Nuts']);
    unmountSecond();

    storage.setItem('food-tree', '{"not":"keys"}');
    const { unmount: unmountThird } = render(view());
    expect(rowNames()).toEqual(['Fruit', 'Vegetables', 'Kale', 'Nuts']);
    unmountThird();

    storage.setItem('food-tree', '[]');
    render(view({ expandedKeys: ['fruit'] }));
    await user.click(within(row('Vegetables')).getByRole('button'));
    expect(storage.getItem('food-tree')).toBe('[]');
  });

  it('UIC-TREE-3.1 is one tab stop with arrow, Home, End and typeahead navigation', async () => {
    const user = userEvent.setup();
    render(
      <>
        <FoodTree defaultExpandedKeys={['fruit']} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(row('Fruit')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(row('Apple')).toHaveFocus();
    await user.keyboard('{End}');
    expect(row('Nuts')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(row('Fruit')).toHaveFocus();
    await user.keyboard('v');
    expect(row('Vegetables')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('UIC-TREE-3.2 selects rows and refuses disabled ones', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { container } = render(
      <FoodTree
        selectionMode="single"
        disabledKeys={['nuts']}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(row('Vegetables'));
    expect(row('Vegetables')).toHaveAttribute('aria-selected', 'true');
    expect(row('Vegetables')).toHaveAttribute('data-selected', 'true');
    expect([...(onSelectionChange.mock.lastCall?.[0] as Set<string>)]).toEqual(['vegetables']);
    expect(row('Nuts')).toHaveAttribute('aria-disabled', 'true');
    expect(row('Nuts')).toHaveAttribute('data-disabled', 'true');
    await user.click(row('Nuts'));
    expect(row('Nuts')).not.toHaveAttribute('data-selected');
    expect(screen.getByRole('treegrid')).toHaveAttribute('data-selection-mode', 'single');
    expectHooksMatchSpec(container, 'TREE');
  });

  it('UIC-TREE-3.3 runs onAction for the activated row but not for its own controls', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onMore = vi.fn();
    render(
      <FoodTree
        onAction={onAction}
        renderActions={(item) => (
          <Button
            icon={MoreGlyph}
            label={`More for ${item.name}`}
            onPress={() => onMore(item.id)}
          />
        )}
      />,
    );
    await user.click(row('Nuts'));
    expect(onAction).toHaveBeenLastCalledWith('nuts');
    await user.keyboard('{ArrowUp}{Enter}');
    expect(onAction).toHaveBeenLastCalledWith('vegetables');
    onAction.mockClear();
    await user.click(screen.getByRole('button', { name: 'More for Fruit' }));
    expect(onMore).toHaveBeenCalledWith('fruit');
    expect(onAction).not.toHaveBeenCalled();
  });

  it('UIC-TREE-3.4 makes the row itself a link that navigates through the provider', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const items: Food[] = [
      { id: 'guide', name: 'Guide', href: '/docs/guide' },
      { id: 'notes', name: 'Notes' },
    ];
    const { container } = render(
      <UiProvider navigate={navigate}>
        <Tree aria-label="Docs" items={items} getTextValue={name} getHref={(item) => item.href} />
      </UiProvider>,
    );
    expect(row('Guide')).toHaveAttribute('data-href', '/docs/guide');
    expect(container.querySelector('a')).toBeNull();
    await user.click(row('Guide'));
    expect(navigate).toHaveBeenCalledWith('/docs/guide', undefined);
    navigate.mockClear();
    await user.keyboard('{ArrowDown}{ArrowUp}{Enter}');
    expect(navigate).toHaveBeenCalledWith('/docs/guide', undefined);
    expectHooksMatchSpec(container, 'TREE');
  });

  it('UIC-TREE-3.5 marks the current row', () => {
    const items: Food[] = [
      { id: 'guide', name: 'Guide', href: '/docs/guide' },
      { id: 'notes', name: 'Notes' },
      { id: 'other', name: 'Other' },
    ];
    const docs = (currentKey: string) => (
      <Tree
        aria-label="Docs"
        items={items}
        getTextValue={name}
        getHref={(item) => item.href}
        currentKey={currentKey}
      />
    );
    const { container, rerender } = render(docs('guide'));
    expect(row('Guide')).toHaveAttribute('aria-current', 'page');
    expect(row('Notes')).not.toHaveAttribute('aria-current');
    rerender(docs('notes'));
    expect(row('Notes')).toHaveAttribute('aria-current', 'true');
    expect(row('Guide')).not.toHaveAttribute('aria-current');
    expect(row('Other')).not.toHaveAttribute('aria-current');
    expect(container.querySelectorAll('[data-current="true"]')).toHaveLength(1);
    expectHooksMatchSpec(container, 'TREE');
  });

  it('UIC-TREE-3.6 lets the owner claim a key before the tree handles it', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(
      <FoodTree
        defaultExpandedKeys={['fruit']}
        renderLabel={(item) =>
          item.id === 'pear' ? <input aria-label="Rename Pear" defaultValue="Pear" /> : item.name
        }
        onItemKeyDown={(item, event) => {
          seen.push(`${item.id}:${event.key}`);
          return item.id === 'apple' && event.key === 'ArrowDown';
        }}
      />,
    );
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(row('Apple')).toHaveFocus();
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      row('Apple').dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(row('Apple')).toHaveFocus();
    expect(seen).toEqual(['fruit:ArrowDown', 'apple:ArrowDown']);
    const input = screen.getByRole('textbox', { name: 'Rename Pear' });
    act(() => input.focus());
    await user.keyboard('x');
    expect(seen).toHaveLength(2);
  });

  it('UIC-TREE-4.1 shows a loading row while an empty tree is pending', () => {
    const { container, rerender } = render(<FoodTree items={[]} isPending />);
    const tree = screen.getByRole('treegrid');
    expect(tree).toHaveAttribute('aria-busy', 'true');
    expect(tree).toHaveAttribute('data-pending', 'true');
    const empty = container.querySelector('.ui-tree__empty');
    expect(empty).toHaveClass('ui-empty-state');
    expect(empty).toHaveAttribute('data-variant', 'loading');
    expect(empty).toHaveAttribute('role', 'status');
    expect(empty).toHaveTextContent('Loading');
    expectHooksMatchSpec(container, 'TREE', { slots: ['empty'] });

    rerender(<FoodTree isPending />);
    expect(screen.getByRole('treegrid')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.ui-tree__empty')).toBeNull();
    rerender(<FoodTree />);
    expect(screen.getByRole('treegrid')).not.toHaveAttribute('aria-busy');
  });

  it('UIC-TREE-4.2 shows the caller empty state only when there is one', () => {
    const { container, rerender } = render(<FoodTree items={[]} />);
    expect(screen.getByRole('treegrid')).toHaveAttribute('data-empty', 'true');
    expect(container.querySelector('.ui-tree__empty')).toBeNull();
    rerender(<FoodTree items={[]} emptyMessage="Nothing here" />);
    const empty = container.querySelector('.ui-tree__empty');
    expect(empty).toHaveTextContent('Nothing here');
    expect(empty).toHaveAttribute('data-variant', 'empty');
    expectHooksMatchSpec(container, 'TREE', { slots: ['empty'] });
  });

  it('UIC-TREE-4.3 publishes size, variant and wrap', () => {
    const { container, rerender } = render(<FoodTree />);
    const tree = screen.getByRole('treegrid');
    expect(tree).toHaveAttribute('data-size', 'sm');
    expect(tree).toHaveAttribute('data-variant', 'default');
    expect(tree).not.toHaveAttribute('data-wrap');
    rerender(<FoodTree size="lg" variant="picker" wrap />);
    expect(tree).toHaveAttribute('data-size', 'lg');
    expect(tree).toHaveAttribute('data-variant', 'picker');
    expect(tree).toHaveAttribute('data-wrap', 'true');
    expectHooksMatchSpec(container, 'TREE');
  });

  it('UIC-TREE-4.4 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = createRef<HTMLDivElement>();
    function Harness() {
      const [label] = useState('Food');
      return (
        <Tree
          aria-label={label}
          items={FOOD}
          getTextValue={name}
          className="caller"
          id="food"
          ref={ref}
          data-test="tree"
          data-size="x"
        />
      );
    }
    const { container } = render(<Harness />);
    const tree = screen.getByRole('treegrid', { name: 'Food' });
    expect(tree).toHaveAttribute('data-test', 'tree');
    expect(tree).toHaveClass('ui-tree', 'caller');
    expect(tree).toHaveAttribute('id', 'food');
    expect(tree).toHaveAttribute('data-size', 'sm');
    expect(ref.current).toBe(tree);
    expectHooksMatchSpec(container, 'TREE', { callerAttributes: ['data-test'] });
  });

  it('UIC-TREE-4.5 renders only the fixed-height rows in view when virtualized', () => {
    // React Aria's virtualizer treats an unmocked test DOM as infinitely large.
    const sizes = { clientWidth: 300, clientHeight: 200 };
    for (const [name, value] of Object.entries(sizes)) {
      Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get: () => value });
    }
    const many = Array.from({ length: 400 }, (_, index) => ({
      id: `fruit-${index}`,
      name: `Fruit ${index + 1}`,
    }));
    try {
      const { container } = render(
        <Tree
          aria-label="Many"
          items={many}
          getTextValue={(item) => item.name}
          virtualized
          size="md"
        />,
      );
      const tree = screen.getByRole('treegrid', { name: 'Many' });
      expect(tree).toHaveAttribute('data-virtualized', 'true');
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(5);
      expect(rows.length).toBeLessThan(40);
      expect(rows[0]?.parentElement?.style.height).toBe('32px');
      expectHooksMatchSpec(container, 'TREE', { slots: ['item', 'label'] });
    } finally {
      for (const name of Object.keys(sizes)) Reflect.deleteProperty(HTMLElement.prototype, name);
    }
  });
});
