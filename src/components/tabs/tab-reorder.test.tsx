import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key, Orientation } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import { resolveTabMove, stepTabMove, type TabMove } from './tab-reorder.js';
import { Tab, TabList, Tabs } from './tabs.js';

const fruit = ['apple', 'banana', 'cherry', 'fig'];
const label = (key: string) => key[0]?.toUpperCase() + key.slice(1);

/** Fruit tabs that apply each reported move, also reporting it to `onReorder`. */
function Reorderable({
  onReorder,
  orientation,
  disabledKeys,
}: {
  onReorder?: (move: TabMove) => void;
  orientation?: Orientation;
  disabledKeys?: Key[];
}) {
  const [keys, setKeys] = useState(fruit);
  return (
    <Tabs orientation={orientation} disabledKeys={disabledKeys}>
      <TabList
        aria-label="Fruit"
        onReorder={(move) => {
          onReorder?.(move);
          setKeys((current) => {
            const rest = current.filter((key) => key !== move.key);
            const at = rest.indexOf(String(move.targetKey)) + (move.position === 'after' ? 1 : 0);
            return [...rest.slice(0, at), String(move.key), ...rest.slice(at)];
          });
        }}
      >
        {keys.map((key) => (
          <Tab key={key} id={key}>
            {label(key)}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });
const shownTabs = () => screen.getAllByRole('tab').map((element) => element.textContent);

/** A data transfer that keeps what a drag writes, as jsdom has none. */
function createDataTransfer() {
  const data = new Map<string, string>();
  return {
    items: {
      add: (value: string, type: string) => data.set(type, value),
      *[Symbol.iterator]() {
        for (const type of data.keys()) yield { kind: 'string', type };
      },
    },
    get types() {
      return [...data.keys()];
    },
    getData: (type: string) => data.get(type) ?? '',
    clearData: () => data.clear(),
    effectAllowed: 'all',
    dropEffect: 'none',
  };
}

type DragType = 'dragStart' | 'dragEnter' | 'dragOver' | 'drop' | 'dragEnd';

function drag(type: DragType, target: Element, options: { transfer: object; clientX?: number }) {
  const event = createEvent[type](target);
  Object.defineProperty(event, 'dataTransfer', { value: options.transfer });
  Object.defineProperty(event, 'clientX', { value: options.clientX ?? 0 });
  Object.defineProperty(event, 'clientY', { value: 10 });
  fireEvent(target, event);
}

/** Lays the tab out at `left`, 100 pixels wide. */
function place(element: Element, left: number) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(left, 0, 100, 30));
}

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveTabMove and stepTabMove', () => {
  it('UIC-TABS-3.3 refuses moves that leave a tab where it is', () => {
    expect(resolveTabMove(fruit, { key: 'apple', targetKey: 'banana', position: 'before' })).toBe(
      null,
    );
    expect(resolveTabMove(fruit, { key: 'cherry', targetKey: 'banana', position: 'after' })).toBe(
      null,
    );
    expect(resolveTabMove(fruit, { key: 'apple', targetKey: 'apple', position: 'after' })).toBe(
      null,
    );
    expect(resolveTabMove(fruit, { key: 'kiwi', targetKey: 'apple', position: 'after' })).toBe(
      null,
    );
    const move = { key: 'apple', targetKey: 'banana', position: 'after' } as const;
    expect(resolveTabMove(fruit, move)).toBe(move);
  });

  it('UIC-TABS-3.4 steps one tab toward either end and stops there', () => {
    expect(stepTabMove(fruit, 'banana', -1)).toEqual({
      key: 'banana',
      targetKey: 'apple',
      position: 'before',
    });
    expect(stepTabMove(fruit, 'banana', 1)).toEqual({
      key: 'banana',
      targetKey: 'cherry',
      position: 'after',
    });
    expect(stepTabMove(fruit, 'apple', -1)).toBeNull();
    expect(stepTabMove(fruit, 'fig', 1)).toBeNull();
    expect(stepTabMove(fruit, 'kiwi', 1)).toBeNull();
  });
});

