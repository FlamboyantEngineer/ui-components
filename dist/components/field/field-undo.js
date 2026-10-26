import { useEffect } from 'react';
// Keyed by the field's root element, so an entry leaves with its element and nothing else can reach
// a field's history: there is no channel that every mounted field listens to.
const registry = new WeakMap();
/** Registers the undo of the field whose root is `root`; returns the function that removes it. */
export function registerFieldUndo(root, undo) {
    registry.set(root, undo);
    return () => {
        // A later registration on the same element stays when an earlier one's cleanup runs late.
        if (registry.get(root) === undo)
            registry.delete(root);
    };
}
/**
 * The undo of the field nearest to `element` (the element itself or its closest ancestor that is a
 * field root), or `null` outside any field. A host's shortcut handler passes the focused element.
 */
export function getFieldUndo(element) {
    for (let node = element ?? null; node; node = node.parentElement) {
        const undo = registry.get(node);
        if (undo)
            return undo;
    }
    return null;
}
/** The direction of an undo or redo chord: Ctrl or Cmd with Z, Shift+Z or Y. */
function undoDirection(event) {
    if (event.defaultPrevented || event.altKey || !(event.ctrlKey || event.metaKey))
        return null;
    const key = event.key.toLowerCase();
    if (key === 'z')
        return event.shiftKey ? 'redo' : 'undo';
    return key === 'y' && !event.shiftKey ? 'redo' : null;
}
/**
 * Registers a field's undo on its root element (read through `getRoot` after each commit) and returns
 * the root's key handler, which applies undo and redo chords pressed inside the field.
 */
export function useFieldUndo(getRoot, undo) {
    useEffect(() => {
        const root = getRoot();
        return root ? registerFieldUndo(root, undo) : undefined;
    }, [getRoot, undo]);
    return (event) => {
        const direction = undoDirection(event);
        // Keys from a menu portalled inside the field's React tree are not the field's own.
        if (!direction || !event.currentTarget.contains(event.target))
            return;
        if (direction === 'undo' ? !undo.canUndo : !undo.canRedo)
            return;
        event.preventDefault();
        undo[direction]();
    };
}
//# sourceMappingURL=field-undo.js.map