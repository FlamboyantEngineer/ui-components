import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { applyTreeMove, type TreeMove } from '../../utils/tree-reorder.js';
import { Tree } from './tree.js';
import type { TreeProps } from './tree-props.js';

interface Shelf {
  id: string;
  name: string;
  children?: Shelf[];
}

const shelf = (id: string, children?: Shelf[]): Shelf => ({
  id,
  name: id[0]?.toUpperCase() + id.slice(1),
  ...(children ? { children } : {}),
});

/** `plum` is fixed, `fig` disabled, `berries` an open branch; `garden` sits beside `pantry`. */
const PANTRY: Shelf[] = [
  shelf('pantry', [
    shelf('apple'),
    shelf('pear'),
    shelf('plum'),
    shelf('fig'),
    shelf('kiwi'),
    shelf('berries', [shelf('currant')]),
  ]),
  shelf('garden'),
];

/** Boxes take items, the cellar takes boxes; `box-c` is closed over its child; `box-fixed` is fixed. */
const CELLAR: Shelf[] = [
  shelf('cellar', [
    shelf('box-a', [shelf('jar'), shelf('box-inner', [])]),
    shelf('box-b', []),
    shelf('box-c', [shelf('tin')]),
    shelf('bottle'),
    shelf('flask'),
    shelf('box-fixed', []),
  ]),
];

const canMoveIntoCellar = (item: Shelf, parent: Shelf | null) =>
  parent?.id === 'cellar'
    ? item.id.startsWith('box')
    : Boolean(parent?.id.startsWith('box')) && !item.id.startsWith('box');

function ShelfTree(props: Partial<TreeProps<Shelf>>) {
  return (
    <Tree
      aria-label="Shelves"
      items={PANTRY}
      getTextValue={(item) => item.name}
      expandedKeys={['pantry', 'berries']}
      disabledKeys={['fig']}
      {...props}
    />
  );
}

const row = (name: string) => screen.getByRole('row', { name });

interface TransferItem {
  kind: 'string';
  type: string;
  data: string;
  getAsString: (callback: (value: string) => void) => void;
  getAsFile: () => null;
}

function createTransferItem(type: string, data: string): TransferItem {
  return {
    kind: 'string',
    type,
    data,
    getAsString: (callback) => callback(data),
    getAsFile: () => null,
  };
}

/** A minimal DataTransfer: jsdom has none. */
function createTransfer() {
  const items: TransferItem[] = [];
  const list = Object.assign(items, {
    add: (data: string, type: string) => items.push(createTransferItem(type, data)),
    clear: () => {
      items.length = 0;
    },
  });
  const transfer = {
    dropEffect: 'none',
    effectAllowed: 'all',
    items: list,
    files: [] as File[],
    dragImages: 0,
    get types() {
      return items.map((item) => item.type);
    },
    getData: (type: string) => items.find((item) => item.type === type)?.data ?? '',
    setData: (type: string, data: string) => list.add(data, type),
    clearData: () => list.clear(),
    setDragImage: () => {
      transfer.dragImages += 1;
    },
  };
  return transfer;
}

type Transfer = ReturnType<typeof createTransfer>;

const ROW_HEIGHT = 20;

/** jsdom has no layout: give the tree and each row a 20px box in document order. */
function layout() {
  const tree = screen.getByRole('treegrid');
  const rows = [...tree.querySelectorAll<HTMLElement>('[role="row"][data-key]')];
  const box = (top: number, height: number) => () =>
    ({
      x: 0,
      y: top,
      top,
      left: 0,
      width: 200,
      height,
      right: 200,
      bottom: top + height,
    }) as DOMRect;
  tree.getBoundingClientRect = box(0, rows.length * ROW_HEIGHT);
  rows.forEach((element, index) => {
    element.getBoundingClientRect = box(index * ROW_HEIGHT, ROW_HEIGHT);
  });
  return { tree, rows };
}

