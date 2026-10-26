import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { CodeEditor } from '../code-editor/code-editor.js';
import { Button } from '../button/button.js';
const hooks = createHooks('query-field', ['label', 'control', 'editor', 'submit']);
/**
 * A one-line input for a query language on `CodeEditor`: the caller's grammar highlights tokens,
 * offers completions and reports problems, which mark the query and list below it. Enter, when no
 * completion is open, or the run button submits a query without errors.
 */
export function QueryField({ label, grammar, value: controlledValue, defaultValue = '', onChange, onSubmit, placeholder, isReadOnly, isDisabled = false, className, id, ...rest }) {
    const strings = useUiStrings();
    const inputId = useId();
    const [value, setValue] = useControllableState(controlledValue, defaultValue, onChange);
    const { diagnose } = grammar;
    const diagnostics = useMemo(() => diagnose?.(value) ?? [], [diagnose, value]);
    const hasError = diagnostics.some(({ severity = 'error' }) => severity === 'error');
    const submit = () => {
        if (!hasError)
            onSubmit?.(value);
    };
    const onKeyDown = (event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing)
            submit();
    };
    return (_jsxs("div", { ...hooks.root({ className, props: rest, data: { invalid: hasError, disabled: isDisabled } }), id: id, children: [_jsx("label", { ...hooks.slot('label'), htmlFor: inputId, children: label }), _jsxs("div", { ...hooks.slot('control'), children: [_jsx(CodeEditor, { variant: "surface", id: inputId, className: hooks.slotClass('editor'), multiline: false, value: value, onChange: setValue, tokenize: grammar.tokenize, completions: grammar.complete, diagnostics: diagnose ? diagnostics : undefined, placeholder: placeholder, isReadOnly: isReadOnly, isDisabled: isDisabled, onKeyDown: onKeyDown }), onSubmit ? (_jsx(Button, { icon: "search", size: "sm", label: strings.runQuery, className: hooks.slotClass('submit'), isDisabled: isDisabled || hasError, onPress: submit })) : null] })] }));
}
//# sourceMappingURL=query-field.js.map