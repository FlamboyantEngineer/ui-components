import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { TextField } from '../text-field/text-field.js';
import { getCleanLines, getConflictText, } from './merge-blocks.js';
import { mergeViewHooks as hooks } from './merge-view-hooks.js';
import { MergePane } from './merge-view-sides.js';
const takes = ['ours', 'theirs', 'both', 'base'];
/** The id of a conflict's block in the result. */
export function getConflictId(baseId, conflict) {
    return `${baseId}-conflict-${conflict}`;
}
function ConflictBlock(props) {
    const { block, conflict, total, state, labels, id, isCurrent, onResolve } = props;
    const strings = useUiStrings();
    const markers = { ours: labels.ours, theirs: labels.theirs };
    const position = conflict + 1;
    const text = getConflictText(block.chunk, state, markers);
    const takeLabel = (take) => take === 'both' ? strings.mergeViewTakeBoth : strings.mergeViewTake(labels[take]);
    return (_jsxs("div", { id: id, role: "group", "aria-labelledby": `${id}-title`, ...hooks.slot('block', {
            kind: 'conflict',
            resolution: state.resolution,
            current: isCurrent,
        }), children: [_jsxs("div", { ...hooks.slot('conflict-header'), children: [_jsx("span", { id: `${id}-title`, ...hooks.slot('conflict-title'), children: strings.mergeViewConflict(position, total) }), _jsx("span", { ...hooks.slot('resolution'), children: state.resolution === 'unresolved'
                            ? strings.mergeViewUnresolved
                            : strings.mergeViewResolved }), _jsx("span", { ...hooks.slot('actions'), children: takes.map((take) => (_jsx(Button, { size: "sm", variant: "secondary", className: hooks.slotClass('take'), "data-take": take, onPress: () => onResolve({ resolution: take }), children: takeLabel(take) }, take))) })] }), _jsx(TextField, { className: hooks.slotClass('editor'), label: strings.mergeViewConflictResult(position), labelLayout: "control-only", multiline: true, minRows: 1, spellCheck: false, value: text, committedValue: text, onChange: (text) => onResolve({ resolution: 'edited', text }) })] }));
}
/** A clean chunk's merged lines, which an edit of a conflict leaves as they are. */
const CleanBlock = memo(function CleanBlock({ block }) {
    return (_jsx("div", { ...hooks.slot('block', { kind: block.chunk.kind }), children: _jsx("pre", { ...hooks.slot('text'), children: getCleanLines(block.chunk).join('\n') }) }));
});
/**
 * The result pane: each clean chunk's merged lines, and each conflict as a block with its take
 * actions and an editor holding its result.
 */
export function MergeResultPane(props) {
    const { label, blocks, states, labels, current, baseId, paneRef, onResolve } = props;
    return (_jsx(MergePane, { side: "result", label: label, paneRef: paneRef, children: _jsx("div", { ...hooks.slot('blocks'), children: blocks.map((block) => {
                const { conflict } = block;
                if (conflict === null)
                    return _jsx(CleanBlock, { block: block }, block.index);
                return (_jsx(ConflictBlock, { block: block, conflict: conflict, total: states.length, state: states[conflict], labels: labels, id: getConflictId(baseId, conflict), isCurrent: conflict === current, onResolve: (state) => onResolve(conflict, state) }, block.index));
            }) }) }));
}
//# sourceMappingURL=merge-view-result.js.map