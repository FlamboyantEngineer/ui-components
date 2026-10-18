import { describe, expect, it } from 'vitest';
import {
  applyBoardMove,
  applyColumnMove,
  createBoardLayout,
  getCellCards,
  resolveBoardDrop,
  resolveBoardKeyboardMove,
  resolveColumnDrop,
  stepColumnMove,
} from './board-moves.js';

interface Task {
  id: string;
  column: string;
  lane: string;
}

const tasks: Task[] = [
  { id: 'a', column: 'todo', lane: 'north' },
  { id: 'b', column: 'todo', lane: 'north' },
  { id: 'c', column: 'todo', lane: 'north' },
  { id: 'd', column: 'doing', lane: 'north' },
  { id: 'e', column: 'done', lane: 'south' },
  { id: 'lost', column: 'elsewhere', lane: 'north' },
];

function layoutOf(options: { lanes?: boolean; collapsed?: string[] } = {}) {
  return createBoardLayout({
    columns: ['todo', 'doing', 'done'],
    lanes: options.lanes ? ['north', 'south'] : [null],
    collapsedColumns: new Set(options.collapsed ?? []),
    items: tasks,
    getKey: (task) => task.id,
    getColumn: (task) => task.column,
    getLane: options.lanes ? (task) => task.lane : undefined,
  });
}

