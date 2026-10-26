import { isFieldValueEqual } from './field-value.js';
/** How many values a field remembers for undo. */
const historyLimit = 100;
export function createFieldHistory(value) {
    return { entries: [value], index: 0 };
}
/** Adds `value` after the current entry, dropping redo entries; an unchanged value adds nothing. */
export function recordFieldHistory(history, value) {
    if (isFieldValueEqual(history.entries[history.index], value))
        return history;
    const entries = [...history.entries.slice(0, history.index + 1), value].slice(-historyLimit);
    return { entries, index: entries.length - 1 };
}
/** Moves one entry back (`-1`) or forward (`1`); at either end the history is unchanged. */
export function stepFieldHistory(history, step) {
    const index = history.index + step;
    if (index < 0 || index >= history.entries.length)
        return history;
    return { entries: history.entries, index };
}
export function canStepFieldHistory(history, step) {
    return stepFieldHistory(history, step) !== history;
}
//# sourceMappingURL=field-history.js.map