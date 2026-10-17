import { describe, expect, it } from 'vitest';
import { createSlotRegistry } from './slot-registry.js';

function element(id: string): HTMLElement {
  const node = document.createElement('span');
  node.id = id;
  return node;
}

describe('createSlotRegistry', () => {
  it('UIC-SLOT-REGISTRY-1.1 returns the same ref callback for a slot on every call', () => {
    const slots = createSlotRegistry<'input' | 'prefix'>();
    expect(slots.ref('input')).toBe(slots.ref('input'));
    expect(slots.ref('input')).not.toBe(slots.ref('prefix'));
    expect(slots.refAt('prefix', 1)).toBe(slots.refAt('prefix', 1));
  });

  it('UIC-SLOT-REGISTRY-1.2 reads a slot only between its commit and its removal', () => {
    const slots = createSlotRegistry<'input'>();
    expect(slots.read('input')).toBeNull();
    const input = document.createElement('input');
    slots.ref('input')(input);
    expect(slots.read<HTMLInputElement>('input')?.value).toBe('');
    expect(slots.read('input')).toBe(input);
    slots.ref('input')(null);
    expect(slots.read('input')).toBeNull();
  });

  it('UIC-SLOT-REGISTRY-1.3 reads every occurrence of a repeated slot in index order', () => {
    const slots = createSlotRegistry<'thumb' | 'option'>();
    slots.refAt('thumb', 10)(element('ten'));
    slots.refAt('thumb', 2)(element('two'));
    slots.refAt('option', 0)(element('other'));
    expect(slots.readAll('thumb').map((node) => node.id)).toEqual(['two', 'ten']);
    slots.refAt('thumb', 2)(null);
    expect(slots.readAll('thumb').map((node) => node.id)).toEqual(['ten']);
    expect(slots.readAll('option').map((node) => node.id)).toEqual(['other']);
  });
});
