import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { Field, useFieldControl } from '../field/field.js';
import { TreeSelectControl } from './tree-select-control.js';
const hooks = createHooks('select-field');
/**
 * A field that chooses one node or several from a hierarchy: its trigger opens a popover with a
 * search and a `Tree` (filtered with the matches' ancestors, lazily loaded branches, checkboxes that
 * cascade for multiple choice), and shows the chosen node by label or path, or the chosen nodes as
 * removable chips. It has the field base's label, validation, dirty state, restore, undo and menu.
 */
export function SelectTreeField(props) {
    const isMultiple = props.selectionMode === 'multiple';
    const empty = (isMultiple ? [] : null);
    const { state, field, rest } = useFieldControl(props, { initialValue: empty, emptyValue: empty });
    const { mode, selectionMode = 'single', valueDisplay = 'label', ...config } = rest;
    return (_jsx(Field, { ...field, ...hooks.root({
            className: field.className,
            props: field,
            data: { mode, selectionMode, valueDisplay },
        }), state: state, children: (control) => (_jsx(TreeSelectControl, { ...config, control: control, state: state, label: field.label, isMultiple: isMultiple, valueDisplay: valueDisplay })) }));
}
//# sourceMappingURL=select-tree-field.js.map