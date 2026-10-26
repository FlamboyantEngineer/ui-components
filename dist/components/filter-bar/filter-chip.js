import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { filterBarHooks as hooks } from './filter-bar-hooks.js';
import { FilterConditionFields } from './filter-editor.js';
import { joinFilterConditionText, useFilterConditionText } from './filter-format.js';
import { isFilterConditionComplete, } from './filter-model.js';
/**
 * One active filter: a button reading the field, operator and value that opens the condition's
 * editor in a popover, and a button that removes the filter.
 */
export function FilterChip({ field, condition, isOpen, onOpenChange, ...actions }) {
    const strings = useUiStrings();
    const text = useFilterConditionText()(condition, field);
    const isIncomplete = !isFilterConditionComplete(condition, field);
    return (_jsxs("li", { ...hooks.slot('chip', { field: field.id, incomplete: isIncomplete, open: isOpen }), children: [_jsxs(PopoverTrigger, { isOpen: isOpen, onOpenChange: onOpenChange, children: [_jsxs(Button, { variant: "secondary", size: "sm", className: hooks.slotClass('chip-button'), children: [_jsx("span", { ...hooks.slot('chip-field'), children: text.field }), ' ', _jsx("span", { ...hooks.slot('chip-operator'), children: text.operator }), text.value ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('chip-value'), children: text.value })] })) : null] }), _jsx(Popover, { title: field.label, placement: "bottom start", className: hooks.slotClass('editor'), children: _jsx(FilterConditionFields, { field: field, condition: condition, onChange: actions.onChange, labelLayout: "label-control", slotClass: hooks.slotClass }) })] }), _jsx(Button, { icon: "close", size: "sm", label: strings.removeFilter(joinFilterConditionText(text)), className: hooks.slotClass('chip-remove'), onPress: actions.onRemove })] }));
}
//# sourceMappingURL=filter-chip.js.map