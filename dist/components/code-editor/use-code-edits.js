import { useCallback, useLayoutEffect, useRef } from 'react';
/**
 * Edits the focused text area through the browser's own editing, which keeps the edit on its undo
 * stack and reports it as input; `false` when the browser offers none.
 */
function editNatively(input, edit, next) {
    if (input.ownerDocument.activeElement !== input)
        return false;
    if (typeof input.ownerDocument.execCommand !== 'function')
        return false;
    input.setSelectionRange(edit.start, edit.end);
    try {
        input.ownerDocument.execCommand(edit.text ? 'insertText' : 'delete', false, edit.text);
    }
    catch {
        return false;
    }
    return input.value === next;
}
/**
 * Applies the editor's own edits (indentation, pairs, completions, replacements): through the
 * browser's editing when the text area has focus, so undo keeps working, or else through
 * `onChange`, selecting the edit's selection once the new value is rendered.
 */
export function useCodeEdits({ inputRef, value, onChange }) {
    const pending = useRef(null);
    useLayoutEffect(() => {
        const input = inputRef.current;
        const selection = pending.current;
        if (!input || !selection || input.value !== value)
            return;
        pending.current = null;
        input.setSelectionRange(selection.start, selection.end);
    }, [inputRef, value]);
    return useCallback((edit) => {
        const input = inputRef.current;
        if (!input)
            return;
        const current = input.value;
        const next = `${current.slice(0, edit.start)}${edit.text}${current.slice(edit.end)}`;
        if (next !== current && !editNatively(input, edit, next)) {
            pending.current = edit.selection;
            onChange?.(next);
            return;
        }
        input.setSelectionRange(edit.selection.start, edit.selection.end);
    }, [inputRef, onChange]);
}
//# sourceMappingURL=use-code-edits.js.map