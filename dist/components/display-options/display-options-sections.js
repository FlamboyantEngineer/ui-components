import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The sections of the display options popover: grouping, sorting, shown properties and density.
import { useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { ListView, ListViewItem } from '../list-row/list-row.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { SelectField } from '../select-field/select-field.js';
import { moveProperties, orderProperties, toggleProperty, } from './display-options-model.js';
export const displayOptionsHooks = createHooks('display-options', [
    'trigger',
    'popover',
    'group-by',
    'sort',
    'sort-by',
    'direction',
    'properties',
    'properties-label',
    'property',
    'visibility',
    'density',
    'density-label',
]);
const hooks = displayOptionsHooks;
const directions = ['ascending', 'descending'];
/** The property rows are grouped by, among those that allow grouping. */
export function GroupBySection({ properties, value, onChange }) {
    const strings = useUiStrings();
    const options = properties.filter((property) => property.allowsGrouping);
    if (options.length === 0)
        return null;
    return (_jsx(SelectField, { className: hooks.slotClass('group-by'), label: strings.groupBy, emptyLabel: strings.noGrouping, placeholder: strings.noGrouping, options: options.map(({ id, label }) => ({ id, label })), value: value.groupBy, committedValue: value.groupBy, onChange: (groupBy) => onChange({ ...value, groupBy }) }));
}
/** The property rows are sorted by, among those that allow sorting, and the direction. */
export function SortSection({ properties, value, onChange }) {
    const strings = useUiStrings();
    const options = properties.filter((property) => property.allowsSorting);
    if (options.length === 0)
        return null;
    const { sort } = value;
    return (_jsxs("div", { ...hooks.slot('sort'), children: [_jsx(SelectField, { className: hooks.slotClass('sort-by'), label: strings.sortBy, emptyLabel: strings.noSorting, placeholder: strings.noSorting, options: options.map(({ id, label }) => ({ id, label })), value: sort?.column ?? null, committedValue: sort?.column ?? null, onChange: (column) => onChange({
                    ...value,
                    sort: column === null ? null : { column, direction: sort?.direction ?? 'ascending' },
                }) }), _jsx(SegmentedChoice, { className: hooks.slotClass('direction'), "aria-label": strings.sortDirection, size: "sm", options: directions.map((direction) => ({
                    value: direction,
                    label: strings.sortDirectionName(direction),
                    icon: `sort-${direction}`,
                })), value: sort?.direction ?? null, isDisabled: sort === null, onChange: (direction) => {
                    if (sort && direction)
                        onChange({ ...value, sort: { ...sort, direction: direction } });
                } })] }));
}
/** The properties, each shown or hidden by its checkbox, in an order the reader changes by dragging. */
export function PropertiesSection({ properties, value, onChange }) {
    const strings = useUiStrings();
    const labelId = useId();
    const ordered = orderProperties(properties, value.properties);
    const order = ordered.map((property) => property.id);
    const toggle = (key) => onChange({ ...value, properties: toggleProperty(order, value.properties, key) });
    return (_jsxs("div", { ...hooks.slot('properties'), children: [_jsx("span", { id: labelId, ...hooks.slot('properties-label'), children: strings.shownProperties }), _jsx(ListView, { "aria-labelledby": labelId, onAction: toggle, reorder: {
                    onMove: (move) => onChange({ ...value, properties: moveProperties(order, value.properties, move) }),
                }, children: ordered.map((property) => {
                    const isShown = value.properties.includes(property.id);
                    return (_jsx(ListViewItem, { id: property.id, title: property.label, className: hooks.slotClass('property'), "data-shown": isShown || undefined, trailing: _jsx(Checkbox, { "aria-label": strings.showProperty(property.label), isSelected: isShown, onChange: () => toggle(property.id), className: hooks.slotClass('visibility') }) }, toKeyIdentity(property.id)));
                }) })] }));
}
/** Row spacing, among the densities offered. */
export function DensitySection({ densities, value, onChange, }) {
    const strings = useUiStrings();
    const labelId = useId();
    return (_jsxs("div", { ...hooks.slot('density'), children: [_jsx("span", { id: labelId, ...hooks.slot('density-label'), children: strings.density }), _jsx(SegmentedChoice, { "aria-labelledby": labelId, size: "sm", options: densities.map((density) => ({
                    value: density,
                    label: strings.densityName(density),
                })), value: value.density, onChange: (density) => {
                    if (density)
                        onChange({ ...value, density: density });
                } })] }));
}
//# sourceMappingURL=display-options-sections.js.map