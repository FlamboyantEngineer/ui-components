import { requireDefined } from './require-defined.js';
interface TreeFrame<T, U> {
  items: Iterator<[number, T]>;
  mapped: U[];
  item?: T;
  index?: number;
  /** An item past `maxDepth` whose children map straight into its parent's list. */
  isUnwrapped?: boolean;
}

interface DepthBoundTree<T, U> {
  getChildren: (item: T) => readonly T[] | null | undefined;
  transform: (item: T, children: U[], index: number) => U | null;
  /**
   * The deepest level mapped as nested (top-level items are at depth 1). Deeper items that have
   * children are unwrapped: their mapped descendants join the list of their ancestor at
   * `maxDepth`, in order, each with its index in that list, so the result is never deeper.
   */
  maxDepth: number;
}

/** Maps descendants before their parent; returning null omits that item and its mapped children. */
export function mapTree<T, U>(
  items: readonly T[],
  getChildren: (item: T) => readonly T[] | null | undefined,
  transform: (item: T, children: U[], index: number) => U | null,
): U[] {
  return mapTreeToDepth(items, { getChildren, transform, maxDepth: Infinity });
}

/** `mapTree`, unwrapping items deeper than `maxDepth` into their ancestor at that depth. */
export function mapTreeToDepth<T, U>(
  items: readonly T[],
  { getChildren, transform, maxDepth }: DepthBoundTree<T, U>,
): U[] {
  const frames: Array<TreeFrame<T, U>> = [{ items: items.entries(), mapped: [] }];
  while (frames.length > 0) {
    const frame = requireDefined(frames.at(-1));
    const next = frame.items.next();
    if (!next.done) {
      const [index, item] = next.value;
      const children = getChildren(item) ?? [];
      const isTooDeep = frames.length > maxDepth;
      if (isTooDeep && children.length > 0) {
        frames.push({ items: children.entries(), mapped: frame.mapped, isUnwrapped: true });
        continue;
      }
      frames.push({
        items: children.entries(),
        mapped: [],
        item,
        index: isTooDeep ? frame.mapped.length : index,
      });
      continue;
    }
    frames.pop();
    if (frames.length === 0) return frame.mapped;
    if (frame.isUnwrapped) continue;
    const result = transform(requireDefined(frame.item), frame.mapped, requireDefined(frame.index));
    if (result !== null) requireDefined(frames.at(-1)).mapped.push(result);
  }
  return [];
}
