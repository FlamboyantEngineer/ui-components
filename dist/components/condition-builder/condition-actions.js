import { jsx as _jsx } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { conditionBuilderHooks as hooks, useConditionBuilder } from './condition-context.js';
/**
 * A rule's or a group's menu: move up, move down, duplicate and delete. Alt+Arrow Up and Alt+Arrow
 * Down on the menu button move the node without opening the menu.
 */
export function ConditionActions({ id, index, count }) {
    const strings = useUiStrings();
    const { actions } = useConditionBuilder();
    const isFirst = index === 0;
    const isLast = index === count - 1;
    const run = (key) => {
        if (key === 'up')
            actions.move(id, -1);
        else if (key === 'down')
            actions.move(id, 1);
        else if (key === 'duplicate')
            actions.duplicate(id);
        else
            actions.remove(id);
    };
    const onKeyDown = (event) => {
        const delta = { ArrowUp: -1, ArrowDown: 1 }[event.key];
        // Keys from the open menu reach here through its portal; only the button's own keys move.
        if (!event.altKey || !delta || !event.currentTarget.contains(event.target))
            return;
        // Captured before the menu button, which would open its menu on Alt+Arrow Down.
        event.preventDefault();
        event.stopPropagation();
        if (!(delta === -1 ? isFirst : isLast))
            actions.move(id, delta);
    };
    return (_jsx("span", { ...hooks.slot('actions'), onKeyDownCapture: onKeyDown, children: _jsx(DropdownMenu, { label: strings.conditionActions, iconOnly: true, size: "sm", placement: "bottom end", items: [
                { id: 'up', label: strings.moveItem('up') },
                { id: 'down', label: strings.moveItem('down') },
                { id: 'duplicate', label: strings.duplicate },
                { id: 'delete', label: strings.delete },
            ], disabledKeys: [...(isFirst ? ['up'] : []), ...(isLast ? ['down'] : [])], onAction: run }) }));
}
//# sourceMappingURL=condition-actions.js.map