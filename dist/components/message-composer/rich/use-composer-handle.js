// The rich composer's public handle: insertion from controls outside the composer
// (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-4.10).
import { useImperativeHandle } from 'react';
import { useLatest } from '../../../utils/use-latest.js';
function findRefusal({ state, isDisabled }, editor) {
    if (isDisabled)
        return 'disabled';
    if (state.isEditing)
        return 'editing';
    if (state.isSubmitting)
        return 'submitting';
    return editor ? null : 'unavailable';
}
/** Gives `handleRef` the composer's handle, which reads the composer's latest render. */
export function useComposerHandle(options) {
    const { handleRef, editorRef } = options;
    const latest = useLatest(options);
    useImperativeHandle(handleRef, () => ({
        insertToken: (token) => {
            const editor = editorRef.current;
            const refusal = findRefusal(latest.current, editor);
            if (refusal || !editor)
                return refusal ?? 'unavailable';
            editor.addPill(token);
            editor.focus();
            return 'inserted';
        },
        getDraft: () => latest.current.state.draft,
    }), [latest, editorRef]);
}
//# sourceMappingURL=use-composer-handle.js.map