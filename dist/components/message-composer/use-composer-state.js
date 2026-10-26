import { useState } from 'react';
import { usePersistentState } from '../../core/provider.js';
import { useSubmission } from './use-submission.js';
/** The draft: controlled by `value`, or the composer's own, kept under `persistKey`. */
function useDraft(options) {
    const { value, onChange, format } = options;
    const [own, setOwn] = usePersistentState(options.persistKey, () => options.defaultValue ?? format.empty, format.codec);
    const isControlled = value !== undefined;
    const draft = isControlled ? value : own;
    const setDraft = (next) => {
        if (Object.is(next, draft))
            return;
        if (!isControlled)
            setOwn(next);
        onChange?.(next);
    };
    return [draft, setDraft];
}
/** The message being edited: starts from each new `editValue` and leaves the draft alone. */
function useEditedMessage(editValue, empty) {
    const [edit, setEdit] = useState({ source: editValue, value: editValue ?? empty });
    let current = edit;
    if (edit.source !== editValue) {
        current = { source: editValue, value: editValue ?? empty };
        setEdit(current);
    }
    return [current.value, (value) => setEdit({ source: editValue, value })];
}
/** The next history entry to show, or `null` to leave it and show the empty draft again. */
function stepHistory(history, recalled, direction) {
    const index = recalled
        ? recalled.index + (direction === 'older' ? -1 : 1)
        : direction === 'older'
            ? history.length - 1
            : -1;
    const text = history[index];
    if (text !== undefined)
        return { index, text };
    // Past the oldest entry the composer stays put; past the newest it shows the draft again.
    return recalled && direction === 'newer' ? null : undefined;
}
/**
 * A composer's text: the draft (controlled, own or persisted), the message being edited, the
 * recall of earlier messages with the arrows, and sending. The arrows recall only while the
 * composer is empty or shows a recalled message the reader has not changed.
 */
export function useComposerState(options) {
    const { format, editValue, onEditLast, history = [] } = options;
    const [draft, setDraft] = useDraft(options);
    const [edit, setEdit] = useEditedMessage(editValue, format.empty);
    const [recalled, setRecalled] = useState(null);
    const submission = useSubmission({ ...options, draft, setDraft });
    const isEditing = editValue !== undefined;
    const value = isEditing ? edit : draft;
    const text = format.toText(value);
    const canSubmit = !options.isBlocked &&
        !submission.isSubmitting &&
        (Boolean(options.allowsEmptySubmit) || text.trim() !== '');
    const recall = (direction) => {
        const current = recalled && text === recalled.text ? recalled : null;
        if (isEditing || (!current && text !== ''))
            return false;
        if (!current && direction === 'older' && onEditLast) {
            onEditLast();
            return true;
        }
        const next = stepHistory(history, current, direction);
        if (next === undefined)
            return current !== null;
        setRecalled(next);
        setDraft(next ? format.fromText(next.text) : format.empty);
        return true;
    };
    return {
        value,
        draft,
        setValue: isEditing ? setEdit : setDraft,
        isEditing,
        canSubmit,
        isSubmitting: submission.isSubmitting,
        submit: () => {
            if (!canSubmit)
                return;
            setRecalled(null);
            submission.send(value, !isEditing);
        },
        recall,
    };
}
//# sourceMappingURL=use-composer-state.js.map