/**
 * The standard verbs, in the order an action row draws them after its custom actions. Each verb has a
 * fixed glyph and a provider string for its label.
 */
export const actionVerbs = {
    add: { glyph: 'plus', label: 'add' },
    refresh: { glyph: 'refresh', label: 'refresh' },
    more: { glyph: 'more', label: 'more' },
    edit: { glyph: 'edit', label: 'edit' },
    delete: { glyph: 'delete', label: 'delete' },
    save: { glyph: 'save', label: 'save', pendingLabel: 'saving' },
    cancel: { glyph: 'close', label: 'cancel' },
    close: { glyph: 'close', label: 'close' },
};
const verbOrder = ['custom', ...Object.keys(actionVerbs)];
/** A custom action's own icon and label, or a verb's glyph and provider strings. */
export function toActionContent(action, strings) {
    if (action.verb === 'custom')
        return { icon: action.icon, label: action.label };
    const verb = actionVerbs[action.verb];
    return {
        icon: verb.glyph,
        label: action.label ?? strings[verb.label],
        pendingLabel: verb.pendingLabel ? strings[verb.pendingLabel] : undefined,
    };
}
/** Custom actions in their given order, then the standard verbs in their fixed order. */
export function orderActions(actions) {
    return actions
        .map((action) => ({ action, rank: verbOrder.indexOf(action.verb) }))
        .sort((left, right) => left.rank - right.rank)
        .map(({ action }) => action);
}
//# sourceMappingURL=action-verbs.js.map