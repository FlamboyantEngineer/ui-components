// The blocks a merge view draws from the chunks of `mergeThreeWay`: each side's numbered lines per
// chunk, conflicts numbered in order, and the result text from the conflicts' resolutions.
const sides = ['ours', 'base', 'theirs'];
function lineChange(chunk, side) {
    if (chunk.kind === 'conflict')
        return 'conflict';
    if (chunk.kind === 'unchanged')
        return 'unchanged';
    if (side === 'base' || chunk.kind === 'both' || chunk.kind === side)
        return 'changed';
    return 'unchanged';
}
/** The blocks of a merge, each side's lines numbered through the text and conflicts in order. */
export function createMergeBlocks(chunks) {
    const next = { ours: 1, base: 1, theirs: 1 };
    let conflicts = 0;
    return chunks.map((chunk, index) => {
        const lines = Object.fromEntries(sides.map((side) => {
            const change = lineChange(chunk, side);
            const start = next[side];
            next[side] += chunk[side].length;
            return [
                side,
                chunk[side].map((text, offset) => ({ number: start + offset, text, change })),
            ];
        }));
        const conflict = chunk.kind === 'conflict' ? conflicts : null;
        if (conflict !== null)
            conflicts += 1;
        const rows = Math.max(chunk.ours.length, chunk.base.length, chunk.theirs.length);
        return { index, chunk, conflict, lines, rows };
    });
}
/** The lines a clean chunk merges to: the side that changed, or the base when none did. */
export function getCleanLines(chunk) {
    return chunk.kind === 'theirs' ? chunk.theirs : chunk.ours;
}
/** A conflict's result text: the lines its resolution takes, the edited text, or framed sides. */
export function getConflictText(chunk, state, markers) {
    switch (state.resolution) {
        case 'edited':
            return state.text;
        case 'unresolved':
            return [
                `<<<<<<< ${markers.ours}`,
                ...chunk.ours,
                '=======',
                ...chunk.theirs,
                `>>>>>>> ${markers.theirs}`,
            ].join('\n');
        case 'both':
            return [...chunk.ours, ...chunk.theirs].join('\n');
        default:
            return chunk[state.resolution].join('\n');
    }
}
/**
 * The merged text: clean chunks' lines and each conflict's result text in order, ending with a
 * line break when our text does.
 */
export function createMergeText(options) {
    const { blocks, states, markers, hasFinalBreak } = options;
    const parts = blocks.flatMap((block) => {
        if (block.conflict === null)
            return getCleanLines(block.chunk);
        const text = getConflictText(block.chunk, states[block.conflict], markers);
        return text === '' ? [] : [text];
    });
    const text = parts.join('\n');
    return hasFinalBreak && text !== '' ? `${text}\n` : text;
}
//# sourceMappingURL=merge-blocks.js.map