import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { usePersistentState, useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { TextField } from '../text-field/text-field.js';
const hooks = createHooks('comment-composer', ['field', 'actions', 'cancel', 'submit']);
/** Whether a key press is the submit chord, Ctrl+Enter or Command+Enter. */
function isSubmitChord(event) {
    return event.key === 'Enter' && (event.ctrlKey || event.metaKey);
}
/** The draft, controlled, kept in storage, or held here. */
function useDraft({ value, defaultValue = '', onChange, persistKey, }) {
    const [own, setOwn] = usePersistentState(persistKey, defaultValue);
    const setDraft = (next) => {
        if (value === undefined)
            setOwn(next);
        onChange?.(next);
    };
    return [value ?? own, setDraft];
}
/** Submitting, pending while a returned promise settles, and cancelling. */
function useComposerActions({ draft, setDraft, onSubmit, onCancel, isDisabled, }) {
    const [isPending, setIsPending] = useState(false);
    const text = draft.trim();
    const canSubmit = text !== '' && !isDisabled && !isPending;
    const submit = () => {
        if (!canSubmit)
            return;
        const result = onSubmit(text);
        if (!(result instanceof Promise)) {
            setDraft('');
            return;
        }
        setIsPending(true);
        // A rejected submit keeps the draft; the host reports the failure.
        void result
            .then(() => setDraft(''), () => undefined)
            .finally(() => setIsPending(false));
    };
    const cancel = () => {
        setDraft('');
        onCancel?.();
    };
    return {
        isPending,
        canSubmit,
        canCancel: (text !== '' || onCancel !== undefined) && !isPending && !isDisabled,
        submit,
        cancel,
    };
}
/**
 * A plain-text comment box: a multi-line `TextField` with submit and cancel buttons. Ctrl+Enter or
 * Command+Enter submits and Escape cancels. A host with mentions or rich text passes its own
 * composer where this one is the default.
 */
export function CommentComposer({ value, defaultValue, onChange, onSubmit, onCancel, label, placeholder, submitLabel, persistKey, isDisabled = false, autoFocus, className, ...rest }) {
    const strings = useUiStrings();
    const [draft, setDraft] = useDraft({
        value,
        defaultValue,
        onChange,
        persistKey,
    });
    const actions = useComposerActions({ draft, setDraft, onSubmit, onCancel, isDisabled });
    const onKeyDown = (event) => {
        if (isSubmitChord(event)) {
            event.preventDefault();
            actions.submit();
        }
        else if (event.key === 'Escape' && actions.canCancel) {
            event.preventDefault();
            event.stopPropagation();
            actions.cancel();
        }
    };
    const fieldLabel = label ?? strings.addComment;
    return (_jsxs("div", { ...rest, ...hooks.root({ className, data: { disabled: isDisabled, pending: actions.isPending } }), onKeyDown: onKeyDown, children: [_jsx(TextField, { className: hooks.slotClass('field'), label: fieldLabel, labelLayout: "control-only", placeholder: placeholder ?? fieldLabel, multiline: true, minRows: 2, value: draft, committedValue: draft, onChange: setDraft, isDisabled: isDisabled, autoFocus: autoFocus }), _jsxs("div", { ...hooks.slot('actions'), children: [actions.canCancel ? (_jsx(Button, { size: "sm", variant: "ghost", className: hooks.slotClass('cancel'), onPress: actions.cancel, children: strings.cancel })) : null, _jsx(Button, { size: "sm", variant: "primary", className: hooks.slotClass('submit'), isDisabled: !actions.canSubmit && !actions.isPending, isPending: actions.isPending, shortcut: "Ctrl+Enter", onPress: actions.submit, children: submitLabel ?? strings.comment })] })] }));
}
//# sourceMappingURL=comment-composer.js.map