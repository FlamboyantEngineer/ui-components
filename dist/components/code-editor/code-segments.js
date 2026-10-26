// Splits highlighting tokens where the editor's decorations start and end, so the highlighted copy
// can wrap each piece in the marks that cover it.
function collectCuts({ marks, matches, brackets, caret }) {
    const cuts = new Set(caret === null ? [] : [caret]);
    for (const ranges of [marks, matches, brackets]) {
        for (const range of ranges) {
            cuts.add(range.start);
            cuts.add(range.end);
        }
    }
    return [...cuts].sort((a, b) => a - b);
}
function covering(ranges, offset) {
    let low = 0;
    let high = ranges.length - 1;
    while (low <= high) {
        const middle = (low + high) >> 1;
        const range = ranges[middle];
        if (offset < range.start)
            high = middle - 1;
        else if (offset >= range.end)
            low = middle + 1;
        else
            return range;
    }
    return undefined;
}
/** Reads marks in source order, counting overlapping ranges once at each boundary. */
function createSeverityReader(marks) {
    const events = marks
        .flatMap(({ start, end, severity }) => end > start
        ? [
            { at: start, severity, delta: 1 },
            { at: end, severity, delta: -1 },
        ]
        : [])
        .sort((a, b) => a.at - b.at);
    const counts = { error: 0, warning: 0 };
    let next = 0;
    return (offset) => {
        while (next < events.length && (events[next]?.at ?? Infinity) <= offset) {
            const event = events[next++];
            if (event)
                counts[event.severity] += event.delta;
        }
        return counts.error > 0 ? 'error' : counts.warning > 0 ? 'warning' : null;
    };
}
function toSegment(piece, decorations) {
    const { text, type, at } = piece;
    const match = covering(decorations.matches, at);
    const bracket = decorations.brackets.find(({ start, end }) => at >= start && at < end);
    return {
        text,
        type,
        severity: piece.severity,
        match: match ? { isCurrent: match.isCurrent } : null,
        bracket: bracket ? { isUnmatched: bracket.isUnmatched } : null,
    };
}
/**
 * The tokens cut into segments at every decoration boundary, each with the decorations covering
 * it, and the caret marker (`null`) at its offset.
 */
export function splitSegments(tokens, decorations) {
    const cuts = collectCuts(decorations);
    const readSeverity = createSeverityReader(decorations.marks);
    const segments = [];
    let offset = 0;
    let next = 0;
    for (const { text, type = null } of tokens) {
        const end = offset + text.length;
        let from = offset;
        while (from < end) {
            while (next < cuts.length && (cuts[next] ?? 0) <= from)
                next += 1;
            const to = Math.min(end, cuts[next] ?? end);
            if (from === decorations.caret)
                segments.push(null);
            segments.push(toSegment({
                text: text.slice(from - offset, to - offset),
                type,
                at: from,
                severity: readSeverity(from),
            }, decorations));
            from = to;
        }
        offset = end;
    }
    if (decorations.caret !== null && decorations.caret >= offset)
        segments.push(null);
    return segments;
}
//# sourceMappingURL=code-segments.js.map