import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { ActionRowActions, createClearKey } from './action-row-actions.js';
import { orderActions } from './action-verbs.js';
const hooks = createHooks('action-row', ['selection', 'clear', 'count', 'lead']);
/** The selected count and the button that clears the selection. */
function SelectionStatus({ count, onClear, }) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('selection'), children: [onClear ? (_jsx(Button, { ...hooks.slot('clear'), icon: "close", label: strings.clearSelection, tooltip: strings.clearSelection, size: "sm", onPress: onClear })) : null, _jsx("span", { ...hooks.slot('count'), role: "status", children: strings.selectedCount(count) })] }));
}
/**
 * A row of icon-button actions described as data: standard verbs with fixed glyphs, labels and
 * places, and custom actions, each with a tooltip. It can be one toolbar, collapse actions into a
 * menu and serve as a collection's selection bar. Renders nothing without actions or lead content.
 */
export function ActionRow({ actions, lead, size = 'md', toolbar = false, overflow = 'visible', selectedCount, onClearSelection, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, className, ...rest }) {
    const isSelection = selectedCount !== undefined;
    if (isSelection && selectedCount <= 0)
        return null;
    if (actions.length === 0 && isEmptyNode(lead) && !isSelection)
        return null;
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { size, overflow, selection: isSelection } }), onKeyDown: isSelection ? createClearKey(onClearSelection) : undefined, children: [isSelection ? _jsx(SelectionStatus, { count: selectedCount, onClear: onClearSelection }) : null, isEmptyNode(lead) ? null : _jsx("div", { ...hooks.slot('lead'), children: lead }), actions.length > 0 ? (_jsx(ActionRowActions, { actions: orderActions(actions), size: size, isToolbar: toolbar, isCollapsing: overflow === 'menu', "aria-label": toolbar ? ariaLabel : undefined, "aria-labelledby": toolbar ? ariaLabelledBy : undefined })) : null] }));
}
export { actionVerbs, orderActions } from './action-verbs.js';
//# sourceMappingURL=action-row.js.map