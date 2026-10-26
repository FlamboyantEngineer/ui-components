import { useRef, useState } from 'react';
import { useTextCompletions, } from '../completion-list/completion-list.js';
import { textFieldHooks as hooks } from './text-field-parts.js';
import { useInputTransform } from './use-input-transform.js';
/** Enter commits a single line; Escape puts the committed value back and stops there. */
function createEditKeyHandler(state, multiline) {
    return (event) => {
        if (event.nativeEvent.isComposing)
            return;
        if (event.key === 'Enter' && !multiline)
            state.commit();
        if (event.key === 'Escape' && state.isDirty) {
            event.preventDefault();
            event.stopPropagation();
            state.restore();
        }
    };
}
/** The control's keys: the completion list first, then the field's edit keys, then the caller's. */
function createKeyHandler(options, completion) {
    const editKeys = createEditKeyHandler(options.state, options.multiline);
    return (event) => {
        if (completion?.model.handleKeyDown(event))
            return;
        editKeys(event);
        options.onKeyDown?.(event);
    };
}
/**
 * The text field's control: its edit handlers, the input transform, the completion list's
 * attributes, and the text it shows, which is the display value while the control does not have
 * focus.
 */
export function useTextFieldInput(options) {
    const { state, placeholder, transformInput, displayValue, completions } = options;
    const [isFocused, setIsFocused] = useState(false);
    const controlRef = useRef(null);
    const boxRef = useRef(null);
    const textCompletions = useTextCompletions({
        completions,
        inputRef: controlRef,
        isLocked: state.isReadOnly || state.isDisabled,
        setValue: state.setValue,
    });
    const completion = completions ? textCompletions : null;
    const transform = useInputTransform({
        transform: transformInput,
        value: state.value,
        setValue: state.setValue,
    });
    const showsDisplayValue = displayValue !== undefined && !isFocused;
    return {
        input: {
            ...completion?.inputProps,
            ...hooks.slot('input'),
            placeholder,
            onFocus: () => setIsFocused(true),
            // The field commits once focus leaves it, so Tab reaches its restore button.
            onBlur: () => {
                setIsFocused(false);
                completion?.model.close();
            },
            onKeyDown: createKeyHandler(options, completion),
            onCompositionStart: transform.onCompositionStart,
            onCompositionEnd: transform.onCompositionEnd,
        },
        text: showsDisplayValue ? displayValue : state.value,
        showsDisplayValue,
        transform,
        onChange: (text) => {
            transform.onChange(text);
            completion?.model.track('input');
        },
        controlRef,
        boxRef,
        completion,
    };
}
//# sourceMappingURL=use-text-field-input.js.map