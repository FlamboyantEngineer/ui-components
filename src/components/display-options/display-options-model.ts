// The value model of display options: the order of the properties list, showing and hiding
// properties, and moving them.

import type { Key, SortDescriptor } from '../../core/props.js';

/** Row spacing, in the words `Card` uses. */
export type DisplayOptionsDensity = 'compact' | 'default' | 'comfortable';

/** One property a collection can show, group by or sort by. */
export interface DisplayOptionsProperty {
  /** Identifies the property. */
  id: Key;
  /** The property's name. */
  label: string;
  /** Rows can be grouped by this property. */
  allowsGrouping?: boolean | undefined;
  /** Rows can be sorted by this property. */
  allowsSorting?: boolean | undefined;
}

/** How a collection shows its rows, as plain data. */
export interface DisplayOptionsValue {
  /** The property rows are grouped by, or `null` for no grouping. */
  groupBy: Key | null;
  /** The property rows are sorted by and the direction, or `null` for the rows' own order. */
  sort: SortDescriptor | null;
  /** The properties shown, in order. */
  properties: readonly Key[];
  /** Row spacing. */
  density: DisplayOptionsDensity;
}

/** A move of properties in the list: before or after another one. */
interface DisplayOptionsMove {
  keys: readonly Key[];
  targetKey: Key;
  position: 'before' | 'after';
}

/** The value of a collection showing every property, ungrouped, in its own order. */
export function createDisplayOptionsValue(
  properties: readonly DisplayOptionsProperty[],
): DisplayOptionsValue {
  return {
    groupBy: null,
    sort: null,
    properties: properties.map((property) => property.id),
    density: 'default',
  };
}

/**
 * The properties in the order the list shows them: the shown ones in their order, then the hidden
 * ones in their declared order. A shown key no property names is left out.
 */
export function orderProperties(
  properties: readonly DisplayOptionsProperty[],
  shown: readonly Key[],
): DisplayOptionsProperty[] {
  const byKey = new Map(properties.map((property) => [property.id, property]));
  const visible = shown.flatMap((key) => byKey.get(key) ?? []);
  const hidden = properties.filter((property) => !shown.includes(property.id));
  return [...visible, ...hidden];
}

/**
 * The shown properties after the reader shows or hides `key`: hidden, or shown where its row stands
 * in the list, so the row stays put.
 */
export function toggleProperty(order: readonly Key[], shown: readonly Key[], key: Key): Key[] {
  if (shown.includes(key)) return shown.filter((entry) => entry !== key);
  return order.filter((entry) => entry === key || shown.includes(entry));
}

/** The shown properties after a move in the list; moving hidden properties changes nothing. */
export function moveProperties(
  order: readonly Key[],
  shown: readonly Key[],
  move: DisplayOptionsMove,
): Key[] {
  const moving = order.filter((key) => move.keys.includes(key));
  const rest = order.filter((key) => !move.keys.includes(key));
  const target = rest.indexOf(move.targetKey);
  if (target === -1) return [...shown];
  const index = move.position === 'before' ? target : target + 1;
  const reordered = [...rest.slice(0, index), ...moving, ...rest.slice(index)];
  return reordered.filter((key) => shown.includes(key));
}
