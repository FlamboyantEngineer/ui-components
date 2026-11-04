// The delimiter run items of the inline parser and CommonMark's emphasis pass over them
// (specs/MARKDOWN.md), linear in the number of items.

import type { MarkdownInline } from './markdown-nodes.js';

interface Delimiter {
  kind: 'delimiter';
  char: string;
  count: number;
  original: number;
  canOpen: boolean;
  canClose: boolean;
}

export interface Bracket {
  kind: 'bracket';
  isImage: boolean;
  /** Index of the label's first character. */
  start: number;
}

export type Item = { kind: 'node'; node: MarkdownInline } | Delimiter | Bracket;

/** An item in the pass's list, with the neighbouring items and delimiters still in play. */
interface Cell {
  item: Item;
  /** Increases along the list, so a removed cell still orders against the others. */
  order: number;
  prev: Cell | null;
  next: Cell | null;
  prevDelimiter: Cell | null;
  nextDelimiter: Cell | null;
}

export function itemText(item: Delimiter | Bracket): string {
  if (item.kind === 'delimiter') return item.char.repeat(item.count);
  return item.isImage ? '![' : '[';
}

/** The items as nodes: leftover delimiters and brackets become text, adjacent texts merge. */
export function toNodes(items: Iterable<Item>): MarkdownInline[] {
  const nodes: MarkdownInline[] = [];
  for (const item of items) {
    const node: MarkdownInline =
      item.kind === 'node' ? item.node : { type: 'text', text: itemText(item) };
    const last = nodes[nodes.length - 1];
    if (node.type === 'text' && last?.type === 'text') {
      nodes[nodes.length - 1] = { type: 'text', text: last.text + node.text };
    } else if (node.type !== 'text' || node.text) {
      nodes.push(node);
    }
  }
  return nodes;
}

function isOpenerFor(item: Delimiter, closer: Delimiter): boolean {
  if (item.char !== closer.char || !item.canOpen) return false;
  if (closer.char === '~') return item.count === closer.count;
  const isOddMatch =
    (item.canClose || closer.canOpen) &&
    (item.original + closer.original) % 3 === 0 &&
    !(item.original % 3 === 0 && closer.original % 3 === 0);
  return !isOddMatch;
}

/** Closers with the same key find the same openers, so a failed search never repeats. */
function closerKey(closer: Delimiter): string {
  if (closer.char === '~') return `~${closer.count}`;
  return `${closer.char}${closer.canOpen ? 'o' : ''}${closer.original % 3}`;
}

function createCell(item: Item, order: number, prev: Cell | null): Cell {
  return { item, order, prev, next: null, prevDelimiter: null, nextDelimiter: null };
}

/** Links the items after `head`, and returns the first delimiter. */
function linkCells(head: Cell, items: readonly Item[]): Cell | null {
  let last = head;
  let firstDelimiter: Cell | null = null;
  let lastDelimiter: Cell | null = null;
  for (const [order, item] of items.entries()) {
    const cell = createCell(item, order, last);
    last.next = cell;
    last = cell;
    if (item.kind !== 'delimiter') continue;
    cell.prevDelimiter = lastDelimiter;
    if (lastDelimiter) lastDelimiter.nextDelimiter = cell;
    else firstDelimiter = cell;
    lastDelimiter = cell;
  }
  return firstDelimiter;
}

function* cellItems(from: Cell | null, to: Cell | null = null): Generator<Item> {
  for (let cell = from; cell && cell !== to; cell = cell.next) yield cell.item;
}

function unlink(cell: Cell): void {
  if (cell.prev) cell.prev.next = cell.next;
  if (cell.next) cell.next.prev = cell.prev;
  unlinkDelimiter(cell);
}

function unlinkDelimiter(cell: Cell): void {
  if (cell.prevDelimiter) cell.prevDelimiter.nextDelimiter = cell.nextDelimiter;
  if (cell.nextDelimiter) cell.nextDelimiter.prevDelimiter = cell.prevDelimiter;
}

/** Wraps the cells between `opener` and `closer` in one emphasis node and spends their runs. */
function pair(opener: Cell, closer: Cell): void {
  const open = opener.item as Delimiter;
  const close = closer.item as Delimiter;
  const use = close.char === '~' ? close.count : Math.min(2, open.count, close.count);
  const type = close.char === '~' ? 'strikethrough' : use === 2 ? 'strong' : 'emphasis';
  const node: MarkdownInline = { type, children: toNodes(cellItems(opener.next, closer)) };
  const wrapper = createCell({ kind: 'node', node }, opener.order, opener);
  wrapper.next = closer;
  opener.next = wrapper;
  closer.prev = wrapper;
  opener.nextDelimiter = closer;
  closer.prevDelimiter = opener;
  open.count -= use;
  close.count -= use;
  if (open.count === 0) unlink(opener);
  if (close.count === 0) unlink(closer);
}

/**
 * Pairs delimiter runs into emphasis, strong and strikethrough nodes, innermost first, and returns
 * the items that remain. Each closer searches back only to where an earlier closer of its key
 * stopped finding openers.
 */
export function resolveEmphasis(items: readonly Item[]): Item[] {
  const head = createCell({ kind: 'node', node: { type: 'text', text: '' } }, -1, null);
  const bottoms = new Map<string, number>();
  let closer = linkCells(head, items);
  while (closer) {
    const close = closer.item as Delimiter;
    if (!close.canClose) {
      closer = closer.nextDelimiter;
      continue;
    }
    const key = closerKey(close);
    const bottom = bottoms.get(key) ?? -1;
    let opener = closer.prevDelimiter;
    while (opener && opener.order > bottom && !isOpenerFor(opener.item as Delimiter, close)) {
      opener = opener.prevDelimiter;
    }
    if (opener && opener.order > bottom) {
      pair(opener, closer);
      if (close.count === 0) closer = closer.nextDelimiter;
      continue;
    }
    bottoms.set(key, closer.prevDelimiter?.order ?? -1);
    const next = closer.nextDelimiter;
    if (!close.canOpen) unlinkDelimiter(closer);
    closer = next;
  }
  return [...cellItems(head.next)];
}
