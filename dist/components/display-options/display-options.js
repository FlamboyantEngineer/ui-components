import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { createDisplayOptionsValue, } from './display-options-model.js';
import { DensitySection, displayOptionsHooks as hooks, GroupBySection, PropertiesSection, SortSection, } from './display-options-sections.js';
/**
 * A button that opens a popover of how a collection shows its rows: the property they are grouped
 * by, the property and direction they are sorted by, the properties shown and their order, and the
 * row spacing. The value is plain data the caller applies to a table, a board or a timeline.
 */
export function DisplayOptions({ properties, value: valueProp, defaultValue, onChange: onChangeProp, densities, label, isDisabled = false, className, id, ...rest }) {
    const strings = useUiStrings();
    const [value, onChange] = useControllableState(valueProp, defaultValue ?? createDisplayOptionsValue(properties), onChangeProp);
    const section = { properties, value, onChange };
    return (_jsx("span", { id: id, ...hooks.root({ className, props: rest, data: { disabled: isDisabled } }), children: _jsxs(PopoverTrigger, { children: [_jsx(Button, { className: hooks.slotClass('trigger'), startIcon: "adjustments", isDisabled: isDisabled, children: label ?? strings.display }), _jsxs(Popover, { className: hooks.slotClass('popover'), title: strings.displayOptions, placement: "bottom end", children: [_jsx(GroupBySection, { ...section }), _jsx(SortSection, { ...section }), _jsx(PropertiesSection, { ...section }), densities && densities.length > 0 ? (_jsx(DensitySection, { densities: densities, value: value, onChange: onChange })) : null] })] }) }));
}
//# sourceMappingURL=display-options.js.map