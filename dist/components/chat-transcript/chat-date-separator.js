import { jsx as _jsx } from "react/jsx-runtime";
import { parseIsoDate, parseIsoDateTime, toCalendarDate } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { RelativeTime } from '../relative-time/relative-time.js';
const hooks = createHooks('chat-date-separator', ['label']);
/** The local calendar day of a date or a date and time, as `YYYY-MM-DD`; `null` when unreadable. */
function toLocalDay(value) {
    if (parseIsoDate(value))
        return value;
    const dateTime = parseIsoDateTime(value);
    return dateTime ? toCalendarDate(dateTime).toString() : null;
}
/**
 * Marks the day the following messages were written: `Today`, `Yesterday`, or the full date in
 * the reader's locale. It has no role, so it may sit between the articles of a feed, and its words
 * move on at midnight like any `RelativeTime`.
 */
export function ChatDateSeparator({ date, getNow, className, ...rest }) {
    const day = toLocalDay(date);
    if (!day)
        return null;
    return (_jsx("div", { ...rest, ...hooks.root({ className, props: rest }), children: _jsx(RelativeTime, { value: day, getNow: getNow, fallbackAfterDays: 2, dateStyle: "full", showTooltip: false, className: hooks.slotClass('label') }) }));
}
//# sourceMappingURL=chat-date-separator.js.map