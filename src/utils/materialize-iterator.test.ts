import { describe, expect, it, vi } from 'vitest';
import { materializeIterator } from './materialize-iterator.js';

describe('materializeIterator', () => {
  it('UIC-COMPOSITION-4.1 retains a self-iterating generator without reading it twice', () => {
    const read = vi.fn();
    const values = (function* () {
      read();
      yield 1;
      yield '1';
    })();
    expect([...materializeIterator(values)]).toEqual([1, '1']);
    expect([...materializeIterator(values)]).toEqual([1, '1']);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('UIC-COMPOSITION-4.1 reads mutable arrays and Sets again', () => {
    const array = [1];
    const set = new Set([1]);
    expect([...materializeIterator(array)]).toEqual([1]);
    expect([...materializeIterator(set)]).toEqual([1]);
    array.push(2);
    set.add(2);
    expect([...materializeIterator(array)]).toEqual([1, 2]);
    expect([...materializeIterator(set)]).toEqual([1, 2]);
  });

  it('UIC-COMPOSITION-4.1 does not cache a reusable iterable that also exposes next', () => {
    const read = vi.fn();
    const values = [1];
    const iterable = {
      next: () => ({ done: true, value: undefined }),
      [Symbol.iterator]: () => {
        read();
        return values[Symbol.iterator]();
      },
    };
    expect([...materializeIterator(iterable)]).toEqual([1]);
    values.push(2);
    expect([...materializeIterator(iterable)]).toEqual([1, 2]);
    expect(read).toHaveBeenCalledTimes(2);
  });
});
