import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { mergeProps } from '../../utils/merge-props.js';
import { resolveOverflowCount } from '../../utils/overflow-measure.js';
import { OverflowList } from './overflow-list.js';
import { stubTextLayout } from '../../../test/overflow-fixtures.js';

const fruit = ['Apple', 'Banana', 'Cherry', 'Fig'];

class FakeObserver {
  static instances: FakeObserver[] = [];
  constructor(readonly callback: ResizeObserverCallback) {
    FakeObserver.instances.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  report(target: Element): void {
    this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
}

function List({ room, items = fruit, collapseFrom }: { room: number } & Partial<Props>) {
  return (
    <OverflowList
      data-room={room}
      aria-label="Fruit"
      role="group"
      items={items}
      getKey={(item) => item}
      collapseFrom={collapseFrom}
      renderItem={(item, index) => <span data-index={index}>{item}</span>}
      renderOverflow={(hidden) => <button type="button">+{hidden.length}</button>}
    />
  );
}

type Props = { items: readonly string[]; collapseFrom: 'start' | 'end' };

function shownItems(): string[] {
  return Array.from(
    document.querySelectorAll('.ui-overflow-list__item'),
    (item) => item.textContent ?? '',
  );
}

beforeEach(() => {
  FakeObserver.instances = [];
  stubTextLayout();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resolveOverflowCount', () => {
  it('UIC-OVERFLOW-LIST-1.4 keeps every item that fits and leaves room for the indicator', () => {
    const sizes = [50, 60, 60];
    expect(resolveOverflowCount({ sizes, available: 170, gap: 0, indicatorSize: 20 })).toBe(3);
    expect(resolveOverflowCount({ sizes, available: 180, gap: 5, indicatorSize: 20 })).toBe(3);
    expect(resolveOverflowCount({ sizes, available: 169, gap: 0, indicatorSize: 20 })).toBe(2);
    expect(resolveOverflowCount({ sizes, available: 130, gap: 0, indicatorSize: 20 })).toBe(2);
    expect(resolveOverflowCount({ sizes, available: 130, gap: 10, indicatorSize: 20 })).toBe(1);
    expect(resolveOverflowCount({ sizes, available: 150, gap: 10, indicatorSize: 20 })).toBe(2);
    expect(resolveOverflowCount({ sizes, available: 60, gap: 0, indicatorSize: 20 })).toBe(0);
    expect(resolveOverflowCount({ sizes: [], available: 0, gap: 4, indicatorSize: 20 })).toBe(0);
  });

  it('UIC-OVERFLOW-LIST-1.4 counts from the start when items collapse from the start', () => {
    const sizes = [80, 60, 50];
    expect(
      resolveOverflowCount({
        sizes,
        available: 140,
        gap: 0,
        indicatorSize: 20,
        collapseFrom: 'start',
      }),
    ).toBe(2);
    expect(resolveOverflowCount({ sizes, available: 140, gap: 0, indicatorSize: 20 })).toBe(1);
  });
});

describe('OverflowList', () => {
  it('UIC-OVERFLOW-LIST-1.1 renders every item when they fit, with no indicator', () => {
    const { container } = render(<List room={200} />);
    expect(shownItems()).toEqual(fruit);
    const root = screen.getByRole('group', { name: 'Fruit' });
    expect(root).toHaveClass('ui-overflow-list');
    expect(root).toHaveAttribute('data-collapse-from', 'end');
    expect(root).not.toHaveAttribute('data-overflowing');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'OVERFLOW-LIST', {
      slots: ['item'],
      callerAttributes: ['data-room', 'data-index'],
    });
  });

  it('UIC-OVERFLOW-LIST-1.1 keeps what fits beside the indicator and hands it the rest', () => {
    const { container } = render(<List room={120} />);
    // Apple (50) and the "+3" indicator (20) fit in 120; Banana (60) would not.
    expect(shownItems()).toEqual(['Apple']);
    expect(screen.getByRole('button')).toHaveTextContent('+3');
    const root = screen.getByRole('group');
    expect(root).toHaveAttribute('data-overflowing', 'true');
    expect(root.lastElementChild).toHaveClass('ui-overflow-list__overflow');
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'OVERFLOW-LIST', {
      slots: 'all',
      callerAttributes: ['data-room', 'data-index'],
    });
  });

  it('UIC-OVERFLOW-LIST-1.2 keeps the last items and puts the indicator first from the start', () => {
    render(<List room={110} collapseFrom="start" />);
    // Fig (30) and Cherry (60) fit beside "+2" (20); Banana would not.
    expect(shownItems()).toEqual(['Cherry', 'Fig']);
    const root = screen.getByRole('group');
    expect(root).toHaveAttribute('data-collapse-from', 'start');
    expect(root.firstElementChild).toHaveClass('ui-overflow-list__overflow');
    expect(screen.getByText('Cherry')).toHaveAttribute('data-index', '2');
    expect(screen.getByRole('button')).toHaveTextContent('+2');
  });

  it('UIC-OVERFLOW-LIST-1.3 solves again when the room changes', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    const { rerender } = render(<List room={120} />);
    expect(shownItems()).toEqual(['Apple']);
    const root = screen.getByRole('group');
    rerender(<List room={200} />);
    act(() => FakeObserver.instances.at(-1)?.report(root));
    expect(shownItems()).toEqual(fruit);
    rerender(<List room={160} />);
    act(() => FakeObserver.instances.at(-1)?.report(root));
    expect(shownItems()).toEqual(['Apple', 'Banana']);
    expect(screen.getByRole('button')).toHaveTextContent('+2');
  });

