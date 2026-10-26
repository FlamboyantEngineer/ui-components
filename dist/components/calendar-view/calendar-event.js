import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
function formatTime(placed, time, format) {
    if (time === 'none' || placed.isAllDay)
        return null;
    return time === 'start' ? format.formatTime(placed.start) : format.formatWhen(placed);
}
/**
 * One event: a button showing its title, after its time when asked, and named by its title and when
 * it happens; a press calls `onEventAction` with its key.
 */
export function CalendarEventButton({ placed, context, isTabbable, time, continuesBefore = false, continuesAfter = false, style, }) {
    const strings = useUiStrings();
    const { event } = placed;
    const shown = formatTime(placed, time, context.format);
    const data = {
        allDay: placed.isAllDay,
        tone: event.tone ?? 'neutral',
        continuesBefore,
        continuesAfter,
    };
    return (_jsxs(AriaButton, { ...hooks.slot('event', data), excludeFromTabOrder: !isTabbable, style: style, onPress: () => context.onEventAction?.(event.id), children: [shown ? (_jsx("span", { "aria-hidden": "true", ...hooks.slot('event-time'), children: shown })) : null, _jsx("span", { "aria-hidden": "true", ...hooks.slot('event-title'), children: event.title }), _jsx(VisuallyHidden, { elementType: "span", children: strings.calendarEvent(event.title, context.format.formatWhen(placed)) })] }));
}
/** The `+3 more` button of a crowded day, opening a popover that lists all of the day's events. */
export function CalendarMoreEvents({ events, hidden, dayLabel, isTabbable, context, }) {
    const strings = useUiStrings();
    return (_jsxs(PopoverTrigger, { children: [_jsx(Button, { variant: "ghost", size: "xs", excludeFromTabOrder: !isTabbable, className: hooks.slotClass('more'), children: strings.moreEvents(hidden) }), _jsx(Popover, { title: dayLabel, showCloseButton: true, children: _jsx("div", { ...hooks.slot('more-list'), children: events.map((placed) => (_jsx(CalendarEventButton, { placed: placed, context: context, isTabbable: true, time: "start" }, toKeyIdentity(placed.event.id)))) }) })] }));
}
//# sourceMappingURL=calendar-event.js.map