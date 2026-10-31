import { Children, Fragment, isValidElement, type ReactNode } from 'react';

/** One child of the transcript: a message, or a part between messages such as a separator. */
export interface TranscriptItem {
  /** The child's `id`, else its React key, else its position: how the transcript finds it. */
  key: string;
  node: ReactNode;
}

/** What changed in the children since the last commit. */
export interface TranscriptChange {
  /** Nothing survived (or nothing was there before the first commit): a fresh conversation. */
  isReset: boolean;
  /** Keys added after the first surviving one: what arrived. */
  arrivals: string[];
  /** Keys added before every surviving one: older history. */
  older: string[];
}

/** The child's own key: its `id` prop, else its React key, else its position. */
function readKey(child: ReactNode, index: number): string {
  if (!isValidElement(child)) return `#${index}`;
  const { id } = child.props as { id?: unknown };
  if (typeof id === 'string' && id !== '') return id;
  return child.key ?? `#${index}`;
}

/** Adds the children to `items`, flattening fragments so each child draws one element. */
function collectInto(children: ReactNode, items: TranscriptItem[], used: Set<string>) {
  Children.forEach(children, (child) => {
    if (child === null || child === undefined || typeof child === 'boolean') return;
    if (isValidElement(child) && child.type === Fragment) {
      collectInto((child.props as { children?: ReactNode }).children, items, used);
      return;
    }
    let key = readKey(child, items.length);
    // A repeated key keeps the first child's identity; later ones are told apart by position.
    if (used.has(key)) key = `${key}#${items.length}`;
    used.add(key);
    items.push({ key, node: child });
  });
}

/** The transcript's children, flattened, each with a key unique among them. */
export function collectTranscriptItems(children: ReactNode): TranscriptItem[] {
  const items: TranscriptItem[] = [];
  collectInto(children, items, new Set());
  return items;
}

/** Sorts the keys that are new since `previous` into arrivals and older history. */
export function diffTranscriptKeys(
  previous: readonly string[] | null,
  next: readonly string[],
): TranscriptChange {
  if (previous === null) return { isReset: true, arrivals: [], older: [] };
  if (previous.length === 0) return { isReset: false, arrivals: [...next], older: [] };
  const before = new Set(previous);
  const firstSurvivor = next.findIndex((key) => before.has(key));
  if (firstSurvivor === -1) return { isReset: true, arrivals: [], older: [] };
  return {
    isReset: false,
    arrivals: next.slice(firstSurvivor + 1).filter((key) => !before.has(key)),
    older: next.slice(0, firstSurvivor),
  };
}
