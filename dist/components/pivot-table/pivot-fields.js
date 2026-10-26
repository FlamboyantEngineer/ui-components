// The field chooser's model: one card per field in each zone of a pivot layout, and the layout
// after a card moves between or within zones, or a value's aggregation changes.
/** The offered field with `id`, or one labelled by the id when none is offered. */
export function findField(fields, id) {
    return fields.find((field) => field.id === id) ?? { id, label: id };
}
function insertAt(items, index, item) {
    return [...items.slice(0, index), item, ...items.slice(index)];
}
/**
 * Gives each card its field id as its own, so a card keeps its key as it moves between zones and
 * focus can follow it; a field that shows more than once keys its later cards by zone and place.
 */
function keyCards(cards) {
    const seen = new Set();
    const reserved = new Set(cards.map((card) => card.field.id));
    return cards.map((card, index) => {
        const isFirst = !seen.has(card.field.id);
        seen.add(card.field.id);
        if (isFirst)
            return { ...card, id: card.field.id };
        const base = `${card.zone}:${card.field.id}:${index}`;
        let id = base;
        let suffix = 0;
        while (reserved.has(id))
            id = `${base}:${++suffix}`;
        reserved.add(id);
        return { ...card, id };
    });
}
/**
 * The chooser's cards: every offered field the layout does not use in the fields zone, then the
 * layout's row fields, column fields and values in order.
 */
export function createFieldCards(fields, layout) {
    const used = new Set([...layout.rows, ...layout.columns, ...layout.values.map((v) => v.field)]);
    const axis = (zone) => layout[zone].map((id) => ({ zone, field: findField(fields, id), value: null }));
    return keyCards([
        ...fields
            .filter((field) => !used.has(field.id))
            .map((field) => ({ zone: 'fields', field, value: null })),
        ...axis('rows'),
        ...axis('columns'),
        ...layout.values.map((value, index) => ({
            zone: 'values',
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
export function applyFieldMove(layout, fields, move) {
    const cards = createFieldCards(fields, layout);
    const card = cards.find((entry) => entry.id === move.key);
    const zone = move.column;
    if (!card)
        return layout;
    const peers = cards.filter((entry) => entry.zone === zone && entry !== card);
    const target = peers.findIndex((entry) => entry.id === move.targetKey);
    const at = target === -1 ? peers.length : target + (move.position === 'after' ? 1 : 0);
    const id = card.field.id;
    const next = {
        rows: card.zone === 'rows' ? layout.rows.filter((entry) => entry !== id) : layout.rows,
        columns: card.zone === 'columns' ? layout.columns.filter((entry) => entry !== id) : layout.columns,
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
export function setValueAggregate(layout, index, aggregate) {
    return {
        ...layout,
        values: layout.values.map((value, at) => (at === index ? { ...value, aggregate } : value)),
    };
}
//# sourceMappingURL=pivot-fields.js.map