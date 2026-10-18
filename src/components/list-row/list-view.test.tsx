import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Selection } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ListView, ListViewItem, ListViewSection, type ListViewMove } from './list-view.js';

const fruit = [
  { id: 'apple', name: 'Apple', meta: 'Red' },
  { id: 'banana', name: 'Banana', meta: 'Yellow' },
  { id: 'cherry', name: 'Cherry', meta: 'Dark red' },
  { id: 'damson', name: 'Damson', meta: 'Purple' },
];

function Reorderable({ onMove }: { onMove: (move: ListViewMove) => void }) {
  return (
    <ListView aria-label="Fruit" items={fruit} reorder={{ onMove }}>
      {(item) => <ListViewItem title={item.name} />}
    </ListView>
  );
}

describe('ListView', () => {
  it('UIC-LIST-ROW-3.1 renders a named grid list of rows drawn with the row text', async () => {
    const onAction = vi.fn();
    const { container } = render(
      <ListView aria-label="Fruit" items={fruit} divided onAction={onAction}>
        {(item) => (
          <ListViewItem
            title={item.name}
            meta={item.meta}
            icon="info"
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
    render(
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
    expect(rows[0]).toHaveAttribute('data-allows-dragging', 'true');
    const handle = rows[0]?.querySelector('.ui-list-view-item__drag-handle');
    expect(handle).toHaveClass('ui-drag-handle');
    expect(handle).toHaveAttribute('tabindex', '-1');
    expectHooksMatchSpec(container, 'LIST-ROW', { slots: ['drag-handle'] });
  });

  it(
    'UIC-LIST-ROW-3.5 reports a keyboard drop as a move for the owner to apply',
    { timeout: 15_000 },
    async () => {
      const onMove = vi.fn<(move: ListViewMove) => void>();
      render(<Reorderable onMove={onMove} />);
      const user = userEvent.setup();
      screen.getByRole('row', { name: 'Apple' }).focus();
      await user.keyboard('{ArrowRight}{Enter}');
      expect(
        document.querySelectorAll('.ui-list-view__drop-indicator[data-drop-target]'),
      ).toHaveLength(1);
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onMove).toHaveBeenCalledTimes(1);
      const move = onMove.mock.lastCall?.[0];
      expect(move?.keys).toEqual(['apple']);
      expect(move?.targetKey).not.toBe('apple');
      expect(['before', 'after']).toContain(move?.position);
    },
  );

  it('UIC-LIST-ROW-3.5 draws no drag affordance without reorder', () => {
    render(
      <ListView aria-label="Fruit" items={fruit}>
        {(item) => <ListViewItem title={item.name} />}
      </ListView>,
    );
    expect(screen.getAllByRole('row')[0]).not.toHaveAttribute('data-allows-dragging');
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
