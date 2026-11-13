import { describe, expect, it } from 'vitest';
import {
  fromCollectionSelection,
  toCollectionSelection,
  toCollectionSelectionProps,
} from './collection-selection.js';
import { toCollectionKey } from './to-collection-key.js';

describe('Collection selection identity', () => {
  it('UIC-COMPOSITION-4.1 retains one-shot key iterables without freezing mutable collections', () => {
    const selectedKeys = (function* () {
      yield 1;
      yield '1';
    })();
    const disabledKeys = (function* () {
      yield 'a b';
    })();
    const props = { selectedKeys, disabledKeys };
    const first = toCollectionSelectionProps(props);
    expect(toCollectionSelectionProps(props)).toEqual(first);
    expect(first.selectedKeys).toEqual(new Set([toCollectionKey(1), toCollectionKey('1')]));
    expect(first.disabledKeys).toEqual([toCollectionKey('a b')]);
    const mutable = new Set([1]);
    expect(toCollectionSelection(mutable)).toEqual(new Set([toCollectionKey(1)]));
    mutable.add(2);
    expect(toCollectionSelection(mutable)).toEqual(
      new Set([toCollectionKey(1), toCollectionKey(2)]),
    );
  });

  it('UIC-COMPOSITION-4.1 preserves all and undefined without treating disabled text as a sentinel', () => {
    expect(toCollectionSelection(undefined)).toBeUndefined();
    const props = toCollectionSelectionProps({ selectedKeys: 'all', disabledKeys: 'all' });
    expect(props.selectedKeys).toBe('all');
    expect(props.disabledKeys).toEqual(['a', 'l', 'l'].map(toCollectionKey));
    expect(props.onSelectionChange).toBeUndefined();
  });

  it('UIC-TREE-3.2 preserves an unchanged primitive event selection through decoding and encoding', () => {
    const primitive = new Set([toCollectionKey(1), toCollectionKey('1'), toCollectionKey('a b')]);
    const decoded = fromCollectionSelection(primitive);
    expect(decoded).toEqual(new Set([1, '1', 'a b']));
    expect(toCollectionSelection(decoded)).toBe(primitive);
    expect(fromCollectionSelection('all')).toBe('all');
    expect(toCollectionSelection('all')).toBe('all');
  });

  it('UIC-TREE-3.2 encodes a mutated caller selection without changing the original event object', () => {
    const primitive = new Set([toCollectionKey(1)]);
    const decoded = fromCollectionSelection(primitive);
    if (decoded === 'all') throw new Error('Expected explicit keys');
    decoded.delete(1);
    decoded.add('1');
    expect(toCollectionSelection(decoded)).toEqual(new Set([toCollectionKey('1')]));
    expect(toCollectionSelection(decoded)).not.toBe(primitive);
    expect(primitive).toEqual(new Set([toCollectionKey(1)]));
  });

  it('UIC-COMPOSITION-4.1 encodes an unchanged selection once and returns the same set', () => {
    const selected = new Set([1, 'a b']);
    const first = toCollectionSelection(selected);
    expect(toCollectionSelection(selected)).toBe(first);
    selected.delete(1);
    selected.add(2);
    const changed = toCollectionSelection(selected);
    expect(changed).not.toBe(first);
    expect(changed).toEqual(new Set([toCollectionKey('a b'), toCollectionKey(2)]));
  });
});
