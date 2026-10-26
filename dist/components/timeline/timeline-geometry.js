// Pure timeline layout: the range and axis, scale header cells, item spans, item changes from keys
// and drags, and dependency connector paths (specs/TIMELINE.md).
import { addTimeUnits, createTimeScale, floorToTimeUnit, } from '../../utils/time-scale.js';
const dayLength = 86_400_000;
const connectorGap = 8;
const arrowSize = 4;
/** The scale plans of the zoom levels. */
export const timelineScales = {
    day: { dayWidth: 32, major: 'month', minor: 'day' },
    week: { dayWidth: 16, major: 'month', minor: 'week' },
    month: { dayWidth: 4, major: 'year', minor: 'month' },
    quarter: { dayWidth: 1.5, major: 'year', minor: 'quarter' },
};
/** Whether a text is a real `YYYY-MM-DD` date. */
export function isTimelineDate(text) {
    return text !== undefined && floorToTimeUnit(text, 'day') === text;
}
function countDays(from, to) {
    return Math.round((Date.parse(to) - Date.parse(from)) / dayLength);
}
/** An item's kind and days; `null` when its first day is not a date. */
export function readTimelineItem(item) {
    if (!isTimelineDate(item.start))
        return null;
    const kind = item.kind ?? 'bar';
    const end = kind === 'bar' && isTimelineDate(item.end) && item.end > item.start;
    return { id: item.id, kind, start: item.start, end: end ? item.end : item.start };
}
/**
 * The caller's range when it is readable; otherwise the items' first to last day (today when there
 * are none), widened to whole units of the scale plus one unit on each side.
 */
export function resolveTimelineRange(options) {
    const { range, items, scale, today, locale } = options;
    if (range && isTimelineDate(range.start) && isTimelineDate(range.end)) {
        if (range.end >= range.start)
            return range;
    }
    let low;
    let high;
    for (const item of items) {
        const read = readTimelineItem(item);
        if (!read)
            continue;
        if (low === undefined || read.start < low)
            low = read.start;
        if (high === undefined || read.end > high)
            high = read.end;
    }
    const unit = timelineScales[scale].minor;
    const first = floorToTimeUnit(low ?? today, unit, locale);
    const last = floorToTimeUnit(high ?? today, unit, locale);
    return {
        start: addTimeUnits(first, unit, -1),
        end: addTimeUnits(addTimeUnits(last, unit, 2), 'day', -1),
    };
}
export function createTimelineAxis(range, scale, locale) {
    const { dayWidth } = timelineScales[scale];
    const until = addTimeUnits(range.end, 'day', 1);
    const width = countDays(range.start, until) * dayWidth;
    const timeScale = createTimeScale({
        domain: [range.start, until],
        range: [0, width],
        timeZone: 'UTC',
        locale,
    });
    return { scale: timeScale, range, until, dayWidth, width };
}
/** The cells of a header row of `unit`: whole units, with partial ones at the range's ends. */
export function resolveScaleCells(axis, unit) {
    const starts = axis.scale
        .ticks({ unit })
        .map((tick) => tick.value)
        .filter((value) => value < axis.until);
    if (starts[0] !== axis.range.start)
        starts.unshift(axis.range.start);
    return starts.map((start, index) => {
        const left = axis.scale.map(start);
        return { start, left, width: axis.scale.map(starts[index + 1] ?? axis.until) - left };
    });
}
/** A bar's left and right edges, or a milestone's day centre as both, in pixels. */
export function resolveItemSpan(axis, item) {
    const left = axis.scale.map(item.start);
    if (item.kind === 'milestone') {
        const center = left + axis.dayWidth / 2;
        return { left: center, right: center };
    }
    return { left, right: axis.scale.map(addTimeUnits(item.end, 'day', 1)) };
}
/**
 * The change an arrow key asks for: Left and Right move the item by one unit of the scale, keeping
 * a bar's length in days; with Shift they move a bar's last day, never before its first. `null`
 * for any other key, and for Shift with a milestone.
 */
export function resolveKeyboardChange(item, key, scale) {
    const direction = { ArrowLeft: -1, ArrowRight: 1 }[key.key];
    if (direction === undefined)
        return null;
    const unit = timelineScales[scale].minor;
    if (key.shiftKey) {
        if (item.kind === 'milestone')
            return null;
        const end = addTimeUnits(item.end, unit, direction);
        return { id: item.id, start: item.start, end: end < item.start ? item.start : end };
    }
    const start = addTimeUnits(item.start, unit, direction);
    const end = addTimeUnits(item.end, 'day', countDays(item.start, start));
    return { id: item.id, start, end };
}
/** The change a pointer drag of `days` whole days asks for, by what it grabbed. */
export function resolveDragChange(item, edge, days) {
    const shift = (date) => addTimeUnits(date, 'day', days);
    if (edge === 'start') {
        const start = shift(item.start);
        return { id: item.id, start: start > item.end ? item.end : start, end: item.end };
    }
    if (edge === 'end') {
        const end = shift(item.end);
        return { id: item.id, start: item.start, end: end < item.start ? item.start : end };
    }
    return { id: item.id, start: shift(item.start), end: shift(item.end) };
}
/** A dependency is in conflict when the item that follows starts before the one it follows ends. */
export function isDependencyConflict(from, to) {
    return to.start < from.end;
}
/**
 * An orthogonal connector from the end of one item to the start of another, ending in an arrow
 * head. When the target starts too close or before the source ends, the path steps back along the
 * boundary of the target's row.
 */
export function resolveConnectorPath({ x1, y1, x2, y2, rowHeight }) {
    const out = x1 + connectorGap;
    const head = `M${x2 - arrowSize},${y2 - arrowSize}L${x2},${y2}L${x2 - arrowSize},${y2 + arrowSize}`;
    if (x2 - x1 >= 2 * connectorGap) {
        const line = y1 === y2 ? `M${x1},${y1}H${x2}` : `M${x1},${y1}H${out}V${y2}H${x2}`;
        return line + head;
    }
    const boundary = y2 > y1 ? y2 - rowHeight / 2 : y2 + rowHeight / 2;
    return `M${x1},${y1}H${out}V${boundary}H${x2 - connectorGap}V${y2}H${x2}${head}`;
}
//# sourceMappingURL=timeline-geometry.js.map