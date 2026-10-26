import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button as AriaButton, CalendarMonthPicker, CalendarYearPicker, ListBox, ListBoxItem, Popover, Select, SelectValue, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { useLayerZIndex } from '../portal/portal.js';
const hooks = createHooks('date-time-field', [
    'calendar-select',
    'calendar-select-button',
    'calendar-select-popover',
    'calendar-select-list',
    'calendar-select-option',
]);
/** A month or year choice of the calendar heading: a React Aria select of the picker's items. */
function HeadingSelect({ unit, items, ...select }) {
    const zIndex = useLayerZIndex('dropdown');
    return (_jsxs(Select, { ...select, ...hooks.slot('calendar-select', { unit }), children: [_jsxs(AriaButton, { className: hooks.slotClass('calendar-select-button'), children: [_jsx(SelectValue, {}), _jsx(Glyph, { name: "chevron-down" })] }), _jsx(Popover, { ...hooks.slot('calendar-select-popover', { layer: 'dropdown' }), offset: 2, style: { zIndex }, children: _jsx(ListBox, { className: hooks.slotClass('calendar-select-list'), items: items, children: (item) => (_jsx(ListBoxItem, { id: item.id, textValue: item.formatted, className: hooks.slotClass('calendar-select-option'), children: item.formatted })) }) })] }));
}
/**
 * The calendar heading as a month select and a year select (React Aria `CalendarMonthPicker` and
 * `CalendarYearPicker`), which move the calendar straight to the chosen month or year.
 */
export function CalendarHeadingSelects() {
    return (_jsxs(_Fragment, { children: [_jsx(CalendarMonthPicker, { children: (picker) => _jsx(HeadingSelect, { unit: "month", ...picker }) }), _jsx(CalendarYearPicker, { children: (picker) => _jsx(HeadingSelect, { unit: "year", ...picker }) })] }));
}
//# sourceMappingURL=date-time-calendar-heading.js.map