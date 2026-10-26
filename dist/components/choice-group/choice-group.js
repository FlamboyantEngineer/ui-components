import { jsx as _jsx } from "react/jsx-runtime";
import { createContext } from 'react';
import { createHooks } from '../../core/hooks.js';
import { Field, useFieldControl } from '../field/field.js';
import { ChoiceBox } from './choice-box.js';
export const ChoiceContext = createContext({
    selectionMode: 'single',
    size: 'md',
    isReadOnly: false,
    isDisabled: false,
    isInvalid: false,
    isRequired: false,
});
const hooks = createHooks('choice-group');
/** A field that chooses one value with radios or several with checkboxes. Each pick commits. */
export function ChoiceGroup({ children, selectionMode = 'single', size = 'md', ...props }) {
    const empty = (selectionMode === 'multiple' ? [] : null);
    const { state, field, rest } = useFieldControl(props, { initialValue: empty, emptyValue: empty });
    const settings = {
        selectionMode,
        size,
        isReadOnly: state.isReadOnly,
        isDisabled: state.isDisabled,
        isInvalid: state.validation.status === 'invalid',
        isRequired: state.isRequired,
    };
    return (_jsx(Field, { ...field, ...hooks.root({ className: field.className, data: { selectionMode } }), size: size, state: state, children: (control) => (_jsx(ChoiceContext.Provider, { value: settings, children: _jsx(ChoiceBox, { control: control, state: state, config: rest, children: children }) })) }));
}
export { Choice } from './choice.js';
//# sourceMappingURL=choice-group.js.map