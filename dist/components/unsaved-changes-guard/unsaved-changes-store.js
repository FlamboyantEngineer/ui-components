// The registrations of one unsaved changes guard (specs/UNSAVED-CHANGES-GUARD.md).
const cleanSummary = { isDirty: false, labels: [], canSave: false };
function summarize(entries) {
    if (entries.length === 0)
        return cleanSummary;
    return {
        isDirty: true,
        labels: entries.flatMap((entry) => entry.labels),
        canSave: entries.every((entry) => entry.onSave !== undefined),
    };
}
function isSameSummary(a, b) {
    return (a.isDirty === b.isDirty &&
        a.canSave === b.canSave &&
        a.labels.length === b.labels.length &&
        a.labels.every((label, index) => label === b.labels[index]));
}
/** A store of dirty registrations whose summary a guard subscribes to. */
export function createUnsavedChangesStore() {
    const entries = new Map();
    const listeners = new Set();
    let summary = cleanSummary;
    const dirtyEntries = () => [...entries.values()].filter((entry) => entry.isDirty);
    const refresh = () => {
        const next = summarize(dirtyEntries());
        if (isSameSummary(next, summary))
            return;
        summary = next;
        for (const listener of listeners)
            listener();
    };
    return {
        set(key, entry) {
            entries.set(key, entry);
            refresh();
        },
        delete(key) {
            entries.delete(key);
            refresh();
        },
        getSummary: () => summary,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        async save() {
            for (const entry of dirtyEntries())
                await entry.onSave?.();
        },
        async discard() {
            for (const entry of dirtyEntries())
                await entry.onDiscard?.();
        },
    };
}
//# sourceMappingURL=unsaved-changes-store.js.map