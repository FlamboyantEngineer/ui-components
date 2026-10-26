// Three-way merge of texts (specs/DIFF.md): both sides' line diffs against their common base,
// walked together into clean chunks and conflicts.
import { diffSequences, splitLines } from './diff.js';
/** The changes one side made to the base, in order: each run of deleted and inserted lines. */
function findChanges(base, side) {
    const changes = [];
    let position = 0;
    let open = null;
    for (const hunk of diffSequences(base, side)) {
        if (hunk.kind === 'equal') {
            open = null;
            position += hunk.items.length;
            continue;
        }
        if (!open) {
            open = { start: position, end: position, lines: [] };
            changes.push(open);
        }
        if (hunk.kind === 'delete') {
            position += hunk.items.length;
            open.end = position;
        }
        else {
            open.lines = hunk.items;
        }
    }
    return changes;
}
/**
 * Whether a change joins the span of the chunk being built: their base runs overlap, or they touch
 * and one of them only inserts, so the order of the two would be a guess.
 */
function joins(span, change) {
    if (change.start < span.end && span.start < change.end)
        return true;
    const touches = change.start <= span.end && span.start <= change.end;
    return touches && (change.start === change.end || span.start === span.end);
}
/** A side's lines for the base run `start` to `end`, with that side's changes in it applied. */
function applyChanges(base, span, changes) {
    const lines = [];
    let position = span.start;
    for (const change of changes) {
        for (; position < change.start; position += 1)
            lines.push(base[position]);
        for (const line of change.lines)
            lines.push(line);
        position = change.end;
    }
    for (; position < span.end; position += 1)
        lines.push(base[position]);
    return lines;
}
function isSameLines(a, b) {
    return a.length === b.length && a.every((line, index) => line === b[index]);
}
function toChunk(base, span, changes) {
    const ours = applyChanges(base, span, changes.ours);
    const theirs = applyChanges(base, span, changes.theirs);
    const baseLines = base.slice(span.start, span.end);
    let kind = 'conflict';
    if (changes.theirs.length === 0)
        kind = 'ours';
    else if (changes.ours.length === 0)
        kind = 'theirs';
    else if (isSameLines(ours, theirs))
        kind = 'both';
    return { kind, base: baseLines, ours, theirs };
}
/**
 * Collects the next chunk's changes: the earliest change, then every change of either side that
 * joins the span they cover, until none does.
 */
function takeChunk(queues, positions) {
    const side = (queues.theirs[positions.theirs]?.start ?? Infinity) <
        (queues.ours[positions.ours]?.start ?? Infinity)
        ? 'theirs'
        : 'ours';
    const first = queues[side][positions[side]++];
    const taken = { ours: [], theirs: [] };
    taken[side].push(first);
    const span = { start: first.start, end: first.end };
    const takeJoining = (from) => {
        const next = queues[from][positions[from]];
        if (!next || !joins(span, next))
            return false;
        taken[from].push(next);
        positions[from] += 1;
        span.start = Math.min(span.start, next.start);
        span.end = Math.max(span.end, next.end);
        return true;
    };
    let grew = true;
    while (grew)
        grew = takeJoining('ours') || takeJoining('theirs');
    return { span, taken };
}
/**
 * The three-way merge of two texts that each changed a common `base`: chunks in reading order, each
 * a run the sides left alone, a change one side made, the same change on both sides, or a conflict
 * where they changed the same lines differently. Changes join a conflict when their base runs
 * overlap, or touch while one of them only inserts lines.
 */
export function mergeThreeWay(base, ours, theirs) {
    const baseLines = splitLines(base);
    const queues = {
        ours: findChanges(baseLines, splitLines(ours)),
        theirs: findChanges(baseLines, splitLines(theirs)),
    };
    const chunks = [];
    const positions = { ours: 0, theirs: 0 };
    let position = 0;
    const pushUnchanged = (end) => {
        if (end <= position)
            return;
        const lines = baseLines.slice(position, end);
        chunks.push({ kind: 'unchanged', base: lines, ours: lines, theirs: lines });
    };
    while (positions.ours < queues.ours.length || positions.theirs < queues.theirs.length) {
        const { span, taken } = takeChunk(queues, positions);
        pushUnchanged(span.start);
        chunks.push(toChunk(baseLines, span, taken));
        position = span.end;
    }
    pushUnchanged(baseLines.length);
    return chunks;
}
//# sourceMappingURL=three-way-merge.js.map