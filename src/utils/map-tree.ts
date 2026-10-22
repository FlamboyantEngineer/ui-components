interface TreeFrame<T, U> {
  items: Iterator<[number, T]>;
  mapped: U[];
  item?: T;
  index?: number;
}

/** Maps descendants before their parent; returning null omits that item and its mapped children. */
export function mapTree<T, U>(
  items: readonly T[],
  getChildren: (item: T) => readonly T[] | null | undefined,
  transform: (item: T, children: U[], index: number) => U | null,
): U[] {
  const frames: Array<TreeFrame<T, U>> = [{ items: items.entries(), mapped: [] }];
  while (frames.length > 0) {
    const frame = frames.at(-1)!;
    const next = frame.items.next();
    if (!next.done) {
      const [index, item] = next.value;
      frames.push({
        items: (getChildren(item) ?? []).entries(),
        mapped: [],
        item,
        index,
      });
      continue;
    }
    frames.pop();
    if (frames.length === 0) return frame.mapped;
    const result = transform(frame.item!, frame.mapped, frame.index!);
    if (result !== null) frames.at(-1)!.mapped.push(result);
  }
  return [];
}
