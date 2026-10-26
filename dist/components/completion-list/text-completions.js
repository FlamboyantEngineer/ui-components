import { useId, useLayoutEffect, useRef } from 'react';
import { getCompletionOptionId } from './completion-option-id.js';
import { useCompletions, } from './use-completions.js';
const TEXT_WORD_BEFORE_CARET = /[\p{L}\p{N}_-]+$/u;
/** The letters, digits, `_` and `-` that end at `caret`, or `''`. */
function findTextQuery(value, caret) {
    return TEXT_WORD_BEFORE_CARET.exec(value.slice(0, caret))?.[0] ?? '';
}
/**
 * A multiline or single-line text box that autocompletes from a list, with the active option as
 * its active descendant while the list is open. It keeps its text box role.
 */
export function toCompletionInputAttributes(model, listId) {
    return {
        'aria-autocomplete': 'list',
        'aria-haspopup': 'listbox',
        'aria-controls': model.isOpen ? listId : undefined,
        'aria-activedescendant': model.isOpen
            ? getCompletionOptionId(listId, model.activeIndex)
            : undefined,
    };
}
/**
 * Inserts text through the browser's own editing, which keeps it on the undo stack and reports it
 * as input; `false` when the control has no focus or the browser offers no such editing.
 */
function insertNatively(input, range, text) {
    const next = `${input.value.slice(0, range.start)}${text}${input.value.slice(range.end)}`;
    const doc = input.ownerDocument;
    if (doc.activeElement !== input || typeof doc.execCommand !== 'function')
        return false;
    input.setSelectionRange(range.start, range.end);
    try {
        doc.execCommand('insertText', false, text);
    }
    catch {
        return false;
    }
    return input.value === next;
}
/**
 * Completion for a text input or text area: the completions engine with plain insertion. A chosen
 * completion's `insertText` (or label) replaces the text it completes as an edit, and the caret
 * goes after it.
 */
export function useTextCompletions(options) {
    const { inputRef, setValue } = options;
    const listId = `${useId()}-completions`;
    const pendingCaret = useRef(null);
    useLayoutEffect(() => {
        const input = inputRef.current;
        const pending = pendingCaret.current;
        if (!input || !pending || input.value !== pending.value)
            return;
        pendingCaret.current = null;
        input.setSelectionRange(pending.caret, pending.caret);
    });
    const model = useCompletions({
        completions: options.completions,
        inputRef,
        isLocked: options.isLocked,
        findQuery: findTextQuery,
        insert: (completion, range) => {
            const input = inputRef.current;
            if (!input)
                return;
            const text = completion.insertText ?? completion.label;
            const end = Math.max(range.end, input.selectionStart ?? range.end);
            if (insertNatively(input, { start: range.start, end }, text))
                return;
            const value = `${input.value.slice(0, range.start)}${text}${input.value.slice(end)}`;
            pendingCaret.current = { value, caret: range.start + text.length };
            setValue(value);
        },
    });
    return {
        model,
        listId,
        inputProps: {
            ...toCompletionInputAttributes(model, listId),
            onClick: () => model.track('move'),
            onKeyUp: (event) => model.handleKeyUp(event),
        },
    };
}
//# sourceMappingURL=text-completions.js.map