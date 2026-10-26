import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useContext, useId } from 'react';
import { CheckboxGroupStateContext, RadioButton, RadioField, Text, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { renderElement } from '../../utils/render-element.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { ChoiceContext } from './choice-group.js';
const hooks = createHooks('choice', ['button', 'indicator', 'label', 'description']);
/** One radio or checkbox according to its ChoiceGroup's selection mode. */
export function Choice({ children, description, className, ...rest }) {
    const settings = useContext(ChoiceContext);
    const group = useContext(CheckboxGroupStateContext);
    const descriptionId = useId();
    if (settings.selectionMode === 'single')
        return (_jsxs(RadioField, { ...rest, ...hooks.root({ className, props: rest }), children: [_jsxs(RadioButton, { ...hooks.slot('button'), children: [_jsx("span", { ...hooks.slot('indicator'), "aria-hidden": "true" }), children ? _jsx("span", { ...hooks.slot('label'), children: children }) : null] }), description ? (_jsx(Text, { slot: "description", ...hooks.slot('description'), children: description })) : null] }));
    const { render, ...props } = rest;
    const state = {
        ...settings,
        isSelected: group?.value.includes(rest.value) ?? false,
        isDisabled: settings.isDisabled || Boolean(rest.isDisabled),
    };
    const describedBy = [rest['aria-describedby'], description ? descriptionId : undefined].filter(Boolean).join(' ') ||
        undefined;
    return renderElement('div', {
        ...hooks.root({
            className,
            data: {
                selected: state.isSelected,
                disabled: state.isDisabled,
                readonly: state.isReadOnly,
                invalid: state.isInvalid,
                required: state.isRequired,
            },
        }),
        children: (_jsxs(_Fragment, { children: [_jsx(Checkbox, { ...props, ...hooks.slot('button'), size: settings.size, "aria-describedby": describedBy, children: children ? _jsx("span", { ...hooks.slot('label'), children: children }) : null }), description ? (_jsx("span", { id: descriptionId, ...hooks.slot('description'), children: description })) : null] })),
    }, { render, state });
}
//# sourceMappingURL=choice.js.map