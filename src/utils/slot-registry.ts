// Commit-time registry of named element slots, read back by the component that rendered them.

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
export function createSlotRegistry<Slot extends string>(): SlotRegistry<Slot> {
  const nodes = new Map<string, HTMLElement>();
  const callbacks = new Map<string, SlotRef>();

  const callbackFor = (key: string): SlotRef => {
    let callback = callbacks.get(key);
    if (!callback) {
      callback = (node) => {
        if (node) nodes.set(key, node);
        else nodes.delete(key);
      };
      callbacks.set(key, callback);
    }
    return callback;
  };

  return {
    ref: (slot) => callbackFor(slot),
    refAt: (slot, index) => callbackFor(`${slot}:${index}`),
    read: <T extends HTMLElement = HTMLElement>(slot: Slot) =>
      (nodes.get(slot) as T | undefined) ?? null,
    readAll(slot) {
      const prefix = `${slot}:`;
      return [...nodes.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, node]) => [Number(key.slice(prefix.length)), node] as const)
        .sort(([left], [right]) => left - right)
        .map(([, node]) => node);
    },
  };
}
