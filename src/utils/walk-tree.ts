import { requireDefined } from './require-defined.js';
export function* walkTree<T>(
  items: readonly T[],
  getChildren: (item: T) => readonly T[] | undefined,
): Generator<T> {
  const levels = [items[Symbol.iterator]()];
  while (levels.length > 0) {
    const next = requireDefined(levels.at(-1)).next();
    if (next.done) {
      levels.pop();
      continue;
    }
    yield next.value;
    const children = getChildren(next.value);
    if (children?.length) levels.push(children[Symbol.iterator]());
  }
}
