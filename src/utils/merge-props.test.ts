import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mergeProps, mergeRefs } from './merge-props.js';

describe('mergeProps', () => {
  it('UIC-COMPOSITION-2.1 chains handlers in order and keeps the last return value', () => {
    const calls: string[] = [];
    const unset: { onClick?: (value: string) => number } = { onClick: undefined };
    const merged = mergeProps(
      { onClick: (value: string) => calls.push(`first ${value}`) },
      { onClick: (value: string) => calls.push(`second ${value}`) },
      unset,
    );
    expect(merged.onClick?.('click')).toBe(2);
    expect(calls).toEqual(['first click', 'second click']);
  });

  it('UIC-COMPOSITION-2.1 joins class names, merges styles and lets later values win', () => {
    const merged = mergeProps(
      { className: 'ui-overflow-list', style: { width: 10, height: 4 }, id: 'one', role: 'list' },
      { className: 'caller', style: { width: 20 }, id: 'two', role: undefined },
      { className: '', title: 'Fruit' },
    );
    expect(merged).toEqual({
      className: 'ui-overflow-list caller',
      style: { width: 20, height: 4 },
      id: 'two',
      role: 'list',
      title: 'Fruit',
    });
  });

  it('UIC-COMPOSITION-2.1 does not chain props that only look like handlers', () => {
    const first = vi.fn();
    const second = vi.fn();
    const merged = mergeProps({ once: first, onclick: first }, { once: second, onclick: second });
    expect(merged.once).toBe(second);
    expect(merged.onclick).toBe(second);
  });

  it('UIC-COMPOSITION-2.2 combines refs so every ref receives the element', () => {
    const objectRef = createRef<HTMLDivElement>();
    const callback = vi.fn();
    const merged = mergeProps({ ref: objectRef }, { ref: callback });
    const element = document.createElement('div');
    const cleanup = (merged.ref as (node: HTMLDivElement | null) => () => void)(element);
    expect(objectRef.current).toBe(element);
    expect(callback).toHaveBeenCalledWith(element);
    cleanup();
    expect(objectRef.current).toBeNull();
    expect(callback).toHaveBeenLastCalledWith(null);
  });

  it('UIC-COMPOSITION-2.2 runs React 19 ref cleanups instead of passing null', () => {
    const cleanup = vi.fn();
    const callback = vi.fn(() => cleanup);
    const element = document.createElement('span');
    const release = mergeRefs<HTMLSpanElement>(callback, undefined, null)(element);
    expect(callback).toHaveBeenCalledTimes(1);
    if (typeof release === 'function') release();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
