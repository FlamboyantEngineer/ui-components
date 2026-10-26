import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TextArea } from '../../primitives/index.js';
import { toCompletionInputAttributes } from '../completion-list/completion-list.js';
import { CodeHighlight, codeEditorHooks as hooks } from './code-layers.js';
import { alignLayers } from './use-code-editor.js';
/** The text area's keys: the completion list, the snippet fields, the editing keys, then the caller's. */
function useKeyProps(model, props) {
    const { completion, snippet, hover } = model;
    return {
        onKeyDown: (event) => {
            if (completion.handleKeyDown(event) || snippet.handleKeyDown(event))
                return;
            if (event.key === 'Escape' && hover.tip)
                hover.close();
            if (!model.handleKeyDown(event))
                props.onKeyDown?.(event);
        },
        onKeyUp: (event) => {
            completion.handleKeyUp(event);
            props.onKeyUp?.(event);
        },
    };
}
/** The text area's props: the caller's, with the editor's handlers run first. */
function useInputProps(model, { props, onChange, multiline }) {
    const { layers, completion, hover, snippet } = model;
    return {
        spellCheck: false,
        autoComplete: 'off',
        autoCapitalize: 'off',
        autoCorrect: 'off',
        ...props,
        ...useKeyProps(model, props),
        onChange: (event) => {
            const text = event.target.value;
            onChange?.(multiline ? text : text.replace(/\r?\n/g, ' '));
            hover.close();
            completion.track('input');
        },
        onClick: () => completion.track('move'),
        onSelect: (event) => {
            const input = event.currentTarget;
            model.setCaret(input.selectionStart === input.selectionEnd ? input.selectionStart : null);
        },
        onBlur: (event) => {
            completion.close();
            hover.close();
            snippet.end();
            model.setCaret(null);
            props.onBlur?.(event);
        },
        onScroll: () => {
            alignLayers(layers);
            if (completion.isOpen)
                completion.reposition();
        },
        onPointerMove: (event) => hover.onPointerMove(event),
        onPointerLeave: () => hover.onPointerLeave(),
    };
}
/** The highlighted copy and the text area over it. */
export function CodeArea({ model, props, locks, onChange, ...area }) {
    const inputProps = useInputProps(model, { props, onChange, multiline: area.multiline });
    const { listId } = area;
    return (_jsxs("div", { ...hooks.slot('code'), children: [_jsx(CodeHighlight, { segments: model.segments, caretRef: area.caretRef, highlightRef: model.layers.highlight }), _jsx(TextArea, { ...inputProps, ...hooks.slot('input'), readOnly: locks.isReadOnly, disabled: locks.isDisabled, "aria-required": locks.isRequired || undefined, id: area.id, ref: area.inputRef, value: area.value, wrap: area.wrap, rows: area.multiline ? undefined : 1, "aria-multiline": area.multiline ? undefined : false, "aria-invalid": area.isInvalid || undefined, "aria-describedby": area.describedBy, ...(listId === undefined ? {} : toCompletionInputAttributes(model.completion, listId)) })] }));
}
//# sourceMappingURL=code-area.js.map