describe('board moves', () => {
  it('UIC-BOARD-2.1 sorts cards into cells in order and leaves out unknown columns', () => {
    const plain = layoutOf();
    expect(getCellCards(plain, { column: 'todo', lane: null })).toEqual(['a', 'b', 'c']);
    expect(getCellCards(plain, { column: 'done', lane: null })).toEqual(['e']);
    expect(plain.addresses.has('lost')).toBe(false);
    const laned = layoutOf({ lanes: true });
    expect(getCellCards(laned, { column: 'done', lane: 'north' })).toEqual([]);
    expect(getCellCards(laned, { column: 'done', lane: 'south' })).toEqual(['e']);
    expect(getCellCards(laned, { column: 'missing', lane: 'south' })).toEqual([]);
  });

  it('UIC-BOARD-2.2 resolves drops beside cards and on cells', () => {
    const layout = layoutOf();
    const todo = { column: 'todo', lane: null };
    const doing = { column: 'doing', lane: null };
    const done = { column: 'done', lane: null };
    const item = (key: string, dropPosition: 'before' | 'after' | 'on') =>
      ({ type: 'item', key, dropPosition }) as const;
    expect(
      resolveBoardDrop(layout, { key: 'a', address: todo, target: item('c', 'after') }),
    ).toEqual({ key: 'a', column: 'todo', lane: null, targetKey: 'c', position: 'after' });
    expect(
      resolveBoardDrop(layout, { key: 'a', address: doing, target: item('d', 'before') }),
    ).toEqual({ key: 'a', column: 'doing', lane: null, targetKey: 'd', position: 'before' });
    expect(resolveBoardDrop(layout, { key: 'a', address: done, target: { type: 'root' } })).toEqual(
      {
        key: 'a',
        column: 'done',
        lane: null,
        targetKey: 'e',
        position: 'after',
      },
    );
  });

  it('UIC-BOARD-2.2 refuses drops on cards, in place, elsewhere or of unknown cards', () => {
    const layout = layoutOf();
    const todo = { column: 'todo', lane: null };
    const item = (key: string, dropPosition: 'before' | 'after' | 'on') =>
      ({ type: 'item', key, dropPosition }) as const;
    expect(
      resolveBoardDrop(layout, { key: 'a', address: todo, target: item('b', 'on') }),
    ).toBeNull();
    expect(
      resolveBoardDrop(layout, { key: 'a', address: todo, target: item('a', 'after') }),
    ).toBeNull();
    expect(
      resolveBoardDrop(layout, { key: 'a', address: todo, target: item('b', 'before') }),
    ).toBeNull();
    expect(
      resolveBoardDrop(layout, { key: 'b', address: todo, target: item('a', 'after') }),
    ).toBeNull();
    expect(
      resolveBoardDrop(layout, { key: 'c', address: todo, target: { type: 'root' } }),
    ).toBeNull();
    expect(
      resolveBoardDrop(layout, { key: 'a', address: todo, target: item('d', 'after') }),
    ).toBeNull();
    expect(
      resolveBoardDrop(layout, { key: 'zz', address: todo, target: { type: 'root' } }),
    ).toBeNull();
  });

  it('UIC-BOARD-2.2 lands a drop on an empty cell with no target', () => {
    const layout = layoutOf({ lanes: true });
    expect(
      resolveBoardDrop(layout, {
        key: 'a',
        address: { column: 'done', lane: 'north' },
        target: { type: 'root' },
      }),
    ).toEqual({ key: 'a', column: 'done', lane: 'north', targetKey: null, position: 'after' });
  });

  it('UIC-BOARD-2.3 resolves keyboard moves within a cell and across open columns', () => {
    const layout = layoutOf({ collapsed: ['doing'] });
    expect(resolveBoardKeyboardMove(layout, { key: 'b', direction: 'up' })).toEqual({
      key: 'b',
      column: 'todo',
      lane: null,
      targetKey: 'a',
      position: 'before',
    });
    expect(resolveBoardKeyboardMove(layout, { key: 'b', direction: 'down' })?.targetKey).toBe('c');
    expect(resolveBoardKeyboardMove(layout, { key: 'a', direction: 'up' })).toBeNull();
    expect(resolveBoardKeyboardMove(layout, { key: 'c', direction: 'down' })).toBeNull();
    expect(resolveBoardKeyboardMove(layout, { key: 'a', direction: 'previous' })).toBeNull();
    // The collapsed column is skipped; the card keeps its place, clamped to the end.
    expect(resolveBoardKeyboardMove(layout, { key: 'a', direction: 'next' })).toEqual({
      key: 'a',
      column: 'done',
      lane: null,
      targetKey: 'e',
      position: 'before',
    });
    expect(resolveBoardKeyboardMove(layout, { key: 'c', direction: 'next' })).toEqual({
      key: 'c',
      column: 'done',
      lane: null,
      targetKey: 'e',
      position: 'after',
    });
    expect(resolveBoardKeyboardMove(layout, { key: 'zz', direction: 'next' })).toBeUndefined();
  });

  it('UIC-BOARD-2.3 moves a card into an empty cell of its lane', () => {
    const layout = layoutOf({ lanes: true });
    expect(resolveBoardKeyboardMove(layout, { key: 'd', direction: 'next' })).toEqual({
      key: 'd',
      column: 'done',
      lane: 'north',
      targetKey: null,
      position: 'after',
    });
  });

  it('UIC-BOARD-3.2 resolves column drops and keyboard steps', () => {
    const columns = ['todo', 'doing', 'done'];
    expect(resolveColumnDrop(columns, { key: 'todo', targetKey: 'done' })).toEqual({
      key: 'todo',
      targetKey: 'done',
      position: 'after',
    });
    expect(resolveColumnDrop(columns, { key: 'done', targetKey: 'todo' })?.position).toBe('before');
    expect(resolveColumnDrop(columns, { key: 'done', targetKey: 'done' })).toBeNull();
    expect(resolveColumnDrop(columns, { key: 'zz', targetKey: 'done' })).toBeNull();
    expect(stepColumnMove(columns, 'doing', -1)).toEqual({
      key: 'doing',
      targetKey: 'todo',
      position: 'before',
    });
    expect(stepColumnMove(columns, 'doing', 1)?.position).toBe('after');
    expect(stepColumnMove(columns, 'done', 1)).toBeNull();
    expect(stepColumnMove(columns, 'zz', 1)).toBeNull();
  });

  it('UIC-BOARD-2.4 applies card and column moves to the owner data', () => {
    const place = (task: Task, cell: { column: unknown; lane: unknown }) => ({
      ...task,
      column: String(cell.column),
      lane: String(cell.lane ?? task.lane),
    });
    const moved = applyBoardMove(
      tasks,
      { key: 'a', column: 'doing', lane: null, targetKey: 'd', position: 'after' },
      place,
    );
    expect(moved.map((task) => task.id)).toEqual(['b', 'c', 'd', 'a', 'e', 'lost']);
    expect(moved[3]).toEqual({ id: 'a', column: 'doing', lane: 'north' });
    const first = applyBoardMove(
      tasks,
      { key: 'e', column: 'todo', lane: 'north', targetKey: 'a', position: 'before' },
      place,
    );
    expect(first.map((task) => task.id)).toEqual(['e', 'a', 'b', 'c', 'd', 'lost']);
    const empty = applyBoardMove(
      tasks,
      { key: 'a', column: 'done', lane: 'north', targetKey: null, position: 'after' },
      place,
    );
    expect(empty.at(-1)).toEqual({ id: 'a', column: 'done', lane: 'north' });
    expect(
      applyBoardMove(
        tasks,
        { key: 'zz', column: 'done', lane: null, targetKey: null, position: 'after' },
        place,
      ),
    ).toEqual(tasks);
    expect(tasks[0]).toEqual({ id: 'a', column: 'todo', lane: 'north' });
    const columns = [{ id: 'todo' }, { id: 'doing' }, { id: 'done' }];
    expect(
      applyColumnMove(columns, { key: 'todo', targetKey: 'done', position: 'after' }).map(
        (column) => column.id,
      ),
    ).toEqual(['doing', 'done', 'todo']);
  });
});
