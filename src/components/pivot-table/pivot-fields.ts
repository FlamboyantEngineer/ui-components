// The field chooser's model: one card per field in each zone of a pivot layout, and the layout
// after a card moves between or within zones, or a value's aggregation changes.

import type { PivotAggregateName, PivotLayout, PivotValue } from '../../utils/pivot.js';

/** A zone of the field chooser: unused fields, row fields, column fields or values. */
export type PivotZone = 'fields' | 'rows' | 'columns' | 'values';

/** A field the pivot offers, by its id in the records. */
export interface PivotFieldInfo {
  id: string;
  label: string;
  /** The aggregation the field takes when it moves into the values. Defaults to `count`. */
  aggregate?: PivotAggregateName | undefined;
}

/** One card of the field chooser. */
export interface PivotFieldCard {
  /** Unique among the cards: the field id, or for a field's later cards its zone and place. */
  id: string;
  zone: PivotZone;
  field: PivotFieldInfo;
  /** The value a card in the values zone stands for, with its index in the layout's values. */
  value: { index: number; value: PivotValue } | null;
}

/** A card move: the card `key` lands in the zone `column`, beside `targetKey`. */
export interface PivotFieldMove {
  key: string | number;
  column: string | number;
  targetKey: string | number | null;
  position: 'before' | 'after';
}

/** The offered field with `id`, or one labelled by the id when none is offered. */
export function findField<F extends PivotFieldInfo>(
  fields: readonly F[],
  id: string,
): F | PivotFieldInfo {
  return fields.find((field) => field.id === id) ?? { id, label: id };
}

function insertAt<T>(items: readonly T[], index: number, item: T): T[] {
  return [...items.slice(0, index), item, ...items.slice(index)];
}

/**
 * Gives each card its field id as its own, so a card keeps its key as it moves between zones and
 * focus can follow it; a field that shows more than once keys its later cards by zone and place.
 */
function keyCards(cards: ReadonlyArray<Omit<PivotFieldCard, 'id'>>): PivotFieldCard[] {
  const seen = new Set<string>();
  return cards.map((card, index) => {
    const isFirst = !seen.has(card.field.id);
    seen.add(card.field.id);
    return { ...card, id: isFirst ? card.field.id : `${card.zone}:${card.field.id}:${index}` };
  });
}

/**
 * The chooser's cards: every offered field the layout does not use in the fields zone, then the
 * layout's row fields, column fields and values in order.
 */
export function createFieldCards(
  fields: readonly PivotFieldInfo[],
  layout: PivotLayout,
): PivotFieldCard[] {
  const used = new Set([...layout.rows, ...layout.columns, ...layout.values.map((v) => v.field)]);
  const axis = (zone: 'rows' | 'columns') =>
    layout[zone].map((id) => ({ zone, field: findField(fields, id), value: null }));
  return keyCards([
    ...fields
      .filter((field) => !used.has(field.id))
      .map((field) => ({ zone: 'fields' as const, field, value: null })),
    ...axis('rows'),
    ...axis('columns'),
    ...layout.values.map((value, index) => ({
      zone: 'values' as const,
      field: findField(fields, value.field),
      value: { index, value },
    })),
  ]);
}

/**
 * The layout after a card moves: it leaves its zone and lands in the target zone beside the target
 * card. A field landing in the values becomes a value with its default aggregation; a value
 * landing in rows or columns becomes that field unless the zone holds it already; a card landing
 * in the fields zone leaves the layout.
 */
export function applyFieldMove(
  layout: PivotLayout,
  fields: readonly PivotFieldInfo[],
  move: PivotFieldMove,
): PivotLayout {
  const cards = createFieldCards(fields, layout);
  const card = cards.find((entry) => entry.id === move.key);
  const zone = move.column as PivotZone;
  if (!card) return layout;
  const peers = cards.filter((entry) => entry.zone === zone && entry !== card);
  const target = peers.findIndex((entry) => entry.id === move.targetKey);
  const at = target === -1 ? peers.length : target + (move.position === 'after' ? 1 : 0);
  const id = card.field.id;
  const next: PivotLayout = {
    rows: card.zone === 'rows' ? layout.rows.filter((entry) => entry !== id) : layout.rows,
    columns:
      card.zone === 'columns' ? layout.columns.filter((entry) => entry !== id) : layout.columns,
    values: layout.values.filter((_, index) => index !== card.value?.index),
  };
  if (zone === 'values') {
    const value = card.value?.value ?? { field: id, aggregate: card.field.aggregate ?? 'count' };
    return { ...next, values: insertAt(next.values, at, value) };
  }
  if ((zone === 'rows' || zone === 'columns') && !next[zone].includes(id)) {
    return { ...next, [zone]: insertAt(next[zone], at, id) };
  }
  return next;
}

/** The layout with the value at `index` aggregating by `aggregate`. */
export function setValueAggregate(
  layout: PivotLayout,
  index: number,
  aggregate: PivotAggregateName,
): PivotLayout {
  return {
    ...layout,
    values: layout.values.map((value, at) => (at === index ? { ...value, aggregate } : value)),
  };
}
