import { toErrorMessage } from '../../utils/to-error-message.js';
// The editing state of an inline edit: opening and closing the editor, the value being edited, the
// save and its outcome, focus, and the keys and focus moves that save or cancel.
import { useEffect, useLayoutEffect, useRef, useState, } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
const focusableSelector = ['input', 'textarea', 'select', 'button', '[tabindex]']
    .map((element) => `${element}:not([disabled]):not([tabindex="-1"])`)
    .join(', ');
/** Whether two plain-data values are the same, so saving would change nothing. */
export function isSameValue(a, b) {
    return Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b);
}
/** Whether Enter on this element belongs to the element: a button, an open list or a text area. */
function isOwnEnter(event) {
    const target = event.target;
    if (target.closest('button, [role="button"]'))
        return true;
    if (target.getAttribute('aria-expanded') === 'true')
        return true;
    return target.tagName === 'TEXTAREA' && !event.ctrlKey && !event.metaKey;
}
/** Whether a key went to the editor's own elements rather than to an overlay it opened. */
function isEditorKey(event) {
    const target = event.target;
    return event.currentTarget.contains(target) && target.getAttribute('aria-expanded') !== 'true';
}
/** Focus follows the editor: into it when it opens, back to the read view when asked. */
function useEditFocus(isEditing) {
    const editorRef = useRef(null);
    const readRef = useRef(null);
    const focusReturn = useRef('none');
    const hasMounted = useRef(false);
    useLayoutEffect(() => {
        const isFirst = !hasMounted.current;
        hasMounted.current = true;
        if (isEditing && !isFirst) {
            const target = editorRef.current?.querySelector(focusableSelector);
            target?.focus();
            if (target instanceof HTMLInputElement)
                target.select();
            if (target instanceof HTMLTextAreaElement)
                target.setSelectionRange(-1, -1);
        }
        else if (!isEditing && focusReturn.current === 'read') {
            readRef.current?.focus();
        }
        focusReturn.current = 'none';
    }, [isEditing]);
    return { editorRef, readRef, focusReturn };
}
/**
 * The value being edited and the failure shown, both cleared whenever the editor opens or closes.
 * An owner opening or closing a controlled editor skips `open` and `close`, so every editing
 * session starts again from the saved value, without the last session's failure.
 */
function useEditSession(isEditing) {
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState(null);
    const [session, setSession] = useState(isEditing);
    if (session !== isEditing) {
        setSession(isEditing);
        setDraft(null);
        setError(null);
    }
    return { draft, setDraft, error, setError };
}
/**
 * The editing state of an inline edit: the editor opens from the read view, holds the value being
 * edited, saves it (waiting on a returned promise and keeping the editor open with the message of a
 * failure) and closes, moving focus in and back out.
 */
export function useInlineEdit(options) {
    const { value, onSave } = options;
    const [isEditing, setEditing] = useControllableState(options.isEditing, options.defaultEditing, options.onEditingChange);
    const { draft, setDraft, error, setError } = useEditSession(isEditing);
    const [isPending, setPending] = useState(false);
    const focus = useEditFocus(isEditing);
    const blurTimer = useRef(undefined);
    useEffect(() => () => window.clearTimeout(blurTimer.current), []);
    const current = draft === null ? value : draft.value;
    const close = (focusReturn) => {
        window.clearTimeout(blurTimer.current);
        focus.focusReturn.current = focusReturn;
        setDraft(null);
        setError(null);
        setEditing(false);
    };
    const open = () => {
        setDraft(null);
        setError(null);
        setEditing(true);
    };
    const cancel = (focusReturn = 'read') => {
        if (!isPending)
            close(focusReturn);
    };
    const commit = async (next = current, focusReturn = 'read') => {
        if (isPending)
            return;
        if (isSameValue(next, value))
            return close(focusReturn);
        setDraft({ value: next });
        setError(null);
        setPending(true);
        try {
            await onSave(next);
            close(focusReturn);
        }
        catch (failure) {
            setError(toErrorMessage(failure, options.failureMessage));
        }
        finally {
            setPending(false);
        }
    };
    const editorHandlers = {
        onKeyDownCapture: (event) => {
            if (!isEditorKey(event) || event.nativeEvent.isComposing)
                return;
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                cancel();
            }
            else if (event.key === 'Enter' && !isOwnEnter(event)) {
                event.preventDefault();
                event.stopPropagation();
                void commit();
            }
        },
        // Focus moving into an overlay the editor opened (a list, a calendar) comes back through React.
        onFocus: () => window.clearTimeout(blurTimer.current),
        onBlur: (event) => {
            if (event.currentTarget.contains(event.relatedTarget))
                return;
            window.clearTimeout(blurTimer.current);
            blurTimer.current = window.setTimeout(() => void commit(current, 'none'), 0);
        },
    };
    return {
        isEditing,
        isPending,
        error,
        current,
        setCurrent: (next) => setDraft({ value: next }),
        open,
        cancel: () => cancel(),
        commit: (next) => void commit(next),
        editorHandlers,
        editorRef: focus.editorRef,
        readRef: focus.readRef,
    };
}
//# sourceMappingURL=use-inline-edit.js.map