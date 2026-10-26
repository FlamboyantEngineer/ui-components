import type { Key } from '../../core/props.js';
/** A drop that places `keys` before or after `targetKey`. */
export interface TransferDrop {
    keys: readonly Key[];
    targetKey: Key;
    position: 'before' | 'after';
}
/** `chosen` followed by the `added` keys it does not hold yet, in the order of `order`. */
export declare function addChosenKeys(chosen: readonly Key[], { added, order }: {
    added: ReadonlySet<Key>;
    order: readonly Key[];
}): Key[];
/** `chosen` with the dropped keys moved, together and in their order, beside the target. */
export declare function dropChosenKeys(chosen: readonly Key[], drop: TransferDrop): Key[];
/**
 * `chosen` with each selected key moved one place up (`-1`) or down (`1`), passing over the next
 * unselected key; a selected key at the end it moves toward stays, and keys behind it stop there.
 */
export declare function stepChosenKeys(chosen: readonly Key[], { selected, step }: {
    selected: ReadonlySet<Key>;
    step: -1 | 1;
}): Key[];
/** Whether stepping the selected keys would move any of them. */
export declare function canStepChosenKeys(chosen: readonly Key[], { selected, step }: {
    selected: ReadonlySet<Key>;
    step: -1 | 1;
}): boolean;
//# sourceMappingURL=transfer-moves.d.ts.map