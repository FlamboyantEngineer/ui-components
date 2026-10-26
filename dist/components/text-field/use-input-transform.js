import { useCallback, useLayoutEffect, useReducer, useRef } from 'react';
/**
 * Runs each typed, pasted or dropped edit through `transform` before it becomes the value, and puts
 * the caret after the same accepted characters: the transform of the text before the caret. An
 * input method composition goes through untouched and is transformed once it ends.
 */
export function useInputTransform({ transform, value, setValue, }) {
    const control = useRef(null);
    const isComposing = useRef(false);
    const caret = useRef(null);
    // A rewritten edit renders again, even when the value stays, so the caret can be put back.
    const [revision, renderAgain] = useReducer((count) => count + 1, 0);
    useLayoutEffect(() => {
        const at = caret.current;
        caret.current = null;
        if (at !== null)
            control.current?.setSelectionRange(at, at);
    }, [revision]);
    const accept = (text) => {
        if (!transform || isComposing.current) {
            setValue(text);
            return;
        }
        const next = transform(text);
        if (next !== text) {
            // Inputs without a caret (such as `email`) report no selection and keep none.
            const end = control.current?.selectionStart;
            if (typeof end === 'number') {
                caret.current = Math.min(next.length, transform(text.slice(0, end)).length);
            }
            renderAgain();
        }
        if (next !== value)
            setValue(next);
    };
    const ref = useCallback((node) => {
        control.current = node;
    }, []);
    return {
        ref,
        onChange: accept,
        onCompositionStart: () => {
            isComposing.current = true;
        },
        onCompositionEnd: (event) => {
            isComposing.current = false;
            if (transform)
                accept(event.currentTarget.value);
        },
    };
}
//# sourceMappingURL=use-input-transform.js.map