  it('UIC-OVERFLOW-LIST-1.3 measures a new item list afresh', () => {
    const { rerender } = render(<List room={120} />);
    expect(shownItems()).toEqual(['Apple']);
    rerender(<List room={120} items={['Kiwi', 'Lime', 'Pear', 'Plum']} />);
    // Each name is 40 wide: two fit beside the "+2" indicator.
    expect(shownItems()).toEqual(['Kiwi', 'Lime']);
    rerender(<List room={120} items={['Kiwi', 'Lime']} />);
    expect(shownItems()).toEqual(['Kiwi', 'Lime']);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('UIC-OVERFLOW-LIST-1.3 keeps the indicator mounted while it measures a new list', () => {
    const { rerender } = render(<List room={120} />);
    const indicator = screen.getByRole('button');
    indicator.focus();
    rerender(<List room={120} items={[...fruit, 'Grape']} />);
    expect(screen.getByRole('button')).toBe(indicator);
    expect(indicator).toHaveFocus();
    expect(indicator).toHaveTextContent('+4');
  });

  it('UIC-OVERFLOW-LIST-1.4 counts the gap between items and before the indicator', () => {
    render(
      <OverflowList
        data-room={150}
        items={fruit}
        getKey={(item) => item}
        render={(props) => <div {...props} style={{ columnGap: '10px' }} />}
        renderItem={(item) => item}
        renderOverflow={(hidden) => `+${hidden.length}`}
      />,
    );
    // Apple (50) + gap + Banana (60) + gap + "+2" (20) = 150.
    expect(shownItems()).toEqual(['Apple', 'Banana']);
  });

  it('UIC-OVERFLOW-LIST-2.1 renders through the caller element with its hooks, ref and state', () => {
    const ref = createRef<HTMLDivElement>();
    const states: boolean[] = [];
    render(
      <OverflowList
        ref={ref}
        data-room={120}
        className="caller"
        data-testid="list"
        items={fruit}
        getKey={(item) => item}
        renderItem={(item) => item}
        renderOverflow={(hidden) => `+${hidden.length}`}
        render={(props, state) => {
          states.push(state.isOverflowing);
          return <div {...mergeProps(props, { role: 'toolbar', 'aria-label': 'Fruit tools' })} />;
        }}
      />,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Fruit tools' });
    expect(toolbar).toBe(ref.current);
    expect(toolbar).toHaveClass('ui-overflow-list', 'caller');
    expect(toolbar).toHaveAttribute('data-testid', 'list');
    expect(toolbar).toHaveAttribute('data-overflowing', 'true');
    expect(states.at(-1)).toBe(true);
    expect(shownItems()).toEqual(['Apple']);
  });

  it('UIC-OVERFLOW-LIST-2.2 forwards the caller id, attributes and ref to the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <OverflowList
        ref={ref}
        id="fruit-row"
        data-room={500}
        data-collapse-from="caller"
        items={fruit}
        getKey={(item) => item}
        renderItem={(item) => item}
        renderOverflow={() => null}
      />,
    );
    const root = document.getElementById('fruit-row');
    expect(root).toBe(ref.current);
    expect(root).toHaveAttribute('data-collapse-from', 'end');
    expect(root).not.toHaveAttribute('role');
  });
});
