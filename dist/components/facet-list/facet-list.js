import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { CheckboxGroup as AriaCheckboxGroup, useNumberFormatter } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { SearchField } from '../search-field/search-field.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { listFacetOptions } from './facet-options.js';
const hooks = createHooks('facet-list', [
    'label',
    'search',
    'options',
    'option',
    'option-label',
    'count',
    'empty',
    'toggle',
]);
const emptyValue = [];
/** The ticked values when focus came into the list, so ticking never moves a value under the reader. */
function useFrozenOrder(value) {
    const [frozen, setFrozen] = useState(null);
    return {
        order: frozen ?? value,
        onFocus: () => {
            if (frozen === null)
                setFrozen(value);
        },
        onBlur: (event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
                setFrozen(null);
        },
    };
}
/**
 * The ticked values in option order, then the ticked values no option shows in their previous
 * order: values whose options come and go as counts refresh stay ticked.
 */
function orderTicked(options, ticked) {
    const known = new Set(options.map((option) => option.value));
    return [
        ...options.map((option) => option.value).filter((entry) => ticked.includes(entry)),
        ...ticked.filter((entry) => !known.has(entry)),
    ];
}
/** One value's checkbox, named by its label with its count. */
function FacetOption({ option, format, }) {
    const strings = useUiStrings();
    const formatted = option.count === undefined ? null : format(option.count);
    return (_jsxs(Checkbox, { size: "sm", value: option.value, isDisabled: option.isDisabled, "aria-label": formatted === null ? undefined : strings.labelWithCount(option.label, formatted), className: hooks.slotClass('option'), children: [_jsx("span", { ...hooks.slot('option-label'), children: option.label }), formatted === null ? null : _jsx("span", { ...hooks.slot('count'), children: formatted })] }));
}
/**
 * The values of one facet as checkboxes with record counts, for narrowing a collection: an optional
 * search within the values, a fold past `limit` with a button to show the rest, and optionally the
 * ticked values first.
 */
export function FacetList({ label, options, value: controlledValue, defaultValue = emptyValue, onChange, limit = 5, filterable = options.length > 10, selectedFirst = false, className, id, ...rest }) {
    const strings = useUiStrings();
    const labelId = useId();
    const optionsId = useId();
    const [value, setValue] = useControllableState(controlledValue, defaultValue, (next) => onChange?.([...next]));
    const [query, setQuery] = useState('');
    // A query outlives its field when the options shrink; it must not keep narrowing them unseen.
    const activeQuery = filterable ? query : '';
    const [isExpanded, setExpanded] = useState(false);
    const headingLevel = useHeadingLevel(undefined);
    const frozen = useFrozenOrder(value);
    const { shown, hiddenCount, matchCount } = listFacetOptions({
        options,
        query: activeQuery,
        firstValues: selectedFirst ? frozen.order : null,
        limit,
        isExpanded,
    });
    const count = useNumberFormatter();
    const choose = (ticked) => setValue(orderTicked(options, ticked));
    const canFold = !activeQuery.trim() && options.length > limit;
    return (_jsxs("div", { ...hooks.root({ className, props: rest, data: { expanded: isExpanded && canFold } }), id: id, onFocus: frozen.onFocus, onBlur: frozen.onBlur, children: [_jsx("div", { ...hooks.slot('label'), id: labelId, role: "heading", "aria-level": headingLevel, children: label }), filterable ? (_jsx(SearchField, { size: "sm", label: strings.filterLabel(label), className: hooks.slotClass('search'), value: query, onChange: setQuery })) : null, _jsx(AriaCheckboxGroup, { ...hooks.slot('options'), id: optionsId, "aria-labelledby": labelId, value: [...value], onChange: choose, children: shown.map((option) => (_jsx(FacetOption, { option: option, format: (value) => count.format(value) }, option.value))) }), matchCount === 0 ? _jsx("p", { ...hooks.slot('empty'), children: strings.noResults }) : null, canFold ? (_jsx(Button, { variant: "ghost", size: "sm", className: hooks.slotClass('toggle'), "aria-expanded": isExpanded, "aria-controls": optionsId, onPress: () => setExpanded(!isExpanded), children: isExpanded ? strings.showLess : strings.showMoreValues(hiddenCount) })) : null] }));
}
//# sourceMappingURL=facet-list.js.map