// Tabs driven by userEvent are slow in jsdom on a busy machine.
describe('Tab reordering', { timeout: 15_000 }, () => {
  it('UIC-TABS-3.4 moves the focused tab with Alt+Arrow keys and keeps focus on it', async () => {
    const onReorder = vi.fn();
    render(<Reorderable onReorder={onReorder} />);
    await userEvent.click(tab('Banana'));
    await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onReorder).toHaveBeenLastCalledWith({
      key: 'banana',
      targetKey: 'cherry',
      position: 'after',
    });
    expect(shownTabs()).toEqual(['Apple', 'Cherry', 'Banana', 'Fig']);
    expect(tab('Banana')).toHaveFocus();
    await userEvent.keyboard('{Alt>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Alt}');
    expect(shownTabs()).toEqual(['Banana', 'Apple', 'Cherry', 'Fig']);
    expect(onReorder).toHaveBeenCalledTimes(3);
    expect(tab('Banana')).toHaveFocus();
    expect(tab('Banana')).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-TABS-3.4 mirrors the keys right to left and uses up and down in a vertical list', async () => {
    const { unmount } = render(
      <UiProvider locale="ar">
        <Reorderable />
      </UiProvider>,
    );
    await userEvent.click(tab('Apple'));
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expect(shownTabs()).toEqual(['Banana', 'Apple', 'Cherry', 'Fig']);
    unmount();

    render(<Reorderable orientation="vertical" />);
    await userEvent.click(tab('Fig'));
    await userEvent.keyboard('{Alt>}{ArrowUp}{ArrowLeft}{/Alt}');
    expect(shownTabs()).toEqual(['Apple', 'Banana', 'Fig', 'Cherry']);
    expect(tab('Fig')).toHaveFocus();
  });

  it('UIC-TABS-3.4 claims the keys at either end and leaves plain arrows to the list', async () => {
    const onReorder = vi.fn();
    render(<Reorderable onReorder={onReorder} />);
    await userEvent.click(tab('Apple'));
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expect(onReorder).not.toHaveBeenCalled();
    expect(tab('Apple')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Banana')).toHaveFocus();
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('UIC-TABS-3.3 UIC-DRAG-INTERACTIONS-2.3 drags a tab onto the half of another tab it should land beside', async () => {
    const onReorder = vi.fn();
    const { container } = render(<Reorderable onReorder={onReorder} />);
    const apple = tab('Apple');
    const cherry = tab('Cherry');
    expect(apple).toHaveAttribute('draggable', 'true');
    place(cherry, 200);
    const transfer = createDataTransfer();
    drag('dragStart', apple, { transfer });
    expect(transfer.getData('text/plain')).toBe('Apple');
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(tab('Apple')).toHaveAttribute('data-dragging', 'true');

    drag('dragEnter', cherry, { transfer, clientX: 220 });
    expect(cherry).toHaveAttribute('data-drop-position', 'before');
    drag('dragOver', cherry, { transfer, clientX: 280 });
    expect(cherry).toHaveAttribute('data-drop-position', 'after');
    expectHooksMatchSpec(container, 'TABS', { slots: ['tab'] });
    drag('drop', cherry, { transfer, clientX: 280 });
    drag('dragEnd', apple, { transfer });
    expect(onReorder).toHaveBeenCalledWith({
      key: 'apple',
      targetKey: 'cherry',
      position: 'after',
    });
    expect(shownTabs()).toEqual(['Banana', 'Cherry', 'Apple', 'Fig']);
    expect(tab('Cherry')).not.toHaveAttribute('data-drop-position');
  });

  it('UIC-TABS-3.3 UIC-DRAG-INTERACTIONS-2.3 accepts a disabled landing tab and calls the latest owner on drop', async () => {
    const previous = vi.fn();
    const current = vi.fn();
    const { rerender } = render(<Reorderable onReorder={previous} disabledKeys={['cherry']} />);
    const apple = tab('Apple');
    const cherry = tab('Cherry');
    place(cherry, 200);
    const transfer = createDataTransfer();
    drag('dragStart', apple, { transfer });
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    drag('dragEnter', cherry, { transfer, clientX: 220 });
    expect(cherry).toHaveAttribute('data-drop-position', 'before');
    rerender(<Reorderable onReorder={current} disabledKeys={['cherry']} />);
    drag('drop', cherry, { transfer, clientX: 220 });
    drag('dragEnd', apple, { transfer });
    expect(previous).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledExactlyOnceWith({
      key: 'apple',
      targetKey: 'cherry',
      position: 'before',
    });
    expect(shownTabs()).toEqual(['Banana', 'Apple', 'Cherry', 'Fig']);
  });

  it('UIC-TABS-3.3 refuses drops that change nothing, drags from elsewhere and disabled tabs', () => {
    const onReorder = vi.fn();
    render(<Reorderable onReorder={onReorder} disabledKeys={['fig']} />);
    const banana = tab('Banana');
    place(banana, 100);
    const transfer = createDataTransfer();
    drag('dragStart', tab('Apple'), { transfer });
    drag('dragEnter', banana, { transfer, clientX: 120 });
    expect(banana).not.toHaveAttribute('data-drop-position');
    drag('drop', banana, { transfer, clientX: 120 });
    drag('dragEnd', tab('Apple'), { transfer });

    drag('dragStart', tab('Fig'), { transfer });
    drag('dragEnter', banana, { transfer, clientX: 120 });
    drag('drop', banana, { transfer, clientX: 120 });
    drag('dragEnd', tab('Fig'), { transfer });

    const outside = createDataTransfer();
    outside.items.add('Plum', 'text/plain');
    drag('dragEnter', banana, { transfer: outside, clientX: 120 });
    drag('drop', banana, { transfer: outside, clientX: 120 });
    expect(onReorder).not.toHaveBeenCalled();
    expect(tab('Fig')).toHaveAttribute('draggable', 'false');
  });

  it('UIC-TABS-3.3 draws no drag affordance without onReorder', () => {
    render(
      <Tabs>
        <TabList aria-label="Fruit">
          <Tab id="apple">Apple</Tab>
        </TabList>
      </Tabs>,
    );
    expect(tab('Apple')).not.toHaveAttribute('draggable');
  });
});
