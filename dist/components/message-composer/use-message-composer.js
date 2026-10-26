import { useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useAutoGrow } from '../../utils/use-auto-grow.js';
import { useTextCompletions } from '../completion-list/completion-list.js';
import { resolveSubmitShortcut, runComposerKey, useCoarsePointer } from './composer-keys.js';
import { createMessageCodec, tokenTriggers, } from './composer-message.js';
import { useComposerState } from './use-composer-state.js';
import { attachPastedFiles } from './use-file-drop.js';
const plainFormat = {
    empty: '',
    toText: (value) => value,
    fromText: (text) => text,
    codec: createMessageCodec((text) => ({ text, tokens: [] }), (message) => message.text),
};
/** The input's name: the caller's label or labelling element, else the provider's `message`. */
export function toComposerLabelling(props, fallback) {
    const labelledBy = props['aria-labelledby'];
    return {
        'aria-label': labelledBy ? props['aria-label'] : (props['aria-label'] ?? fallback),
        'aria-labelledby': labelledBy,
        'aria-describedby': props['aria-describedby'],
        'aria-details': props['aria-details'],
    };
}
/**
 * Inserting text at the text area's caret, and putting the caret after it once focus is back. A
 * mention or command goes in as its text, since the plain composer has no pills.
 */
function useCaretInsertion(inputRef, text) {
    const caret = useRef(null);
    const insertText = (inserted) => {
        const area = inputRef.current;
        const start = area?.selectionStart ?? text.value.length;
        const end = area?.selectionEnd ?? start;
        caret.current = start + inserted.length;
        text.setValue(`${text.value.slice(0, start)}${inserted}${text.value.slice(end)}`);
    };
    return {
        insertText,
        insertPill(pill) {
            insertText(`${tokenTriggers[pill.kind]}${pill.label} `);
        },
        focusInput() {
            const area = inputRef.current;
            area?.focus();
            if (area && caret.current !== null)
                area.setSelectionRange(caret.current, caret.current);
            caret.current = null;
        },
    };
}
/**
 * The plain composer: its text, the growing text area, its completions and its keys. The
 * completion list's keys come first, then the send chord, Escape and the recall arrows, then the
 * caller's keys.
 */
export function useMessageComposer(props) {
    const { completions, isPending = false, isDisabled = false, minRows = 1, maxRows = 8 } = props;
    const strings = useUiStrings();
    const state = useComposerState({
        ...props,
        isBlocked: isDisabled || (isPending && !props.allowsPendingSubmit),
        format: plainFormat,
    });
    const shortcut = resolveSubmitShortcut(props.submitShortcut, useCoarsePointer());
    const rootRef = useRef(null);
    const inputRef = useRef(null);
    useAutoGrow(inputRef, { minRows, maxRows, value: state.value });
    const completion = useTextCompletions({
        completions,
        inputRef,
        isLocked: isDisabled,
        setValue: state.setValue,
    });
    const model = completions ? completion.model : null;
    const caret = useCaretInsertion(inputRef, state);
    const keys = { ...state, shortcut, onCancel: props.onCancel };
    const inputProps = {
        ...(completions ? completion.inputProps : {}),
        ...toComposerLabelling(props, strings.message),
        ref: mergeRefs(inputRef, props.ref),
        value: state.value,
        rows: minRows,
        placeholder: props.placeholder,
        maxLength: props.maxLength,
        disabled: isDisabled,
        onChange: (event) => {
            state.setValue(event.target.value);
            model?.track('input');
        },
        onKeyDown: (event) => {
            if (model?.handleKeyDown(event))
                return;
            if (!runComposerKey(event.nativeEvent, keys))
                return props.onKeyDown?.(event);
            event.preventDefault();
        },
        onKeyUp: (event) => {
            model?.handleKeyUp(event);
            props.onKeyUp?.(event);
        },
        onPaste: (event) => attachPastedFiles(event, isDisabled ? undefined : props.onAttach),
        onFocus: props.onFocus,
        onBlur: (event) => {
            model?.close();
            props.onBlur?.(event);
        },
    };
    return { rootRef, inputProps, completion, frame: { ...state, shortcut, ...caret } };
}
//# sourceMappingURL=use-message-composer.js.map