// Places table parts and the content around them where an HTML parser puts them (specs/HTML-MARKUP.md,
// UIC-HTML-MARKUP-1.2), so server HTML parses back into the tree React renders.

import {
  closeOpen,
  currentOpen,
  findOpen,
  pushOpen,
  type OpenElements,
} from '../../utils/open-elements.js';
import type { RawElement } from './html-tree.js';

type Stack = OpenElements<RawElement>;

/** Elements whose content model is table structure: no text, and other elements are fostered. */
export const tableContexts: ReadonlySet<string> = new Set([
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'colgroup',
]);

/** Elements that only exist inside a table; outside one a parser ignores their tags. */
export const tableParts: ReadonlySet<string> = new Set([
  'caption',
  'colgroup',
  'col',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
]);

const sections = ['thead', 'tbody', 'tfoot'];

function openImplied(stack: Stack, tag: string): void {
  const element: RawElement = { tag, attributes: {}, children: [] };
  currentOpen(stack).children.push(element);
  pushOpen(stack, element, tag);
}

/** Closes what is open inside the element at `position`, which becomes the current element. */
function clearBackTo(stack: Stack, position: number): void {
  closeOpen(stack, position + 1);
}

/** Opens the row a cell needs: an open one of this table, else a new one in a section. */
function prepareRow(stack: Stack, table: number): void {
  const row = findOpen(stack, ['tr']);
  if (row > table) return clearBackTo(stack, row);
  prepareSection(stack, table);
  openImplied(stack, 'tr');
}

/** Opens the section a row needs: an open one of this table, else a new `tbody`. */
function prepareSection(stack: Stack, table: number): void {
  const section = findOpen(stack, sections);
  if (section > table) return clearBackTo(stack, section);
  clearBackTo(stack, table);
  openImplied(stack, 'tbody');
}

/**
 * Makes the current element the one a table part goes in: closing what is open inside the nearest
 * table back to its context, and opening the `colgroup`, `tbody` or `tr` the part implies. Returns
 * false outside a table, where the part's tag is ignored and its content stays.
 */
export function prepareTablePart(stack: Stack, tag: string): boolean {
  const table = findOpen(stack, ['table']);
  if (table <= 0) return false;
  if (tag === 'td' || tag === 'th') {
    prepareRow(stack, table);
  } else if (tag === 'tr') {
    prepareSection(stack, table);
  } else if (tag === 'col') {
    const group = findOpen(stack, ['colgroup']);
    if (group > table) clearBackTo(stack, group);
    else {
      clearBackTo(stack, table);
      openImplied(stack, 'colgroup');
    }
  } else {
    clearBackTo(stack, table);
  }
  return true;
}

/**
 * Places an element that opens directly in table structure: a `table` closes the open one and
 * follows it; anything else is fostered before the table, as a parser does. A column group the
 * element interrupts closes first. Returns false when the current element is not table structure.
 */
export function fosterElement(stack: Stack, element: RawElement): boolean {
  const current = currentOpen(stack);
  if (!tableContexts.has(current.tag)) return false;
  const table = findOpen(stack, ['table']);
  if (element.tag === 'table') {
    closeOpen(stack, table);
    currentOpen(stack).children.push(element);
    return true;
  }
  if (current.tag === 'colgroup') clearBackTo(stack, findOpen(stack, ['colgroup']) - 1);
  const parent = stack.elements[table - 1] as RawElement;
  const tableElement = stack.elements[table] as RawElement;
  parent.children.splice(parent.children.lastIndexOf(tableElement), 0, element);
  return true;
}
