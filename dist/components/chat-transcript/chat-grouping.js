import { getLocalTimeZone, parseIsoDateTime, toCalendarDate } from '../../primitives/index.js';
const defaultMaxGap = 5 * 60 * 1000;
/** The instant of a date and time and its calendar day in `timeZone`; `null` when unreadable. */
function readMoment(text, timeZone) {
    const dateTime = parseIsoDateTime(text, timeZone);
    if (!dateTime || !('timeZone' in dateTime))
        return null;
    return { instant: dateTime.toDate().getTime(), day: toCalendarDate(dateTime).toString() };
}
function isGroupable(message) {
    return Boolean(message.authorId) && !message.isSystem && message.delivery !== 'failed';
}
/** Whether `current` continues the group of `previous`, with nothing between them. */
function canJoin(previous, current, maxGap) {
    if (!previous?.moment || !current.moment)
        return false;
    if (!isGroupable(previous.message) || !isGroupable(current.message))
        return false;
    if (previous.message.authorId !== current.message.authorId)
        return false;
    return Math.abs(current.moment.instant - previous.moment.instant) <= maxGap;
}
function positionOf(joinsPrevious, joinsNext) {
    if (joinsPrevious)
        return joinsNext ? 'middle' : 'last';
    return joinsNext ? 'first' : 'single';
}
/** Lays out the messages with date separators and the unread divider, each one breaking groups. */
function placeMessages(messages, options) {
    const timeZone = options.timeZone ?? getLocalTimeZone();
    const maxGap = options.maxGap ?? defaultMaxGap;
    const entries = [];
    let previous = null;
    let day = null;
    for (const message of messages) {
        const moment = readMoment(message.createdAt, timeZone);
        if (moment && moment.day !== day) {
            entries.push({ kind: 'date', date: moment.day });
            day = moment.day;
            previous = null;
        }
        if (message.id === options.firstUnreadId) {
            entries.push({ kind: 'unread' });
            previous = null;
        }
        const placed = {
            message,
            moment,
            joins: canJoin(previous, { message, moment }, maxGap),
        };
        entries.push(placed);
        previous = placed;
    }
    return entries;
}
/**
 * Turns messages, oldest first, into the sequence to render: a date separator before the first
 * message of each day (in `timeZone`, the reader's by default), the unread divider before
 * `firstUnreadId`, and each message with its group position. Consecutive messages by one author
 * group while each follows the last within `maxGap`; a date change, the unread divider, a system
 * notice, a message without an author and a failed send break groups.
 */
export function groupChatMessages(messages, options = {}) {
    const entries = placeMessages(messages, options);
    return entries.map((entry, index) => {
        if (!('message' in entry)) {
            return entry.kind === 'date'
                ? { kind: 'date', key: `date-${entry.date}`, date: entry.date }
                : { kind: 'unread', key: 'unread' };
        }
        const next = entries[index + 1];
        const joinsNext = next !== undefined && 'message' in next && next.joins;
        return {
            kind: 'message',
            key: entry.message.id,
            message: entry.message,
            groupPosition: positionOf(entry.joins, joinsNext),
        };
    });
}
//# sourceMappingURL=chat-grouping.js.map