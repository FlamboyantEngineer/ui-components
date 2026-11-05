import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { expectRowMenuReturnsFocus, RowMenuButton } from '../../../test/menu-fixtures.js';
import { InfoGlyph } from '../../core/glyphs.js';
import type { Selection } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import {
  ListView,
  ListViewItem,
  type ListViewItemProps,
  type ListViewMove,
  ListViewSection,
  type ListViewSectionProps,
} from './list-view.js';

const fruit = [
  { id: 'apple', name: 'Apple', meta: 'Red' },
  { id: 'banana', name: 'Banana', meta: 'Yellow' },
  { id: 'cherry', name: 'Cherry', meta: 'Dark red' },
  { id: 'damson', name: 'Damson', meta: 'Purple' },
];

function Reorderable({
  onMove,
  disabledKeys,
}: {
  onMove: (move: ListViewMove) => void;
  disabledKeys?: string[];
}) {
  return (
    <ListView aria-label="Fruit" items={fruit} reorder={{ onMove }} disabledKeys={disabledKeys}>
      {(item) => <ListViewItem title={item.name} />}
    </ListView>
  );
}

/** Host components around the list's parts, as React Aria's reuse pattern writes them. */
function FruitRow(props: ListViewItemProps) {
  return <ListViewItem {...props} />;
}

function FruitSection(props: ListViewSectionProps<(typeof fruit)[number]>) {
  return <ListViewSection {...props} />;
}

