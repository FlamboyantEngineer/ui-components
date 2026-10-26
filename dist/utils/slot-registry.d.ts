/** A ref callback that publishes one element. */
export type SlotRef = (node: HTMLElement | null) => void;
export interface SlotRegistry<Slot extends string> {
    /** The ref callback for `slot`. It is the same function on every call, so React never re-attaches it. */
    ref(slot: Slot): SlotRef;
    /** The ref callback for one occurrence of a repeated slot (range thumbs, options). */
    refAt(slot: Slot, index: number): SlotRef;
    /** The committed element of `slot`, or `null` before its first commit and after it unmounts. */
    read<T extends HTMLElement = HTMLElement>(slot: Slot): T | null;
    /** Every committed occurrence of a repeated slot, in index order. */
    readAll(slot: Slot): HTMLElement[];
}
/**
 * Creates a registry that components fill through ref callbacks and read on demand, instead of
 * querying their own markup for slot classes.
 */
export declare function createSlotRegistry<Slot extends string>(): SlotRegistry<Slot>;
//# sourceMappingURL=slot-registry.d.ts.map