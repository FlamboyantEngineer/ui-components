// Pure layout for a calendar view: events read in a time zone, event bars packed into lanes across
// a week, and timed events placed within a day. Days are `YYYY-MM-DD` texts (calendar-days.ts).
import { parseIsoDate, parseIsoDateTime } from '../../primitives/index.js';
import { createLinearScale } from '../../utils/linear-scale.js';
import { compareDays, getDayOf, getDayStart, shiftDay } from './calendar-days.js';
const hourLength = 3_600_000;
const dayLength = 24 * hourLength;
function maxDay(first, second) {
    return first >= second ? first : second;
}
function readAllDay(event, timeZone) {
    const startDay = parseIsoDate(event.start)?.toString();
    if (!startDay)
        return null;
    const endDay = maxDay(startDay, parseIsoDate(event.end)?.toString() ?? startDay);
    const start = getDayStart(startDay, timeZone);
    const end = getDayStart(shiftDay(endDay, { days: 1 }), timeZone);
    return { event, isAllDay: true, isSpan: true, startDay, endDay, start, end };
}
function readTimed(event, timeZone) {
    const startTime = parseIsoDateTime(event.start, timeZone);
    if (!startTime || !('timeZone' in startTime))
        return null;
    const start = startTime.toDate().getTime();
    const endTime = parseIsoDateTime(event.end, timeZone);
    const given = endTime && 'timeZone' in endTime ? endTime.toDate().getTime() : start + hourLength;
    const end = Math.max(start, given);
    const startDay = getDayOf(start, timeZone);
    const endDay = maxDay(startDay, getDayOf(Math.max(start, end - 1), timeZone));
    return { event, isAllDay: false, isSpan: end - start >= dayLength, startDay, endDay, start, end };
}
/** The events read in `timeZone`; events whose start is not an ISO 8601 date or date-time are left out. */
export function readEvents(events, timeZone) {
    return events.flatMap((event) => (parseIsoDate(event.start) ? readAllDay(event, timeZone) : readTimed(event, timeZone)) ?? []);
}
/** Bars first, then by start, longer bars first, then by title. */
function compareEvents(first, second) {
    if (first.isSpan !== second.isSpan)
        return first.isSpan ? -1 : 1;
    const byDay = compareDays(first.startDay, second.startDay);
    if (byDay !== 0)
        return byDay;
    const byLength = compareDays(second.endDay, first.endDay);
    if (byLength !== 0)
        return byLength;
    return first.start - second.start || first.event.title.localeCompare(second.event.title);
}
function findFreeLane(lanes, column, span) {
    const isFree = (lane) => lane.slice(column, column + span).every((taken) => !taken);
    const index = lanes.findIndex(isFree);
    if (index >= 0)
        return index;
    lanes.push(Array.from({ length: 7 }, () => false));
    return lanes.length - 1;
}
/**
 * The events of a week as bars packed into lanes: each event takes the first lane free across the
 * days it covers in the week. With `spansOnly`, events within one day that are not all-day are left
 * out (a week view draws them in its time grid).
 */
export function layoutWeek(days, events, { spansOnly }) {
    const [first, last] = [days[0], days.at(-1)];
    if (!first || !last)
        return { segments: [], laneCount: 0 };
    const inWeek = events.filter((placed) => (!spansOnly || placed.isSpan) && placed.startDay <= last && placed.endDay >= first);
    const lanes = [];
    const segments = [...inWeek].sort(compareEvents).map((placed) => {
        const continuesBefore = placed.startDay < first;
        const continuesAfter = placed.endDay > last;
        const column = continuesBefore ? 0 : days.indexOf(placed.startDay);
        const end = continuesAfter ? 6 : days.indexOf(placed.endDay);
        const span = end - column + 1;
        const lane = findFreeLane(lanes, column, span);
        lanes[lane]?.fill(true, column, column + span);
        return { placed, column, span, lane, continuesBefore, continuesAfter };
    });
    return { segments, laneCount: lanes.length };
}
/** The segments that cover a column. */
export function findColumnSegments(segments, column) {
    return segments.filter((segment) => segment.column <= column && column < segment.column + segment.span);
}
/**
 * How many lanes a week shows when each day shows at most `maxEvents` rows: all of them when every
 * day fits, otherwise one fewer than `maxEvents`, leaving a row for the count of the hidden ones.
 */
export function countVisibleLanes(segments, maxEvents) {
    const most = Math.max(1, Math.floor(maxEvents));
    const fits = Array.from({ length: 7 }, (_, column) => findColumnSegments(segments, column)).every((covering) => covering.length <= most);
    return fits ? most : most - 1;
}
/** Packs overlapping blocks side by side: each takes the first column free at its start. */
function packColumns(blocks) {
    const result = [];
    let cluster = [];
    let columnEnds = [];
    let clusterEnd = Number.NEGATIVE_INFINITY;
    const flush = () => {
        const width = 100 / Math.max(1, columnEnds.length);
        for (const { block, column } of cluster)
            result.push({ ...block, left: column * width, width });
        cluster = [];
        columnEnds = [];
    };
    for (const block of blocks) {
        const bottom = block.top + block.height;
        if (block.top >= clusterEnd)
            flush();
        let column = columnEnds.findIndex((end) => end <= block.top);
        if (column < 0)
            column = columnEnds.push(bottom) - 1;
        else
            columnEnds[column] = bottom;
        cluster.push({ block, column });
        clusterEnd = Math.max(clusterEnd, bottom);
    }
    flush();
    return result;
}
/**
 * The timed events of one day (those that are not bars), each clipped to the day and placed by a
 * time scale over the day's real length, with overlapping events side by side.
 */
export function layoutDay(day, events, timeZone) {
    const next = shiftDay(day, { days: 1 });
    const from = getDayStart(day, timeZone);
    const to = getDayStart(next, timeZone);
    const scale = createLinearScale({
        domain: [from, to],
        range: [0, 100],
    });
    const blocks = events
        .filter((placed) => !placed.isSpan && placed.start < to && (placed.end > from || placed.start >= from))
        .sort((first, second) => first.start - second.start || second.end - first.end)
        .map((placed) => {
        const top = scale.map(Math.max(placed.start, from));
        const bottom = scale.map(Math.min(placed.end, to));
        return {
            placed,
            top,
            height: Math.max(0, bottom - top),
            continuesBefore: placed.start < from,
            continuesAfter: placed.end > to,
        };
    });
    return packColumns(blocks);
}
//# sourceMappingURL=calendar-layout.js.map