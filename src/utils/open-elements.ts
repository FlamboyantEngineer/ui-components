// The open-element stack of the markup readers (specs/MARKUP.md). It finds the nearest open
// element of a name without walking the stack, so deep or unbalanced markup reads in linear time.

export interface OpenElements<T> {
  /** The open elements, outermost first; the first is the root, which never closes. */
  readonly elements: T[];
  /** Each element's name, as matched by `findOpen`. */
  readonly names: string[];
  /** The stack positions of the open elements of each name, in order. */
  readonly positions: Map<string, number[]>;
}

export function createOpenElements<T>(root: T): OpenElements<T> {
  return { elements: [root], names: [''], positions: new Map() };
}

export function currentOpen<T>({ elements }: OpenElements<T>): T {
  return elements[elements.length - 1] as T;
}

export function pushOpen<T>(open: OpenElements<T>, element: T, name: string): void {
  const list = open.positions.get(name) ?? [];
  list.push(open.elements.length);
  open.positions.set(name, list);
  open.elements.push(element);
  open.names.push(name);
}

/** The position of the nearest open element with one of `names`, or -1; the root is never found. */
export function findOpen<T>(open: OpenElements<T>, names: Iterable<string>): number {
  let nearest = -1;
  for (const name of names) nearest = Math.max(nearest, open.positions.get(name)?.at(-1) ?? -1);
  return nearest;
}

/** Closes the element at `position` and every element opened inside it. */
export function closeOpen<T>(open: OpenElements<T>, position: number): void {
  for (let index = open.elements.length - 1; index >= position && index > 0; index -= 1) {
    open.positions.get(open.names[index] as string)?.pop();
  }
  open.elements.length = Math.max(1, position);
  open.names.length = open.elements.length;
}