/** The y coordinate `at` of the way down a row (0 its top edge, 1 its bottom edge). */
function pointOn(name: string, at: number): number {
  const { rows } = layout();
  const index = rows.indexOf(row(name));
  return index * ROW_HEIGHT + Math.round(at * (ROW_HEIGHT - 1));
}

function fire(type: string, target: Element, transfer: Transfer, y = 0) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 50, clientY: y });
  Object.defineProperty(event, 'dataTransfer', { value: transfer });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

const entered = new Set<Element>();

function startDrag(name: string, transfer = createTransfer()) {
  layout();
  fire('dragstart', row(name), transfer, pointOn(name, 0.5));
  return transfer;
}

/** Moves the pointer over a row, as a browser does: dragenter on the row, then dragover. */
function dragOver(transfer: Transfer, name: string, at: number) {
  layout();
  const y = pointOn(name, at);
  entered.add(row(name));
  fire('dragenter', row(name), transfer, y);
  fire('dragover', row(name), transfer, y);
}

/** Leaves the tree: dragleave on every element the drag entered. */
function leave(transfer: Transfer) {
  for (const element of entered) fire('dragleave', element, transfer);
  entered.clear();
}

/** Lets React Aria's drop, which reads the dragged items as promises, finish and render. */
async function settleDrop() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function drop(transfer: Transfer, source: string, name: string, at: number) {
  dragOver(transfer, name, at);
  fire('drop', row(name), transfer, pointOn(name, at));
  entered.clear();
  await settleDrop();
  fire('dragend', row(source), transfer);
}

/** A drag that ends without a drop (Escape, or a release outside the tree). */
function endDrag(transfer: Transfer, source: string) {
  leave(transfer);
  fire('dragend', row(source), transfer);
}

/** Drop targets on screen: rows (`on`) and indicators (`before`/`after` beside their row). */
function dropTargets() {
  return [...document.querySelectorAll('[data-drop-target]')]
    .filter((element) => element.getAttribute('role') === 'row')
    .map((element) =>
      element.classList.contains('ui-tree__drop-indicator')
        ? element.getAttribute('data-position')
        : `on ${element.getAttribute('aria-label')}`,
    );
}

/** The sibling order a move produces, read through the pure utility. */
function orderAfter(items: Shelf[], move: TreeMove | undefined, parent: string): string[] {
  if (!move) return [];
  const find = (level: readonly Shelf[]): Shelf | undefined => {
    for (const item of level) {
      if (item.id === parent) return item;
      const found = item.children ? find(item.children) : undefined;
      if (found) return found;
    }
    return undefined;
  };
  return (find(applyTreeMove(items, move))?.children ?? []).map((item) => item.id);
}

