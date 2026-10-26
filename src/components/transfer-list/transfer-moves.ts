// The pure moves of a transfer list: adding items to the chosen keys, removing them, and reordering
// the chosen keys by a drop or by one step.

import type { Key } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';

/** A drop that places `keys` before or after `targetKey`. */
export interface TransferDrop {
  keys: readonly Key[];
  targetKey: Key;
  position: 'before' | 'after';
}

/** `chosen` followed by the `added` keys it does not hold yet, in the order of `order`. */
export function addChosenKeys(
  chosen: readonly Key[],
  { added, order }: { added: ReadonlySet<Key>; order: readonly Key[] },
): Key[] {
  const held = new Set(chosen);
  return [...chosen, ...order.filter((key) => added.has(key) && !held.has(key))];
}

/** `chosen` with the dropped keys moved, together and in their order, beside the target. */
export function dropChosenKeys(chosen: readonly Key[], drop: TransferDrop): Key[] {
  const moved = new Set(drop.keys);
  if (moved.has(drop.targetKey)) return [...chosen];
  const kept = chosen.filter((key) => !moved.has(key));
  const target = kept.indexOf(drop.targetKey);
  if (target < 0) return [...chosen];
  const at = drop.position === 'before' ? target : target + 1;
  const block = chosen.filter((key) => moved.has(key));
  return [...kept.slice(0, at), ...block, ...kept.slice(at)];
}

/**
 * `chosen` with each selected key moved one place up (`-1`) or down (`1`), passing over the next
 * unselected key; a selected key at the end it moves toward stays, and keys behind it stop there.
 */
export function stepChosenKeys(
  chosen: readonly Key[],
  { selected, step }: { selected: ReadonlySet<Key>; step: -1 | 1 },
): Key[] {
  const result = step === 1 ? [...chosen].reverse() : [...chosen];
  for (let index = 1; index < result.length; index += 1) {
    const key = result[index];
    const before = result[index - 1];
    if (key === undefined || before === undefined) continue;
    if (selected.has(key) && !selected.has(before)) {
      result[index - 1] = key;
      result[index] = before;
    }
  }
  return step === 1 ? result.reverse() : result;
}

/** Whether stepping the selected keys would move any of them. */
export function canStepChosenKeys(
  chosen: readonly Key[],
  { selected, step }: { selected: ReadonlySet<Key>; step: -1 | 1 },
): boolean {
  if (selected.size === 0) return false;
  for (let index = 0; index < chosen.length; index += 1) {
    const key = requireDefined(chosen[index]);
    const neighbor = chosen[index + step];
    if (neighbor !== undefined && selected.has(key) && !selected.has(neighbor)) return true;
  }
  return false;
}
