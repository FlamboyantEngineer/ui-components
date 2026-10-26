import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useId } from 'react';
import { CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader, CalendarHeaderCell, Dialog, Heading, OverlayTriggerStateContext, Popover, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { useLayerZIndex } from '../portal/portal.js';
import { CalendarHeadingSelects } from './date-time-calendar-heading.js';
import { currentDateValue } from './date-values.js';
const hooks = createHooks('date-time-field', [
    'popover',
    'dialog',
    'calendar-header',
    'calendar-heading',
    'calendar-nav',
    'calendar-months',
    'calendar-grid',
    'calendar-head',
    'calendar-weekday',
    'calendar-body',
    'calendar-cell',
    'presets',
    'preset',
    'actions',
    'action',
]);
function DateCell({ date, state, }) {
    const id = useId();
    return (_jsx(CalendarCell, { date: date, ...hooks.slot('calendar-cell', { tone: state?.tone, taken: state?.isTaken }), render: (props) => (_jsx("div", { ...props, "aria-describedby": [props['aria-describedby'], state?.description ? id : undefined]
                .filter(Boolean)
                .join(' ') || undefined })), children: ({ formattedDate }) => (_jsxs(_Fragment, { children: [formattedDate, state?.description ? (_jsx("span", { id: id, hidden: true, children: state.description })) : null] })) }));
}
/** The heading (text or selects) with month navigation, and one grid per visible month. */
export function CalendarBody({ months, heading, getDateState, }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [_jsxs("header", { ...hooks.slot('calendar-header'), role: "none", children: [_jsx(Button, { slot: "previous", icon: "chevron-left", label: strings.previous, size: "sm", className: hooks.slotClass('calendar-nav') }), heading === 'select' ? (_jsx(CalendarHeadingSelects, {})) : (_jsx(Heading, { className: hooks.slotClass('calendar-heading') })), _jsx(Button, { slot: "next", icon: "chevron-right", label: strings.next, size: "sm", className: hooks.slotClass('calendar-nav') })] }), _jsx("div", { ...hooks.slot('calendar-months'), children: Array.from({ length: months }, (_, offset) => (_jsxs(CalendarGrid, { className: hooks.slotClass('calendar-grid'), offset: offset > 0 ? { months: offset } : undefined, children: [_jsx(CalendarGridHeader, { className: hooks.slotClass('calendar-head'), children: (day) => (_jsx(CalendarHeaderCell, { className: hooks.slotClass('calendar-weekday'), children: day })) }), _jsx(CalendarGridBody, { className: hooks.slotClass('calendar-body'), children: (date) => {
                                const state = getDateState?.(date.toString());
                                return _jsx(DateCell, { date: date, state: state });
                            } })] }, offset))) })] }));
}
/** Picks a value and closes the picker. */
function usePick(onPick) {
    const overlay = useContext(OverlayTriggerStateContext);
    return (value) => {
        onPick(value);
        overlay?.close();
    };
}
/** The caller's presets beside the calendar; one the field would refuse is disabled. */
function DatePresets({ settings, onPick }) {
    const pick = usePick(onPick);
    if (settings.presets.length === 0)
        return null;
    return (_jsx("div", { ...hooks.slot('presets'), children: settings.presets.map((preset) => (_jsx(Button, { variant: "ghost", size: "sm", className: hooks.slotClass('preset'), isDisabled: !settings.isPickable(preset.value), onPress: () => pick(preset.value), children: preset.label }, preset.label))) }));
}
/**
 * The picker's quick actions: Today for a date, Now for a date and time, and Clear unless the field
 * is required. Each picks its value, read when pressed, and closes the picker.
 */
function DateActions({ mode, settings, onPick }) {
    const strings = useUiStrings();
    const pick = usePick(onPick);
    const action = (label, getValue, isDisabled = false) => (_jsx(Button, { variant: "ghost", size: "sm", className: hooks.slotClass('action'), isDisabled: isDisabled, onPress: () => pick(getValue()), children: label }));
    return (_jsxs("div", { ...hooks.slot('actions'), children: [mode === 'date' ? action(strings.today, () => currentDateValue('date', settings)) : null, mode === 'date-time'
                ? action(strings.now, () => currentDateValue('date-time', settings))
                : null, settings.isRequired ? null : action(strings.clear, () => null, !settings.canClear)] }));
}
/**
 * The picker's popover on the `dropdown` layer: a dialog holding the presets, the calendar and the
 * actions.
 */
export function CalendarPopover({ mode, settings, onPick, children }) {
    const zIndex = useLayerZIndex('dropdown');
    return (_jsx(Popover, { ...hooks.slot('popover', { layer: 'dropdown' }), offset: 4, containerPadding: 8, style: { zIndex }, children: _jsxs(Dialog, { className: hooks.slotClass('dialog'), children: [_jsx(DatePresets, { settings: settings, onPick: onPick }), children, _jsx(DateActions, { mode: mode, settings: settings, onPick: onPick })] }) }));
}
//# sourceMappingURL=date-time-calendar.js.map