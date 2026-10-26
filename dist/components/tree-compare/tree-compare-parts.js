import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';
import { Button } from '../button/button.js';
import { Switch } from '../switch/switch.js';
/** The hook classes every module of the tree comparison writes (specs/TREE-COMPARE.md). */
export const treeCompareHooks = createHooks('tree-compare', [
    'toolbar',
    'summary',
    'count',
    'changes-only',
    'previous',
    'next',
    'header',
    'column-label',
    'tree',
    'row',
    'cell',
    'marker',
    'branch',
    'jump',
]);
const hooks = treeCompareHooks;
const changeGlyphs = {
    added: 'plus',
    removed: 'minus',
    changed: 'edit',
    moved: 'move',
};
const countedChanges = ['added', 'removed', 'changed', 'moved'];
/** The number of each kind of difference, or a note that there is none. */
function TreeCompareSummary({ counts }) {
    const strings = useUiStrings();
    const names = {
        added: strings.treeAddedCount,
        removed: strings.treeRemovedCount,
        changed: strings.treeChangedCount,
        moved: strings.treeMovedCount,
    };
    const shown = countedChanges.filter((change) => counts[change] > 0);
    if (shown.length === 0)
        return _jsx("p", { ...hooks.slot('summary'), children: strings.treeNoDifferences });
    return (_jsx("ul", { ...hooks.slot('summary'), children: shown.map((change) => (_jsx("li", { ...hooks.slot('count', { change }), children: names[change](counts[change]) }, change))) }));
}
/** The summary, the switch that keeps only differences and the buttons that move between them. */
export function TreeCompareToolbar(props) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('toolbar'), children: [_jsx(TreeCompareSummary, { counts: props.counts }), _jsx(Switch, { size: "sm", className: hooks.slotClass('changes-only'), isSelected: props.changesOnly, onChange: props.onChangesOnlyChange, children: strings.treeChangesOnly }), _jsx(Button, { className: hooks.slotClass('previous'), icon: "chevron-up", label: strings.treePreviousChange, size: "sm", variant: "ghost", isDisabled: !props.hasChanges, onPress: () => props.onStep(-1) }), _jsx(Button, { className: hooks.slotClass('next'), icon: "chevron-down", label: strings.treeNextChange, size: "sm", variant: "ghost", isDisabled: !props.hasChanges, onPress: () => props.onStep(1) })] }));
}
/** The two column labels above the rows. */
export function TreeCompareHeader(props) {
    return (_jsxs("div", { ...hooks.slot('header'), children: [_jsx("span", { ...hooks.slot('column-label', { side: 'left' }), children: props.leftLabel }), _jsx("span", { ...hooks.slot('column-label', { side: 'right' }), children: props.rightLabel })] }));
}
function TreeCompareCell(props) {
    const { node, side, branch, renderLabel } = props;
    if (!node)
        return _jsx("span", { ...hooks.slot('cell', { side, empty: true }) });
    return (_jsxs("span", { ...hooks.slot('cell', { side }), children: [branch ? _jsx(Icon, { glyph: branch, size: "sm", className: hooks.slotClass('branch') }) : null, renderLabel ? renderLabel(node, side) : node.label] }));
}
/**
 * One aligned row: the left node's cell, the change marker and the right node's cell. The tree's
 * own expand button serves the row; the right cell repeats its glyph, decoratively.
 */
export function TreeCompareRowContent(props) {
    const { row, isExpanded, renderLabel } = props;
    const { change } = row;
    const branch = row.children.length > 0 ? (isExpanded ? 'chevron-down' : 'chevron-right') : null;
    return (_jsxs("span", { ...hooks.slot('row', { change }), children: [_jsx(TreeCompareCell, { node: row.left, side: "left", branch: null, renderLabel: renderLabel }), _jsx("span", { ...hooks.slot('marker', { change }), children: change === 'unchanged' ? null : _jsx(Icon, { glyph: changeGlyphs[change], size: "sm" }) }), _jsx(TreeCompareCell, { node: row.right, side: "right", branch: branch, renderLabel: renderLabel })] }));
}
/** The button on a moved row that goes to the node's other position. */
export function TreeCompareJump(props) {
    const strings = useUiStrings();
    return (_jsx(Button, { className: hooks.slotClass('jump'), icon: props.isOldPosition ? 'arrow-right' : 'arrow-left', label: props.isOldPosition ? strings.treeGoToNewPosition : strings.treeGoToOldPosition, size: "xs", variant: "ghost", onPress: props.onPress }));
}
//# sourceMappingURL=tree-compare-parts.js.map