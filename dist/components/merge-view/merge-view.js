import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useSyncedScroll } from '../../utils/use-synced-scroll.js';
import { Button } from '../button/button.js';
import { mergeViewHooks as hooks } from './merge-view-hooks.js';
import { getConflictId, MergeResultPane } from './merge-view-result.js';
import { MergeSidePane } from './merge-view-sides.js';
import { useMergeState } from './use-merge-state.js';
const sideOrder = ['ours', 'base', 'theirs'];
/** Each chunk's first row or block, in order, as anchors the other panes align to. */
function readChunkAnchors(container) {
    const origin = container.getBoundingClientRect().top - container.scrollTop;
    const chunks = container.querySelectorAll(`.${hooks.slotClass('chunk')}, .${hooks.slotClass('block')}`);
    return Array.from(chunks, (chunk, index) => ({
        key: index,
        offset: chunk.getBoundingClientRect().top - origin,
    }));
}
/** The panes' scrolling viewports, which scroll together through their chunks. */
function usePanes() {
    const [panes, setPanes] = useState([null, null, null, null]);
    const setters = useMemo(() => [0, 1, 2, 3].map((index) => (element) => setPanes((previous) => {
        if (previous[index] === element)
            return previous;
        const next = [...previous];
        next[index] = element;
        return next;
    })), []);
    useSyncedScroll(panes, { getAnchors: readChunkAnchors });
    return (index) => setters[index];
}
function MergeViewHeader(props) {
    const { unresolved, total, current, onMove } = props;
    const strings = useUiStrings();
    const previous = current === null ? -1 : current - 1;
    const next = current === null ? 0 : current + 1;
    return (_jsxs("div", { ...hooks.slot('header'), children: [_jsx("span", { role: "status", ...hooks.slot('status'), children: strings.mergeViewConflictCount(unresolved, total) }), _jsxs("span", { ...hooks.slot('navigation'), children: [_jsx(Button, { icon: "chevron-up", size: "sm", label: strings.mergeViewPreviousConflict, className: hooks.slotClass('previous'), isDisabled: previous < 0, onPress: () => onMove(previous) }), _jsx(Button, { icon: "chevron-down", size: "sm", label: strings.mergeViewNextConflict, className: hooks.slotClass('next'), isDisabled: next >= total, onPress: () => onMove(next) })] })] }));
}
/**
 * The three-way merge of two texts that changed a common base: our side, the base and their side
 * level with each other, and a result pane where clean changes are merged and each conflict offers
 * take actions and an editable result. A header counts the unresolved conflicts and moves between
 * them; the panes scroll together.
 */
export function MergeView({ base, ours, theirs, oursLabel, baseLabel, theirsLabel, showBase = true, onChange, className, ...rest }) {
    const strings = useUiStrings();
    const baseId = useId();
    const rootRef = useRef(null);
    const paneRef = usePanes();
    const labels = {
        ours: oursLabel ?? strings.mergeViewOurs,
        base: baseLabel ?? strings.mergeViewBase,
        theirs: theirsLabel ?? strings.mergeViewTheirs,
    };
    const merge = useMergeState({ base, ours, theirs, markers: labels, onChange });
    const { blocks, current } = merge;
    const moveTo = (conflict) => {
        merge.setCurrent(conflict);
        rootRef.current?.ownerDocument
            .getElementById(getConflictId(baseId, conflict))
            ?.querySelector('textarea')
            ?.focus();
    };
    const sides = showBase ? sideOrder : sideOrder.filter((side) => side !== 'base');
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { showBase } }), ref: rootRef, role: "group", children: [_jsx(MergeViewHeader, { unresolved: merge.unresolved, total: merge.states.length, current: current, onMove: moveTo }), _jsx("div", { ...hooks.slot('sides'), children: sides.map((side) => (_jsx(MergeSidePane, { side: side, label: labels[side], blocks: blocks, current: current, paneRef: paneRef(sideOrder.indexOf(side)) }, side))) }), _jsx(MergeResultPane, { label: strings.mergeViewResult, blocks: blocks, states: merge.states, labels: labels, current: current, baseId: baseId, paneRef: paneRef(3), onResolve: merge.resolve })] }));
}
//# sourceMappingURL=merge-view.js.map