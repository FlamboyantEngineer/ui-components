import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { RedlineBlock, RedlineMarker, nameBlockType, redlineCompareHooks as hooks, } from './redline-compare-parts.js';
import { createRedlineWords } from './redline-text.js';
/** The block a cell draws: a moved block draws only at its own position on each side. */
function readSideBlock(row, side) {
    if (side === 'old')
        return row.move === 'to' ? undefined : row.oldBlock;
    return side === 'new' ? row.newBlock : (row.newBlock ?? row.oldBlock);
}
function RedlineCell({ row, side }) {
    const block = readSideBlock(row, side);
    return (_jsx("div", { ...hooks.slot('cell', { side, empty: !block }), children: block ? _jsx(RedlineBlock, { block: block, words: createRedlineWords(row, side) }) : null }));
}
/** The notes under a row: a changed kind, changed formatting, and a moved block's jump button. */
function RedlineNotes({ row, onJump }) {
    const strings = useUiStrings();
    const { oldBlock, newBlock } = row;
    const notes = [];
    if (row.isTypeChanged && oldBlock && newBlock) {
        const text = strings.redlineTypeChange(nameBlockType(oldBlock, strings), nameBlockType(newBlock, strings));
        notes.push(_jsx("span", { ...hooks.slot('note', { note: 'type' }), children: text }, "type"));
    }
    if (row.isFormatChanged) {
        notes.push(_jsx("span", { ...hooks.slot('note', { note: 'format' }), children: strings.redlineFormatChange }, "format"));
    }
    if (row.move) {
        notes.push(_jsx(Button, { variant: "link", size: "sm", className: hooks.slotClass('jump'), onPress: onJump, children: row.move === 'from' ? strings.redlineGoToNewPosition : strings.redlineGoToOldPosition }, "jump"));
    }
    return notes.length > 0 ? _jsx("div", { ...hooks.slot('notes'), children: notes }) : null;
}
function RedlineActions(props) {
    const strings = useUiStrings();
    const choices = [
        { decision: 'accepted', slot: 'accept', label: strings.redlineAccept },
        { decision: 'rejected', slot: 'reject', label: strings.redlineReject },
    ];
    return (_jsx("div", { ...hooks.slot('actions'), children: choices.map(({ decision, slot, label }) => (_jsx(Button, { variant: "secondary", size: "sm", className: hooks.slotClass(slot), "aria-describedby": props.labelId, isSelected: props.decision === decision, onPress: () => props.onResolve(decision), children: label }, decision))) }));
}
/**
 * One aligned row: its change marker and spoken description, one cell inline or the old and new
 * cells side by side, its notes and, for a change, the accept and reject buttons.
 */
export function RedlineRow({ row, rowId, isSplit, isCurrent, decision, onResolve, onJump, }) {
    const strings = useUiStrings();
    const labelId = `${rowId}-label`;
    const label = strings.redlineRow(row.move ? `moved-${row.move}` : row.change, nameBlockType((row.newBlock ?? row.oldBlock), strings));
    return (_jsxs("li", { id: rowId, tabIndex: -1, ...hooks.slot('row', {
            change: row.change,
            move: row.move,
            current: isCurrent,
            resolution: decision,
        }), children: [_jsx(RedlineMarker, { change: row.change, label: label, labelId: labelId }), isSplit ? (_jsxs(_Fragment, { children: [_jsx(RedlineCell, { row: row, side: "old" }), _jsx(RedlineCell, { row: row, side: "new" })] })) : (_jsx(RedlineCell, { row: row, side: "both" })), _jsx(RedlineNotes, { row: row, onJump: onJump }), onResolve ? (_jsx(RedlineActions, { decision: decision, labelId: labelId, onResolve: onResolve })) : null] }));
}
//# sourceMappingURL=redline-row.js.map