describe('ListView', () => {
  it('UIC-LIST-ROW-3.1 returns focus to a trailing control as its menu closes', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <ListView aria-label="Fruit" selectionMode="single" onSelectionChange={onSelectionChange}>
        <ListViewItem
          id="apple"
          title="Apple"
          trailing={<RowMenuButton label="More for Apple" />}
        />
        <ListViewItem id="banana" title="Banana" />
      </ListView>,
    );
    await expectRowMenuReturnsFocus(user, 'More for Apple', async () => {
      // The row's selection checkbox comes first, then its trailing control.
      act(() => screen.getByRole('row', { name: 'Apple' }).focus());
      await user.keyboard('{ArrowRight}{ArrowRight}');
    });
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('UIC-LIST-ROW-3.3 keeps an uncontrolled selection and the focused row when reorder toggles', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const list = (reorder: boolean) => (
      <ListView
        aria-label="Fruit"
        items={fruit}
        selectionMode="multiple"
        defaultSelectedKeys={['apple']}
        onSelectionChange={onSelectionChange}
        reorder={reorder ? { onMove: vi.fn() } : undefined}
      >
        {(item) => <ListViewItem title={item.name} />}
      </ListView>
    );
    const { rerender } = render(list(false));
    await user.click(screen.getByRole('row', { name: 'Banana' }));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    rerender(list(true));
    rerender(list(false));
    const selected = screen.getAllByRole('row').filter((row) => row.ariaSelected === 'true');
    expect(selected.map((row) => row.textContent)).toEqual(['Apple', 'Banana']);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole('row', { name: 'Banana' })).toHaveFocus());
  });

  it('UIC-LIST-ROW-3.5 keeps the same rows mounted while reorder turns on and off', async () => {
    const user = userEvent.setup();
    const list = (reorder: boolean) => (
      <ListView
        aria-label="Fruit"
        items={fruit}
        reorder={reorder ? { onMove: vi.fn() } : undefined}
      >
        {(item) => <ListViewItem title={item.name} />}
      </ListView>
    );
    const { rerender } = render(list(false));
    const banana = screen.getByRole('row', { name: 'Banana' });
    await user.click(banana);
    expect(screen.getByRole('grid')).not.toHaveAttribute('data-reordering');
    rerender(list(true));
    expect(screen.getByRole('row', { name: 'Banana' })).toBe(banana);
    expect(banana).toHaveFocus();
    expect(screen.getByRole('grid')).toHaveAttribute('data-reordering', 'true');
    expect(banana.querySelector('.ui-list-view-item__drag-handle')).not.toBeNull();
    rerender(list(false));
    expect(screen.getByRole('row', { name: 'Banana' })).toBe(banana);
    expect(banana).toHaveFocus();
    expect(screen.getByRole('grid')).not.toHaveAttribute('data-reordering');
    expect(banana.querySelector('.ui-list-view-item__drag-handle')).toBeNull();
    expect(banana).not.toHaveAttribute('draggable');
  });

  it('UIC-LIST-ROW-3.3 retains one-shot selected and disabled key iterables across rerenders', () => {
    const selectedKeys = (function* () {
      yield 'apple';
    })();
    const disabledKeys = (function* () {
      yield 'banana';
    })();
    const props = { items: fruit, selectionMode: 'multiple' as const, selectedKeys, disabledKeys };
    const renderItem = (item: (typeof fruit)[number]) => <ListViewItem title={item.name} />;
    const { rerender } = render(
      <ListView {...props} aria-label="Fruit">
        {renderItem}
      </ListView>,
    );
    const apple = screen.getByRole('row', { name: /Apple/ });
    const banana = screen.getByRole('row', { name: /Banana/ });
    expect([apple.getAttribute('aria-selected'), banana.getAttribute('aria-disabled')]).toEqual([
      'true',
      'true',
    ]);
    rerender(
      <ListView {...props} aria-label="Updated fruit">
        {renderItem}
      </ListView>,
    );
    expect([apple.getAttribute('aria-selected'), banana.getAttribute('aria-disabled')]).toEqual([
      'true',
      'true',
    ]);
  });

  it('UIC-LIST-ROW-3.3 preserves Shift ranges across controlled numeric, textual and spaced selections', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const items = [
      { id: 1, name: 'Numeric' },
      { id: '1', name: 'Textual' },
      { id: 'a b', name: 'Spaced' },
      { id: 'ab', name: 'Compact' },
    ];
    function Controlled() {
      const [selected, setSelected] = useState<Selection>(new Set());
      return (
        <ListView
          aria-label="Keys"
          items={items}
          selectionMode="multiple"
          selectionBehavior="replace"
          selectedKeys={selected}
          onSelectionChange={(keys) => {
            setSelected(keys);
            onSelectionChange(keys);
          }}
        >
          {(item) => <ListViewItem title={item.name} />}
        </ListView>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('row', { name: 'Numeric' }));
    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('row', { name: 'Compact' }));
    await user.keyboard('{/Shift}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([1, '1', 'a b', 'ab']));
  });
  it('UIC-LIST-ROW-3.1 UIC-LIST-ROW-3.3 keeps mixed and whitespace IDs distinct through focus and selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const entries = [
      { id: 1, name: 'Numeric row' },
      { id: '1', name: 'Text row' },
      { id: 'a b', name: 'Spaced row' },
      { id: 'ab', name: 'Compact row' },
    ];
    render(
      <ListView
        aria-label="Typed rows"
        items={entries}
        selectionMode="multiple"
        defaultSelectedKeys={[1]}
        disabledKeys={['a b']}
        onSelectionChange={onSelectionChange}
      >
        {(item) => <ListViewItem title={item.name} />}
      </ListView>,
    );
    const rows = screen.getAllByRole('row');
    expect(new Set(rows.map((row) => row.id)).size).toBe(entries.length);
    expect(rows[0]).toHaveAttribute('aria-selected', 'true');
    expect(rows[1]).toHaveAttribute('aria-selected', 'false');
    await user.tab();
    expect(rows[0]).toHaveFocus();
    await user.keyboard('{ArrowDown} ');
    expect(rows[1]).toHaveFocus();
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([1, '1']));
    await user.keyboard('{ArrowDown}');
    expect(rows[3]).toHaveFocus();
  });

  it('UIC-LIST-ROW-3.1 preserves static fragment row identity and original action keys', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { rerender } = render(
      <ListView aria-label="Typed rows" onAction={onAction}>
        <>
          <ListViewItem id={1} title="Numeric row" />
          <ListViewItem id="1" title="Text row" />
        </>
      </ListView>,
    );
    const textRow = screen.getByRole('row', { name: 'Text row' });
    await user.click(textRow);
    expect(onAction).toHaveBeenLastCalledWith('1');
    rerender(
      <ListView aria-label="Typed rows" onAction={onAction}>
        <>
          <ListViewItem id="1" title="Text row" />
        </>
      </ListView>,
    );
    expect(screen.getByRole('row', { name: 'Text row' })).toBe(textRow);
  });

  it('UIC-LIST-ROW-3.4 preserves dynamic section row IDs and controlled selections', async () => {
    const user = userEvent.setup();
    const entries = [
      { id: 1, name: 'Numeric row' },
      { id: '1', name: 'Text row' },
    ];
    const onSelectionChange = vi.fn();
    render(
      <ListView
        aria-label="Sections"
        selectionMode="multiple"
        selectedKeys={['1']}
        onSelectionChange={onSelectionChange}
      >
        <ListViewSection id={2} title="First section" items={entries.slice(0, 1)}>
          {(item) => <ListViewItem title={item.name} />}
        </ListViewSection>
        <ListViewSection id="2" title="Second section" items={entries.slice(1)}>
          {(item) => <ListViewItem title={item.name} />}
        </ListViewSection>
      </ListView>,
    );
    const numeric = screen.getByRole('row', { name: /Numeric row/ });
    const text = screen.getByRole('row', { name: /Text row/ });
    expect(numeric.id).not.toBe(text.id);
    expect(numeric).toHaveAttribute('aria-selected', 'false');
    expect(text).toHaveAttribute('aria-selected', 'true');
    await user.click(within(numeric).getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['1', 1]));
  });

  it('UIC-LIST-ROW-3.1 leaves custom row props unchanged', () => {
    function CustomRow({ id }: { id: string }) {
      return <ListViewItem id={id} title={`Row ${id}`} />;
    }
    render(
      <ListView aria-label="Custom rows">
        <CustomRow id="readable" />
      </ListView>,
    );
    expect(screen.getByRole('row', { name: 'Row readable' })).toBeInTheDocument();
  });

  it('UIC-COMPOSITION-4.2 UIC-LIST-ROW-3.1 UIC-LIST-ROW-3.3 keys rows and sections rendered through a host component by their id', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <ListView
        aria-label="Fruit"
        selectionMode="multiple"
        selectedKeys={['apple', 2]}
        disabledKeys={['pear']}
        onSelectionChange={onSelectionChange}
      >
        <FruitSection id="orchard" title="Orchard">
          <FruitRow id="apple" title="Apple" />
          <FruitRow id="pear" title="Pear" />
        </FruitSection>
        <FruitRow id={2} title="Two" />
        <FruitRow id="2" title="Text two" />
      </ListView>,
    );
    expect(screen.getByRole('row', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('row', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('row', { name: 'Pear' })).toHaveAttribute('data-disabled', 'true');
    const textTwo = screen.getByRole('row', { name: 'Text two' });
    expect(textTwo).toHaveAttribute('aria-selected', 'false');
    await user.click(within(textTwo).getByRole('checkbox'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['apple', 2, '2']));
  });

  it('UIC-COMPOSITION-4.2 UIC-LIST-ROW-3.1 UIC-LIST-ROW-3.3 keys rows a host component draws from items by the item ids', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <ListView
        aria-label="Fruit"
        items={fruit}
        selectionMode="multiple"
        defaultSelectedKeys={['banana']}
        onSelectionChange={onSelectionChange}
      >
        {(item) => <FruitRow title={item.name} />}
      </ListView>,
    );
    expect(screen.getByRole('row', { name: 'Banana' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('row', { name: 'Cherry' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['banana', 'cherry']));
  });

  it('UIC-COMPOSITION-4.2 UIC-LIST-ROW-3.1 reports the item id of a row a host component draws from items', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <ListView aria-label="Fruit" items={fruit} onAction={onAction}>
        {(item) => <FruitRow title={item.name} />}
      </ListView>,
    );
    await user.click(screen.getByRole('row', { name: 'Cherry' }));
    expect(onAction).toHaveBeenLastCalledWith('cherry');
  });

  it('UIC-LIST-ROW-3.1 renders a named grid list of rows drawn with the row text', async () => {
    const onAction = vi.fn();
    const { container } = render(
      <ListView aria-label="Fruit" items={fruit} divided onAction={onAction}>
        {(item) => (
          <ListViewItem
            title={item.name}
            meta={item.meta}
            icon={InfoGlyph}
            tone={item.id === 'damson' ? 'danger' : undefined}
            trailing={<button type="button">Share {item.name}</button>}
          />
        )}
      </ListView>,
    );
    const grid = screen.getByRole('grid', { name: 'Fruit' });
    expect(grid).toHaveClass('ui-list-view');
    expect(grid).toHaveAttribute('data-divided', 'true');
    expect(grid).toHaveAttribute('data-layout', 'stack');
    const rows = within(grid).getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveClass('ui-list-view-item');
    expect(rows[0]).toHaveAttribute('data-tone', 'neutral');
    expect(rows[3]).toHaveAttribute('data-tone', 'danger');
    expect(rows[0]?.querySelector('.ui-list-row-content__title')).toHaveTextContent('Apple');
    expect(rows[0]?.querySelector('.ui-list-row-content__meta')).toHaveTextContent('Red');
    expect(rows[0]?.querySelector('.ui-list-view-item__trailing')).toHaveTextContent('Share Apple');
    expectHooksMatchSpec(container, 'LIST-ROW', { slots: ['ui-list-view-item__trailing'] });

    await userEvent.tab();
    expect(rows[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(rows[1]).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledWith('banana');
  });

  it('UIC-LIST-ROW-3.1 follows a row href through the provider', async () => {
    const navigate = vi.fn();
    const { container } = render(
      <UiProvider navigate={navigate}>
        <ListView aria-label="Pages">
          <ListViewItem id="home" title="Home" href="/home" />
          <ListViewItem id="about" title="About" href="/about" />
        </ListView>
      </UiProvider>,
    );
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(navigate.mock.lastCall?.[0]).toBe('/about');
    expectHooksMatchSpec(container, 'LIST-ROW');
  });

  it('UIC-LIST-ROW-3.2 moves to the row whose text starts with the typed letters', async () => {
    render(
      <ListView aria-label="Fruit" items={fruit}>
        {(item) => <ListViewItem title={item.name} />}
      </ListView>,
    );
    const rows = screen.getAllByRole('row');
    await userEvent.tab();
    await userEvent.keyboard('d');
    expect(rows[3]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(rows[0]).toHaveFocus();
  });

  it('UIC-LIST-ROW-3.3 selects rows with checkboxes while it selects with toggles', async () => {
    const onSelectionChange = vi.fn<(keys: Selection) => void>();
    const { container, unmount } = render(
      <ListView
        aria-label="Fruit"
        items={fruit}
        selectionMode="multiple"
        defaultSelectedKeys={['banana']}
        onSelectionChange={onSelectionChange}
      >
        {(item) => <ListViewItem title={item.name} />}
      </ListView>,
    );
    const rows = screen.getAllByRole('row');
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
    expect(checkboxes[0]?.closest('.ui-list-view-item__checkbox')).not.toBeNull();
    expect(rows[1]).toHaveAttribute('aria-selected', 'true');
    expect(rows[1]).toHaveAttribute('data-selected', 'true');
    expect(grid()).toHaveAttribute('aria-multiselectable', 'true');
    expectHooksMatchSpec(container, 'LIST-ROW', { slots: ['checkbox'] });

    await userEvent.click(checkboxes[2] as HTMLElement);
    expect([...(onSelectionChange.mock.lastCall?.[0] as Set<string>)].sort()).toEqual([
      'banana',
      'cherry',
    ]);

    unmount();
    render(
      <ListView aria-label="Fruit" items={fruit} selectionMode="single" selectionBehavior="replace">
        {(item) => <ListViewItem title={item.name} />}
      </ListView>,
    );
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    await userEvent.click(screen.getAllByRole('row')[2] as HTMLElement);
    expect(screen.getAllByRole('row')[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-LIST-ROW-3.4 groups rows in sections under a header row', () => {
    const { container } = render(
      <ListView aria-label="Produce" stickyHeaders>
        <ListViewSection id="fruit" title="Fruit" items={fruit.slice(0, 2)}>
          {(item) => <ListViewItem title={item.name} />}
        </ListViewSection>
        <ListViewSection id="vegetables" title="Vegetables">
          <ListViewItem id="leek" title="Leek" />
        </ListViewSection>
      </ListView>,
    );
    expect(grid()).toHaveAttribute('data-sticky-headers', 'true');
    const groups = screen.getAllByRole('rowgroup');
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveClass('ui-list-view-section');
    const header = groups[0]?.querySelector('.ui-list-view-section__header');
    expect(header).toHaveAttribute('role', 'row');
    expect(header).toHaveTextContent('Fruit');
    expect(groups[0]).toHaveAccessibleName('Fruit');
    expect(within(groups[1] as HTMLElement).getAllByRole('row')).toHaveLength(2);
    expectHooksMatchSpec(container, 'LIST-ROW', { slots: ['header'] });
  });

  it('UIC-LIST-ROW-3.5 draws a drag handle on rows the list lets the reader drag', () => {
    const { container } = render(<Reorderable onMove={vi.fn()} />);
    const rows = screen.getAllByRole('row');
    expect(screen.getByRole('grid')).toHaveAttribute('data-reordering', 'true');
    expect(rows[0]).toHaveAttribute('data-allows-dragging', 'true');
    const handle = rows[0]?.querySelector('.ui-list-view-item__drag-handle');
    expect(handle).toHaveClass('ui-drag-handle');
    expect(handle).toHaveAttribute('tabindex', '-1');
    expectHooksMatchSpec(container, 'LIST-ROW', { slots: ['drag-handle'] });
  });

  it(
    'UIC-LIST-ROW-3.5 drops nothing when the dragged row is disabled mid-drag',
    { timeout: 15_000 },
    async () => {
      const onMove = vi.fn<(move: ListViewMove) => void>();
      const { rerender } = render(<Reorderable onMove={onMove} />);
      const user = userEvent.setup();
      screen.getByRole('row', { name: 'Apple' }).focus();
      try {
        await user.keyboard('{ArrowRight}{Enter}');
        await waitFor(() => {
          expect(
            document.querySelectorAll('.ui-list-view__drop-indicator[data-drop-target]'),
          ).toHaveLength(1);
        });
        rerender(<Reorderable onMove={onMove} disabledKeys={['apple']} />);
        await user.keyboard('{ArrowDown}{Enter}');
        expect(onMove).not.toHaveBeenCalled();
      } finally {
        await user.keyboard('{Escape}');
      }
    },
  );

  it(
    'UIC-LIST-ROW-3.5 reports a keyboard drop as a move for the owner to apply',
    { timeout: 15_000 },
    async () => {
      const onMove = vi.fn<(move: ListViewMove) => void>();
      render(<Reorderable onMove={onMove} />);
      const user = userEvent.setup();
      screen.getByRole('row', { name: 'Apple' }).focus();
      try {
        await user.keyboard('{ArrowRight}{Enter}');
        await waitFor(() => {
          expect(
            document.querySelectorAll('.ui-list-view__drop-indicator[data-drop-target]'),
          ).toHaveLength(1);
        });
        await user.keyboard('{ArrowDown}{Enter}');
        expect(onMove).toHaveBeenCalledTimes(1);
        const move = onMove.mock.lastCall?.[0];
        expect(move?.keys).toEqual(['apple']);
        expect(move?.targetKey).not.toBe('apple');
        expect(['before', 'after']).toContain(move?.position);
      } finally {
        // A failed assertion must still end the drag before this worker runs another test.
        await user.keyboard('{Escape}');
      }
    },
  );

  it('UIC-LIST-ROW-3.5 draws no drag affordance without reorder', () => {
    render(
      <ListView aria-label="Fruit" items={fruit}>
        {(item) => <ListViewItem title={item.name} />}
      </ListView>,
    );
    expect(screen.getByRole('grid')).not.toHaveAttribute('data-reordering');
    expect(screen.getAllByRole('row')[0]).not.toHaveAttribute('draggable');
    expect(document.querySelector('.ui-list-view-item__drag-handle')).toBeNull();
  });

  // Laying out a virtual list in jsdom is slow on a busy machine.
  it('UIC-LIST-ROW-3.6 renders only the rows in view when virtualized', { timeout: 15_000 }, () => {
    const sizes = { clientWidth: 300, clientHeight: 200 };
    for (const [name, value] of Object.entries(sizes)) {
      Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get: () => value });
    }
    const many = Array.from({ length: 400 }, (_, index) => ({ id: index, name: `Fruit ${index}` }));
    try {
      render(
        <ListView aria-label="Many" items={many} virtualized rowHeight={40}>
          {(item) => <ListViewItem title={item.name} />}
        </ListView>,
      );
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(3);
      expect(rows.length).toBeLessThan(40);
      expect(rows[0]).toHaveAttribute('aria-rowindex', '1');
    } finally {
      for (const name of Object.keys(sizes)) Reflect.deleteProperty(HTMLElement.prototype, name);
    }
  });

  it('UIC-LIST-ROW-3.6 asks for more rows only while none are loading', () => {
    // An observer that reports the loader in view as soon as it watches it.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly report: (entries: { isIntersecting: boolean }[]) => void) {}
        observe() {
          this.report([{ isIntersecting: true }]);
        }
        disconnect() {}
      },
    );
    const onLoadMore = vi.fn();
    const list = (isLoading: boolean, count: number) => (
      <ListView
        aria-label="Few"
        items={fruit.slice(0, count)}
        isLoading={isLoading}
        onLoadMore={onLoadMore}
      >
        {(item) => <ListViewItem title={item.name} />}
      </ListView>
    );
    const { rerender } = render(list(true, 1));
    rerender(list(true, 2));
    expect(onLoadMore).not.toHaveBeenCalled();
    rerender(list(false, 3));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('UIC-LIST-ROW-3.6 shows a loading row while more rows load, and the empty state', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    const { container, unmount } = render(
      <ListView aria-label="Few" items={fruit.slice(0, 1)} isLoading onLoadMore={() => {}}>
        {(item) => <ListViewItem title={item.name} />}
      </ListView>,
    );
    const loader = container.querySelector('.ui-list-view__loader');
    expect(loader).toHaveAttribute('role', 'row');
    expect(within(loader as HTMLElement).getByRole('status')).toHaveTextContent('Loading');
    expectHooksMatchSpec(container, 'LIST-ROW', { slots: ['loader'] });
    unmount();
    render(<ListView aria-label="None" items={[]} renderEmptyState={() => 'No fruit'} />);
    expect(screen.getByRole('grid', { name: 'None' })).toHaveAttribute('data-empty', 'true');
    expect(screen.getByRole('grid', { name: 'None' })).toHaveTextContent('No fruit');
  });
});

function grid() {
  return screen.getByRole('grid');
}
