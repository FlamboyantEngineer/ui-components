import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { TransferPane } from './transfer-pane.js';
import { useTransferList } from './use-transfer-list.js';
const hooks = createHooks('transfer-list', ['actions', 'move', 'reorder']);
/** The two buttons that move one side's selected items, or all it shows, to the other side. */
function MoveButtons({ from, side, toLabel, onTransfer }) {
    const strings = useUiStrings();
    const isForward = from === 'available';
    return (_jsxs(_Fragment, { children: [_jsx(Button, { ...hooks.slot('move', { scope: 'selected', target: isForward ? 'chosen' : 'available' }), icon: isForward ? 'chevron-right' : 'chevron-left', label: strings.moveSelectedTo(toLabel), tooltip: strings.moveSelectedTo(toLabel), size: "sm", variant: "secondary", isDisabled: side.selected.size === 0, onPress: () => onTransfer(from, side.selected) }), _jsx(Button, { ...hooks.slot('move', { scope: 'all', target: isForward ? 'chosen' : 'available' }), icon: isForward ? 'chevron-double-right' : 'chevron-double-left', label: strings.moveAllTo(toLabel), tooltip: strings.moveAllTo(toLabel), size: "sm", variant: "secondary", isDisabled: side.movable.size === 0, onPress: () => onTransfer(from, side.movable) })] }));
}
/**
 * Chooses a subset of items, in order, between two lists: the available items and the chosen ones.
 * Each side filters its rows, counts them and selects several (Shift and Ctrl or Cmd); buttons move
 * the selection or every shown item across, a double click or Enter moves a row, and with
 * `reorderable` the chosen side reorders by drag and drop and with move up and down buttons.
 */
export function TransferList({ items, value, defaultValue, onChange, availableLabel, chosenLabel, disabledKeys, reorderable = false, isDisabled = false, className, id, ...rest }) {
    const strings = useUiStrings();
    const model = useTransferList({ items, value, defaultValue, onChange, disabledKeys, isDisabled });
    const { sides } = model;
    const labels = {
        available: availableLabel ?? strings.availableItems,
        chosen: chosenLabel ?? strings.chosenItems,
    };
    const pane = (side) => ({
        side,
        label: labels[side],
        total: sides[side].all.length,
        items: sides[side].shown,
        selected: sides[side].selected,
        filterText: sides[side].filterText,
        disabledKeys: model.blocked,
        isDisabled,
        onSelectionChange: (keys) => model.select(side, keys),
        onAction: (key) => model.act(side, key),
        onFilterTextChange: (text) => model.filter(side, text),
    });
    const reorderTools = reorderable ? (_jsx("div", { ...hooks.slot('reorder'), children: ['up', 'down'].map((direction) => (_jsx(Button, { icon: direction === 'up' ? 'arrow-up' : 'arrow-down', label: strings.moveItem(direction), tooltip: strings.moveItem(direction), size: "sm", variant: "ghost", isDisabled: isDisabled || !model[direction].canStep, onPress: model[direction].onStep }, direction))) })) : null;
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { reorderable, disabled: isDisabled } }), id: id, role: "group", children: [_jsx(TransferPane, { ...pane('available') }), _jsxs("div", { ...hooks.slot('actions'), children: [_jsx(MoveButtons, { from: "available", side: sides.available, toLabel: labels.chosen, onTransfer: model.transfer }), _jsx(MoveButtons, { from: "chosen", side: sides.chosen, toLabel: labels.available, onTransfer: model.transfer })] }), _jsx(TransferPane, { ...pane('chosen'), onReorder: reorderable && !isDisabled ? model.drop : undefined, tools: reorderTools })] }));
}
//# sourceMappingURL=transfer-list.js.map