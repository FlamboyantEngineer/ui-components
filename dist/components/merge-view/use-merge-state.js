import { useMemo } from 'react';
import { mergeThreeWay } from '../../utils/three-way-merge.js';
import { useStateFor } from '../../utils/use-state-for.js';
import { createMergeBlocks, createMergeText, } from './merge-blocks.js';
const finalBreak = /(?:\r\n|\r|\n)$/;
function createInitialState(blocks) {
    const conflicts = blocks.filter((block) => block.conflict !== null).length;
    const states = Array.from({ length: conflicts }, () => ({ resolution: 'unresolved' }));
    return { states, current: null };
}
function countUnresolved(states) {
    return states.filter((entry) => entry.resolution === 'unresolved').length;
}
/**
 * A merge view's blocks and conflict states for its texts: resolving a conflict makes it current
 * and reports the result; every conflict starts over unresolved when a text changes.
 */
export function useMergeState({ base, ours, theirs, markers, onChange }) {
    const blocks = useMemo(() => createMergeBlocks(mergeThreeWay(base, ours, theirs)), [base, ours, theirs]);
    const initial = useMemo(() => createInitialState(blocks), [blocks]);
    const [state, setState] = useStateFor(blocks, initial);
    const resolve = (conflict, next) => {
        const states = state.states.map((entry, index) => (index === conflict ? next : entry));
        setState({ states, current: conflict });
        onChange?.({
            text: createMergeText({ blocks, states, markers, hasFinalBreak: finalBreak.test(ours) }),
            resolutions: states.map((entry) => entry.resolution),
            unresolved: countUnresolved(states),
        });
    };
    return {
        blocks,
        states: state.states,
        current: state.current,
        unresolved: countUnresolved(state.states),
        resolve,
        setCurrent: (conflict) => setState({ ...state, current: conflict }),
    };
}
//# sourceMappingURL=use-merge-state.js.map