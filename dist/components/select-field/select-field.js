import { jsx as _jsx } from "react/jsx-runtime";
import { SelectTreeField } from './select-tree-field.js';
import { createHooks } from '../../core/hooks.js';
import { Field, useFieldControl } from '../field/field.js';
import { SelectControl } from './select-control.js';
import { flattenSelectItems } from './select-options.js';
const hooks = createHooks('select-field');
/**
 * A field that chooses one value or several from a list (React Aria `Select`), with the field
 * base's label, validation, dirty state, restore, undo and menu. A multiple select shows its
 * choices as removable chips; a long list or a searched one filters inside the open list.
 */
function SelectListField(props) {
    const isMultiple = props.selectionMode === 'multiple';
    const empty = (isMultiple ? [] : null);
    const { state, field, rest } = useFieldControl(props, {
        initialValue: empty,
        emptyValue: empty,
    });
    const { mode = 'list', selectionMode = 'single', ...config } = rest;
    return (_jsx(Field, { ...field, ...hooks.root({
            className: field.className,
            props: field,
            data: {
                mode,
                selectionMode,
                icons: flattenSelectItems(config.options).some((option) => option.icon),
            },
        }), state: state, children: (control) => (_jsx(SelectControl, { ...config, control: control, state: state, label: field.label, isMultiple: isMultiple })) }));
}
/** A field choosing one or several values from a list, icon choices or a searchable tree. */
export function SelectField(props) {
    return props.mode === 'tree' ? _jsx(SelectTreeField, { ...props }) : _jsx(SelectListField, { ...props });
}
export { SelectControl } from './select-control.js';
//# sourceMappingURL=select-field.js.map