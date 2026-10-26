import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Checkbox as AriaCheckbox } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
const hooks = createHooks('checkbox', ['box', 'glyph', 'label']);
/**
 * The state after a press of a three-state box: unset (`null`, drawn mixed) becomes ticked, ticked
 * becomes empty and empty becomes unset again.
 */
export function cycleCheckState(value) {
    if (value === null)
        return true;
    return value ? false : null;
}
/** A tick box on a native checkbox input, with an optional visible label. */
export function Checkbox({ children, size = 'md', className, ...rest }) {
    return (_jsx(AriaCheckbox, { ...rest, ...hooks.root({ className, props: rest, data: { size } }), children: ({ isSelected, isIndeterminate }) => (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('box'), "aria-hidden": "true", children: isIndeterminate || isSelected ? (_jsx(Glyph, { name: isIndeterminate ? 'minus' : 'check', className: hooks.slotClass('glyph') })) : null }), children ? _jsx("span", { ...hooks.slot('label'), children: children }) : null] })) }));
}
//# sourceMappingURL=checkbox.js.map