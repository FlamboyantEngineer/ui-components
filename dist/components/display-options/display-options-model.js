// The value model of display options: the order of the properties list, showing and hiding
// properties, and moving them.
/** The value of a collection showing every property, ungrouped, in its own order. */
export function createDisplayOptionsValue(properties) {
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
export function orderProperties(properties, shown) {
    const byKey = new Map(properties.map((property) => [property.id, property]));
    const visible = shown.flatMap((key) => byKey.get(key) ?? []);
    const hidden = properties.filter((property) => !shown.includes(property.id));
    return [...visible, ...hidden];
}
/**
 * The shown properties after the reader shows or hides `key`: hidden, or shown where its row stands
 * in the list, so the row stays put.
 */
export function toggleProperty(order, shown, key) {
    if (shown.includes(key))
        return shown.filter((entry) => entry !== key);
    return order.filter((entry) => entry === key || shown.includes(entry));
}
/** The shown properties after a move in the list; moving hidden properties changes nothing. */
export function moveProperties(order, shown, move) {
    const moving = order.filter((key) => move.keys.includes(key));
    const rest = order.filter((key) => !move.keys.includes(key));
    const target = rest.indexOf(move.targetKey);
    if (target === -1)
        return [...shown];
    const index = move.position === 'before' ? target : target + 1;
    const reordered = [...rest.slice(0, index), ...moving, ...rest.slice(index)];
    return reordered.filter((key) => shown.includes(key));
}
//# sourceMappingURL=display-options-model.js.map