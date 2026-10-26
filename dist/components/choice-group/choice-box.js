import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useLayoutEffect, useRef, useState } from 'react';
import { CheckboxGroup as AriaCheckboxGroup, CheckboxGroupStateContext, RadioGroup as AriaRadioGroup, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { toAriaControlProps } from '../field/field.js';
import { ChoiceContext } from './choice-group.js';
const hooks = createHooks('choice-group', ['box', 'select-all']);
function useChoiceControl(publish, value) {
    const box = useRef(null);
    const [enabled, setEnabled] = useState([]);
    useLayoutEffect(() => {
        const update = () => {
            const inputs = [
                ...(box.current?.querySelectorAll('input[type=radio],input[type=checkbox]') ?? []),
            ].filter((input) => !input.disabled && !input.closest('.ui-choice-group__select-all'));
            publish((Array.isArray(value) ? inputs[0] : inputs.find((input) => input.checked)) ??
                inputs[0] ??
                null);
            const next = inputs.map((input) => input.value);
            setEnabled((previous) => previous.length === next.length && previous.every((key, index) => key === next[index])
                ? previous
                : next);
        };
        update();
        const observer = new MutationObserver(update);
        if (box.current)
            observer.observe(box.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['disabled', 'value'],
            });
        return () => observer.disconnect();
    }, [publish, value]);
    useLayoutEffect(() => {
        if (Array.isArray(value))
            return;
        const element = box.current;
        const selected = element?.querySelector('input[type="radio"]:checked');
        const active = element?.ownerDocument.activeElement;
        if (selected && active !== selected && element?.contains(active ?? null))
            selected.focus();
    }, [value]);
    return { box, enabled };
}
function SelectAll({ label, enabled, state, }) {
    const settings = useContext(ChoiceContext);
    const value = Array.isArray(state.value) ? state.value : [];
    const selected = new Set(value);
    const count = enabled.filter((key) => selected.has(key)).length;
    const all = enabled.length > 0 && count === enabled.length;
    const pick = () => {
        const next = all
            ? value.filter((key) => !enabled.includes(key))
            : [...value, ...enabled.filter((key) => !selected.has(key))];
        state.setValue(next);
        state.commit();
    };
    return (_jsx(CheckboxGroupStateContext.Provider, { value: null, children: _jsx(Checkbox, { ...hooks.slot('select-all'), size: settings.size, isSelected: all, isIndeterminate: count > 0 && !all, isDisabled: state.isDisabled || enabled.length === 0, isReadOnly: state.isReadOnly, onChange: pick, children: label }) }));
}
export function ChoiceBox({ control, state, config, children }) {
    const { box, enabled } = useChoiceControl(control.ref, state.value);
    const { selectionMode } = useContext(ChoiceContext);
    const { selectAllLabel, orientation = 'vertical', ...rest } = config;
    const aria = toAriaControlProps(control);
    const pick = (value) => {
        state.setValue(value);
        state.commit();
    };
    if (selectionMode === 'single')
        return (_jsx(AriaRadioGroup, { ...rest, ...aria, ...hooks.slot('box'), orientation: orientation, ref: box, value: typeof state.value === 'string' ? state.value : null, onChange: pick, children: children }));
    const { 'aria-errormessage': _message, ...groupAria } = aria;
    return (_jsxs(AriaCheckboxGroup, { ...rest, ...groupAria, ...hooks.slot('box', { orientation }), ref: box, value: Array.isArray(state.value) ? state.value : [], onChange: pick, children: [selectAllLabel ? _jsx(SelectAll, { label: selectAllLabel, enabled: enabled, state: state }) : null, children] }));
}
//# sourceMappingURL=choice-box.js.map