// Simulated drags re-render the whole tree many times; allow for a loaded test machine.
describe('Tree reordering', { timeout: 20_000 }, () => {
  it('UIC-TREE-REORDER-1.2 UIC-TREE-REORDER-1.4 reports original typed keys for a drag of numeric and textual siblings', async () => {
    const onMoveMany = vi.fn();
    render(
      <Tree
        aria-label="Keys"
        items={[
          { id: 1, name: 'Numeric item' },
          { id: '1', name: 'Text item' },
          { id: 'last', name: 'Last item' },
        ]}
        getTextValue={(item) => item.name}
        selectionMode="multiple"
        defaultSelectedKeys={[1, '1']}
        reorder={{ onMove() {}, onMoveMany }}
      />,
    );
    const transfer = startDrag('Numeric item');
    await drop(transfer, 'Numeric item', 'Last item', 0.9);
    expect(onMoveMany).toHaveBeenCalledExactlyOnceWith([
      { key: 1, targetKey: 'last', position: 'after' },
      { key: '1', targetKey: 1, position: 'after' },
    ]);
  });
  it('UIC-TREE-REORDER-1.1 offers drag affordances only on rows that can move, and none without reordering', () => {
    const { container, rerender } = render(<ShelfTree />);
    expect(
      container.querySelector('[draggable], [aria-keyshortcuts], .ui-tree__drag-handle'),
    ).toBeNull();
    expect(screen.getByRole('treegrid')).not.toHaveAttribute('data-allows-dragging');

    // Turning reordering on remounts the rows with their drag affordances.
    rerender(
      <ShelfTree
        reorder={{ canMove: (item) => item.id !== 'plum' && item.id !== 'pantry', onMove() {} }}
      />,
    );
    for (const name of ['Apple', 'Pear', 'Kiwi', 'Berries', 'Currant', 'Garden']) {
      expect(row(name)).toHaveAttribute('draggable', 'true');
      expect(row(name)).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowUp Alt+ArrowDown');
      expect(row(name).querySelector('.ui-tree__drag-handle')).toBeEnabled();
    }
    for (const name of ['Pantry', 'Plum', 'Fig']) {
      expect(row(name)).not.toHaveAttribute('draggable');
      expect(row(name)).not.toHaveAttribute('aria-keyshortcuts');
      expect(row(name).querySelector('.ui-tree__drag-handle')).toBeDisabled();
    }
    expect(row('Apple').querySelector('.ui-tree__drag-handle')).toHaveAttribute(
      'aria-label',
      'Drag Apple',
    );
    expect(row('Apple').querySelector('.ui-tree__drag-handle')).toHaveAttribute('tabindex', '-1');
    expectHooksMatchSpec(container, 'TREE', { slots: ['drag-handle'] });
  });

  it('UIC-TREE-REORDER-1.1 announces moves between parents when the owner allows them', () => {
    render(
      <ShelfTree
        items={CELLAR}
        expandedKeys={['cellar', 'box-a']}
        reorder={{ canMoveInto: canMoveIntoCellar, onMove() {} }}
      />,
    );
    expect(row('Bottle')).toHaveAttribute(
      'aria-keyshortcuts',
      'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight',
    );
  });

  it('UIC-TREE-REORDER-1.2 marks the dragged row, shows where it lands and reports one move on drop', async () => {
    const moves: TreeMove[] = [];
    const { container } = render(
      <ShelfTree
        reorder={{ canMove: (item) => item.id !== 'plum', onMove: (move) => moves.push(move) }}
      />,
    );
    const transfer = startDrag('Apple');
    expect(row('Apple')).toHaveAttribute('data-dragging', 'true');
    expect(transfer.getData('text/plain')).toBe('Apple');
    expect(transfer.effectAllowed).toBe('move');
    expect(transfer.dragImages).toBe(0);

    dragOver(transfer, 'Kiwi', 0.9);
    expect(dropTargets()).toHaveLength(1);
    expect(['after', 'before']).toContain(dropTargets()[0]);
    expectHooksMatchSpec(container, 'TREE', { slots: ['drop-indicator'] });
    await drop(transfer, 'Apple', 'Kiwi', 0.9);
    expect(moves).toHaveLength(1);
    expect(orderAfter(PANTRY, moves[0], 'pantry')).toEqual([
      'pear',
      'plum',
      'fig',
      'kiwi',
      'apple',
      'berries',
    ]);
    expect(row('Apple')).not.toHaveAttribute('data-dragging');
    expect(dropTargets()).toEqual([]);

    const second = startDrag('Kiwi');
    await drop(second, 'Kiwi', 'Apple', 0.1);
    expect(moves).toHaveLength(2);
    expect(orderAfter(PANTRY, moves[1], 'pantry')).toEqual([
      'kiwi',
      'apple',
      'pear',
      'plum',
      'fig',
      'berries',
    ]);
  });

  it('UIC-TREE-REORDER-1.2 refuses fixed, disabled and nested rows, the slot the row holds and drags from elsewhere', async () => {
    const onMove = vi.fn();
    render(
      <ShelfTree
        reorder={{ canMove: (item) => item.id !== 'plum' && item.id !== 'pantry', onMove }}
      />,
    );
    const transfer = startDrag('Apple');
    for (const [name, at] of [
      ['Plum', 0.5],
      ['Fig', 0.5],
      ['Currant', 0.5],
      ['Garden', 0.5],
      ['Apple', 0.5],
      ['Pear', 0.1],
    ] as const) {
      dragOver(transfer, name, at);
      expect(dropTargets()).toEqual([]);
    }
    await drop(transfer, 'Apple', 'Pear', 0.1);
    expect(onMove).not.toHaveBeenCalled();

    // A drag that ends anywhere else reports nothing and clears the dragged row.
    const cancelled = startDrag('Apple');
    dragOver(cancelled, 'Kiwi', 0.9);
    expect(dropTargets()).toHaveLength(1);
    endDrag(cancelled, 'Apple');
    expect(row('Apple')).not.toHaveAttribute('data-dragging');

    // A drag that did not start in this tree is not a reorder.
    const foreign = createTransfer();
    foreign.setData('text/plain', 'Elsewhere');
    dragOver(foreign, 'Kiwi', 0.9);
    expect(dropTargets()).toEqual([]);
    fire('drop', row('Kiwi'), foreign, pointOn('Kiwi', 0.9));
    entered.clear();
    await settleDrop();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('UIC-TREE-REORDER-1.2 checks a drop against the rows shown when it happens', async () => {
    const onMove = vi.fn();
    const view = (fixed: string[]) => (
      <ShelfTree reorder={{ canMove: (item) => !fixed.includes(item.id), onMove }} />
    );
    const { rerender } = render(view(['plum']));
    const transfer = startDrag('Apple');
    dragOver(transfer, 'Kiwi', 0.5);
    expect(dropTargets()).toHaveLength(1);
    rerender(view(['plum', 'kiwi', 'berries']));
    await drop(transfer, 'Apple', 'Kiwi', 0.5);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('UIC-TREE-REORDER-1.4 drags the selected rows together when the owner takes several moves', async () => {
    const onMove = vi.fn();
    const onMoveMany = vi.fn<(moves: readonly TreeMove[]) => void>();
    render(
      <ShelfTree
        selectionMode="multiple"
        defaultSelectedKeys={['apple', 'pear']}
        reorder={{ canMove: (item) => item.id !== 'plum', onMove, onMoveMany }}
      />,
    );
    const transfer = startDrag('Apple');
    dragOver(transfer, 'Kiwi', 0.9);
    expect(dropTargets()).toHaveLength(1);
    await drop(transfer, 'Apple', 'Kiwi', 0.9);
    expect(onMove).not.toHaveBeenCalled();
    expect(onMoveMany).toHaveBeenCalledTimes(1);
    const moves = onMoveMany.mock.lastCall?.[0] ?? [];
    expect(moves.map((move) => move.key)).toEqual(['apple', 'pear']);
    expect(moves[1]).toEqual({ key: 'pear', targetKey: 'apple', position: 'after' });
    const applied = moves.reduce<readonly Shelf[]>(applyTreeMove, PANTRY);
    expect(applied[0]?.children?.map((item) => item.id)).toEqual([
      'plum',
      'fig',
      'kiwi',
      'apple',
      'pear',
      'berries',
    ]);
  });

  it('UIC-TREE-REORDER-1.4 refuses a drop of several rows where one of them cannot go', async () => {
    const onMoveMany = vi.fn();
    render(
      <ShelfTree
        selectionMode="multiple"
        defaultSelectedKeys={['apple', 'kiwi']}
        reorder={{ canMove: (item) => item.id !== 'kiwi', onMove: vi.fn(), onMoveMany }}
      />,
    );
    const transfer = startDrag('Apple');
    dragOver(transfer, 'Pear', 0.9);
    expect(dropTargets()).toEqual([]);
    await drop(transfer, 'Apple', 'Pear', 0.9);
    expect(onMoveMany).not.toHaveBeenCalled();
  });

  it('UIC-TREE-REORDER-1.2 moves one row at a time', async () => {
    const onMove = vi.fn();
    render(
      <ShelfTree
        selectionMode="multiple"
        defaultSelectedKeys={['apple', 'pear']}
        reorder={{ canMove: (item) => item.id !== 'plum', onMove }}
      />,
    );
    const transfer = startDrag('Apple');
    dragOver(transfer, 'Kiwi', 0.9);
    expect(dropTargets()).toEqual([]);
    await drop(transfer, 'Apple', 'Kiwi', 0.9);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('UIC-TREE-REORDER-1.2 drops inside a row the owner lets take it, opening a closed one', async () => {
    const moves: TreeMove[] = [];
    function Harness() {
      const [expanded, setExpanded] = useState<Set<string | number>>(new Set(['cellar', 'box-a']));
      return (
        <ShelfTree
          items={CELLAR}
          expandedKeys={expanded}
          onExpandedChange={setExpanded}
          reorder={{
            canMove: (item) => item.id !== 'cellar' && item.id !== 'box-fixed',
            canMoveInto: canMoveIntoCellar,
            onMove: (move) => moves.push(move),
          }}
        />
      );
    }
    render(<Harness />);
    const transfer = startDrag('Bottle');
    dragOver(transfer, 'Box-b', 0.5);
    expect(dropTargets()).toEqual(['on Box-b']);
    dragOver(transfer, 'Box-fixed', 0.5);
    expect(dropTargets()).toEqual([]);
    dragOver(transfer, 'Cellar', 0.5);
    expect(dropTargets()).toEqual([]);
    await drop(transfer, 'Bottle', 'Box-c', 0.5);
    expect(moves).toEqual([{ key: 'bottle', targetKey: 'box-c', position: 'inside' }]);
    expect(row('Box-c')).toHaveAttribute('aria-expanded', 'true');

    // A box is not taken inside a box, and an item does not leave its box for the cellar.
    const box = startDrag('Box-b');
    dragOver(box, 'Box-a', 0.5);
    expect(dropTargets()).not.toContain('on Box-a');
    endDrag(box, 'Box-b');
    const jar = startDrag('Jar');
    dragOver(jar, 'Box-b', 0.5);
    expect(dropTargets()).toEqual(['on Box-b']);
    dragOver(jar, 'Flask', 0.5);
    expect(dropTargets()).toEqual([]);
    endDrag(jar, 'Jar');
  });

  it('UIC-TREE-REORDER-1.3 moves a row past its movable neighbour with Alt+Arrow and leaves other keys alone', async () => {
    const user = userEvent.setup();
    const moves: TreeMove[] = [];
    const onExpandedChange = vi.fn();
    render(
      <ShelfTree
        onExpandedChange={onExpandedChange}
        reorder={{ canMove: (item) => item.id !== 'plum', onMove: (move) => moves.push(move) }}
        onItemKeyDown={(item, event) =>
          item.id === 'kiwi' && event.altKey && event.key === 'ArrowDown'
        }
      />,
    );
    const press = (name: string, key: string, init: KeyboardEventInit = { altKey: true }) => {
      act(() => row(name).focus());
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
      act(() => {
        row(name).dispatchEvent(event);
      });
      return event;
    };

    expect(press('Apple', 'ArrowDown').defaultPrevented).toBe(true);
    expect(row('Apple')).toHaveFocus();
    press('Pear', 'ArrowDown');
    press('Kiwi', 'ArrowUp');
    // At either end of the movable siblings the chord is still the tree's, and moves nothing.
    expect(press('Apple', 'ArrowUp').defaultPrevented).toBe(true);
    expect(press('Currant', 'ArrowDown').defaultPrevented).toBe(true);
    // The owner sees the key first; a chord it claims is not also a move.
    expect(press('Kiwi', 'ArrowDown').defaultPrevented).toBe(true);
    expect(moves).toEqual([
      { key: 'apple', targetKey: 'pear', position: 'after' },
      { key: 'pear', targetKey: 'kiwi', position: 'after' },
      { key: 'kiwi', targetKey: 'pear', position: 'before' },
    ]);

    // A fixed row's Alt+Arrow, plain arrows and Alt+ArrowLeft without moves between parents stay
    // React Aria's.
    expect(press('Plum', 'ArrowDown').defaultPrevented).toBe(false);
    act(() => row('Apple').focus());
    await user.keyboard('{ArrowDown}');
    expect(row('Pear')).toHaveFocus();
    act(() => row('Berries').focus());
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['pantry']));
    expect(moves).toHaveLength(3);
  });

  it('UIC-TREE-REORDER-1.3 moves into the sibling above and out of the parent when the owner allows it', () => {
    const moves: TreeMove[] = [];
    const onExpandedChange = vi.fn();
    const view = (locale?: string) => (
      <UiProvider locale={locale}>
        <ShelfTree
          items={CELLAR}
          expandedKeys={['cellar', 'box-a']}
          onExpandedChange={onExpandedChange}
          reorder={{
            canMove: (item) => item.id !== 'cellar' && item.id !== 'box-fixed',
            canMoveInto: canMoveIntoCellar,
            onMove: (move) => moves.push(move),
          }}
        />
      </UiProvider>
    );
    const { rerender } = render(view());
    const press = (name: string, key: string) => {
      act(() => row(name).focus());
      const event = new KeyboardEvent('keydown', {
        key,
        altKey: true,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        row(name).dispatchEvent(event);
      });
      return event.defaultPrevented;
    };
    expect(press('Bottle', 'ArrowRight')).toBe(true);
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['cellar', 'box-a', 'box-c']));
    expect(press('Box-inner', 'ArrowLeft')).toBe(true);
    for (const [name, key] of [
      ['Box-a', 'ArrowRight'],
      ['Box-b', 'ArrowRight'],
      ['Jar', 'ArrowLeft'],
      ['Box-a', 'ArrowLeft'],
    ] as const) {
      expect(press(name, key)).toBe(true);
      expect(row(name)).toHaveFocus();
    }
    expect(moves).toEqual([
      { key: 'bottle', targetKey: 'box-c', position: 'inside' },
      { key: 'box-inner', targetKey: 'box-a', position: 'after' },
    ]);

    // Right to left, ArrowLeft moves in and ArrowRight out.
    rerender(view('he-IL'));
    press('Bottle', 'ArrowLeft');
    press('Box-inner', 'ArrowRight');
    expect(moves.slice(2)).toEqual([
      { key: 'bottle', targetKey: 'box-c', position: 'inside' },
      { key: 'box-inner', targetKey: 'box-a', position: 'after' },
    ]);
  });

  it('UIC-TREE-REORDER-1.3 keeps focus on the moved row across the owner re-render', async () => {
    const user = userEvent.setup();
    function Owner() {
      const [items, setItems] = useState([shelf('apple'), shelf('pear'), shelf('plum')]);
      return (
        <ShelfTree
          items={items}
          expandedKeys={[]}
          reorder={{ onMove: (move) => setItems((current) => [...applyTreeMove(current, move)]) }}
        />
      );
    }
    render(<Owner />);
    await user.tab();
    expect(row('Apple')).toHaveFocus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(screen.getAllByRole('row').map((element) => element.getAttribute('aria-label'))).toEqual(
      ['Pear', 'Apple', 'Plum'],
    );
    expect(row('Apple')).toHaveFocus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(screen.getAllByRole('row').map((element) => element.getAttribute('aria-label'))).toEqual(
      ['Pear', 'Plum', 'Apple'],
    );
    expect(row('Apple')).toHaveFocus();
    expect(row('Apple')).toHaveAttribute('tabindex', '0');
  });
});
