import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { assignOccurrenceKeys } from '../../utils/stable-keys.js';
import { Button } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { filterBarHooks as hooks } from './filter-bar-hooks.js';
import { FilterChip } from './filter-chip.js';
import { createFilterCondition } from './filter-model.js';
const emptyValue = [];
/** The add menu lists its fields behind a search field from this many on. */
const FILTERABLE_FIELD_COUNT = 8;
/**
 * A row of active filters as chips, each reading `Field operator value` and opening its editor in a
 * popover: the operators and the value control follow the field's type. An add menu lists the
 * fields; choosing one adds a filter and opens its editor. Each chip has a remove button, and a
 * clear button removes every filter. A free-text search can lead the row.
 */
export function FilterBar({ fields, value: controlledValue, defaultValue = emptyValue, onChange, search, className, 'aria-label': ariaLabel, ...rest }) {
    const strings = useUiStrings();
    const [value, setValue] = useControllableState(controlledValue, defaultValue, (next) => onChange?.([...next]));
    const [openKey, setOpenKey] = useState(null);
    const addRef = useRef(null);
    const keyed = assignOccurrenceKeys(value, (condition) => condition.field);
    const add = (id) => {
        const field = fields.find((candidate) => candidate.id === id);
        if (!field)
            return;
        const occurrence = value.filter((condition) => condition.field === field.id).length;
        setValue([...value, createFilterCondition(field)]);
        setOpenKey(`${field.id}:${occurrence}`);
    };
    const remove = (index) => {
        setValue(value.filter((_, at) => at !== index));
        addRef.current?.focus();
    };
    const clear = () => {
        setValue([]);
        addRef.current?.focus();
    };
    const chips = keyed.flatMap(({ key, value: condition }, index) => {
        const field = fields.find((candidate) => candidate.id === condition.field);
        return field ? [{ key, condition, field, index }] : [];
    });
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { empty: value.length === 0 } }), role: "group", "aria-label": ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.filters), children: [search ? _jsx("div", { ...hooks.slot('search'), children: search }) : null, chips.length > 0 ? (_jsx("ul", { ...hooks.slot('list'), children: chips.map(({ key, condition, field, index }) => (_jsx(FilterChip, { field: field, condition: condition, isOpen: openKey === key, onOpenChange: (isOpen) => setOpenKey(isOpen ? key : null), onChange: (next) => setValue(value.map((entry, at) => (at === index ? next : entry))), onRemove: () => remove(index) }, key))) })) : null, _jsx(DropdownMenu, { ref: addRef, label: strings.addFilter, icon: "plus", variant: "ghost", size: "sm", className: hooks.slotClass('add'), filterable: fields.length >= FILTERABLE_FIELD_COUNT, items: fields.map((field) => ({ id: field.id, label: field.label })), onAction: add }), value.length > 0 ? (_jsx(Button, { variant: "ghost", size: "sm", className: hooks.slotClass('clear'), onPress: clear, children: strings.clearAllFilters })) : null] }));
}
export { FilterConditionFields } from './filter-editor.js';
export { createFilterMatcher, matchesFilterCondition } from './filter-matching.js';
export { createFilterCondition, isFilterConditionComplete } from './filter-model.js';
//# sourceMappingURL=filter-bar.js.map