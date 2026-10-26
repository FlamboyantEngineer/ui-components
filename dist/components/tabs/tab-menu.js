import { jsx as _jsx } from "react/jsx-runtime";
import { joinMenuGroups } from '../menu/menu.js';
// The menu of a tab's actions, opened from the tab like a context menu.
import { useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { ContextMenu, useContextMenuTarget, } from '../context-menu/context-menu.js';
import { stepTabMove } from './tab-reorder.js';
/** The directions a tab moves toward the start and the end of its list, as the reader sees them. */
function findMoveDirections(reorder) {
    if (reorder.orientation === 'vertical')
        return ['up', 'down'];
    return reorder.isRtl ? ['right', 'left'] : ['left', 'right'];
}
/** The menu entries of the actions a list takes: rename and duplicate, moves, then delete. */
function useStandardEntries(options) {
    const strings = useUiStrings();
    const { rename, reorder, onDuplicate, onRemove } = options;
    return (key) => {
        const edits = [];
        if (rename) {
            edits.push({
                id: 'rename',
                label: strings.rename,
                icon: 'edit',
                onAction: () => rename.start(key),
            });
        }
        if (onDuplicate) {
            edits.push({
                id: 'duplicate',
                label: strings.duplicate,
                icon: 'copy',
                onAction: () => onDuplicate(key),
            });
        }
        const moves = [];
        if (reorder) {
            const keys = reorder.listKeys();
            findMoveDirections(reorder).forEach((direction, index) => {
                const move = stepTabMove(keys, key, index === 0 ? -1 : 1);
                moves.push({
                    id: index === 0 ? 'move-backward' : 'move-forward',
                    label: strings.moveItem(direction),
                    icon: `arrow-${direction}`,
                    isDisabled: move === null,
                    onAction: () => move && reorder.onReorder(move),
                });
            });
        }
        const removal = onRemove
            ? [
                {
                    id: 'delete',
                    label: strings.delete,
                    icon: 'delete',
                    tone: 'danger',
                    onAction: () => onRemove(new Set([key])),
                },
            ]
            : [];
        return joinMenuGroups([edits, moves, removal]);
    };
}
/** A list's tab menu while the owner lists its entries (`getMenuItems`). */
export function useTabMenu(options) {
    const listStandard = useStandardEntries(options);
    const { getMenuItems } = options;
    return {
        controller: options.shared.controller,
        isEnabled: getMenuItems !== undefined,
        getEntries: (key) => getMenuItems?.(key, listStandard(key)) ?? [],
    };
}
/** The menu a list's tabs open; it shows the entries of the tab that opened it. */
export function TabMenuOverlay({ menu }) {
    return menu.isEnabled ? _jsx(ContextMenu, { controller: menu.controller }) : null;
}
/**
 * Makes a tab open its list's menu: a secondary click focuses the tab and opens it at the pointer,
 * the Context Menu key or Shift+F10 below the tab, a long touch at the touch point. Returns `null`
 * without a menu.
 */
export function useTabMenuTarget(menu, options) {
    const { tabKey, isDisabled, onContextMenu } = options;
    const targetRef = useRef(null);
    const isOn = menu.isEnabled && tabKey !== undefined && !isDisabled;
    const showEntries = () => {
        if (tabKey !== undefined)
            menu.controller.setItems(menu.getEntries(tabKey));
    };
    const target = useContextMenuTarget({
        controller: menu.controller,
        isDisabled: !isOn,
        targetRef,
        own: {
            onContextMenu: (event) => {
                onContextMenu?.(event);
                if (!isOn)
                    return;
                // The menu returns focus where it was; on the tab, an action such as Rename continues there.
                event.currentTarget.focus({ preventScroll: true });
                showEntries();
            },
            onKeyDown: (event) => {
                if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))
                    showEntries();
            },
            onPointerDown: (event) => {
                if (event.pointerType === 'touch')
                    showEntries();
            },
        },
    });
    return isOn ? target : null;
}
//# sourceMappingURL=tab-menu.js.map