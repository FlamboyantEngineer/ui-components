import { describe, expect, it } from 'vitest';
import {
  addChosenKeys,
  canStepChosenKeys,
  dropChosenKeys,
  stepChosenKeys,
} from './transfer-moves.js';

describe('addChosenKeys', () => {
  it('UIC-TRANSFER-LIST-2.2 appends new keys in the items order, skipping held ones', () => {
    const order = ['a', 'b', 'c', 'd', 'e'];
    expect(addChosenKeys(['d'], { added: new Set(['e', 'b', 'd']), order })).toEqual([
      'd',
      'b',
      'e',
    ]);
    expect(addChosenKeys([], { added: new Set(), order })).toEqual([]);
  });
});

describe('dropChosenKeys', () => {
  const chosen = ['a', 'b', 'c', 'd', 'e'];

  it('UIC-TRANSFER-LIST-2.4 places dropped keys together, in their order, beside the target', () => {
    expect(
      dropChosenKeys(chosen, { keys: ['e', 'b'], targetKey: 'a', position: 'before' }),
    ).toEqual(['b', 'e', 'a', 'c', 'd']);
    expect(dropChosenKeys(chosen, { keys: ['a'], targetKey: 'd', position: 'after' })).toEqual([
      'b',
      'c',
      'd',
      'a',
      'e',
    ]);
  });

  it('UIC-TRANSFER-LIST-2.4 ignores a drop on a moved or unknown key', () => {
    expect(dropChosenKeys(chosen, { keys: ['a', 'b'], targetKey: 'b', position: 'after' })).toEqual(
      chosen,
    );
    expect(dropChosenKeys(chosen, { keys: ['a'], targetKey: 'z', position: 'after' })).toEqual(
      chosen,
    );
  });
});

describe('stepChosenKeys', () => {
  const chosen = ['a', 'b', 'c', 'd'];

  it('UIC-TRANSFER-LIST-2.4 moves each selected key one place over the next unselected key', () => {
    expect(stepChosenKeys(chosen, { selected: new Set(['b', 'c']), step: -1 })).toEqual([
      'b',
      'c',
      'a',
      'd',
    ]);
    expect(stepChosenKeys(chosen, { selected: new Set(['b', 'c']), step: 1 })).toEqual([
      'a',
      'd',
      'b',
      'c',
    ]);
    expect(stepChosenKeys(chosen, { selected: new Set(['a', 'c']), step: -1 })).toEqual([
      'a',
      'c',
      'b',
      'd',
    ]);
  });

  it('UIC-TRANSFER-LIST-2.4 knows when a step would move nothing', () => {
    expect(canStepChosenKeys(chosen, { selected: new Set(['a', 'b']), step: -1 })).toBe(false);
    expect(canStepChosenKeys(chosen, { selected: new Set(['a', 'b']), step: 1 })).toBe(true);
    expect(canStepChosenKeys(chosen, { selected: new Set(['d']), step: 1 })).toBe(false);
    expect(canStepChosenKeys(chosen, { selected: new Set(), step: 1 })).toBe(false);
  });

  it('UIC-TRANSFER-LIST-2.4 matches movement availability for every partial selection', () => {
    const keys = [0, '', 1, '1', 'last'];
    for (let mask = 0; mask < 2 ** keys.length; mask += 1) {
      const selected = new Set(keys.filter((_, index) => (mask & (1 << index)) !== 0));
      for (const step of [-1, 1] as const) {
        const moved = stepChosenKeys(keys, { selected, step });
        expect(canStepChosenKeys(keys, { selected, step })).toBe(
          moved.some((key, index) => key !== keys[index]),
        );
      }
    }
  });
});
