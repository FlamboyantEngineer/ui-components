import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { useItemDrag } from '../../utils/use-item-drag.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { ExpandToggle } from '../expand-toggle/expand-toggle.js';
import { Button } from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { boardHooks as hooks } from './board-hooks.js';
const steps = { ArrowLeft: -1, ArrowRight: 1 };
const columnShortcuts = 'Alt+ArrowLeft Alt+ArrowRight';
const isEmptyNode = (node) => node === undefined || node === null || node === false;
/** A column header's drag and drop: it drags, and takes drops of another column of the board. */
function useColumnHeaderDrag({ columnKey, title, drag, }) {
    const ref = useRef(null);
    const pressedInActions = useRef(false);
    const { dragProps, startDrag, describedBy, isDragging, dropPosition } = useItemDrag({
        ref,
        key: columnKey,
        textValue: title,
        dragType: drag?.dragType ?? '',
        dragging: drag?.dragging ?? null,
        isDisabled: !drag,
        resolveMove: () => drag?.resolveDrop(columnKey) ?? null,
        onMove: (move) => drag?.onMove(move),
    });
    // The whole header is the native drag source, so a pointer that went down in the caller's actions
    // would drag the column: the drag is refused before React Aria starts it.
    const props = {
        ...dragProps,
        onPointerDownCapture: (event) => {
            const target = event.target instanceof Element ? event.target : null;
            pressedInActions.current = !!target?.closest(`.${hooks.slotClass('column-actions')}`);
        },
        onDragStartCapture: (event) => {
            if (!pressedInActions.current)
                return;
            event.preventDefault();
            event.stopPropagation();
        },
    };
    return { ref, props, startDrag, describedBy, isDragging, dropPosition };
}
/**
 * A board column's header: a drag handle while the board takes column moves (Alt+Arrow keys move
 * the column too), a collapse toggle, the title, the card count against the column's limit and the
 * caller's actions.
 */
export function BoardColumnHeader(props) {
    const { columnKey, title, titleId, count, limit, isOverLimit, isCollapsed } = props;
    const { onCollapsedChange, drag, onStep, actions } = props;
    const strings = useUiStrings();
    const { direction } = useLocale();
    const header = useColumnHeaderDrag({ columnKey, title, drag });
    const onHandleKeyDown = (event) => {
        const step = steps[event.key];
        if (!step || !isMoveChord(event))
            return;
        event.preventDefault();
        onStep(columnKey, direction === 'rtl' ? -step : step);
    };
    const data = {
        keyIdentity: toKeyIdentity(columnKey),
        collapsed: isCollapsed,
        overLimit: isOverLimit,
        dragging: header.isDragging,
        dropTarget: header.dropPosition !== null,
        position: header.dropPosition,
    };
    return (_jsxs("div", { ref: header.ref, ...(drag ? header.props : {}), ...hooks.slot('column', data), "data-key": columnKey, children: [drag ? (_jsx(Button, { icon: "drag-handle", size: "sm", label: strings.moveColumn(title), className: hooks.slotClass('column-handle'), "aria-describedby": header.describedBy, onPress: header.startDrag, onKeyDown: onHandleKeyDown, render: (domProps) => _jsx("button", { ...domProps, "aria-keyshortcuts": columnShortcuts }) })) : null, _jsx(ExpandToggle, { isExpanded: !isCollapsed, onExpandedChange: (isExpanded) => onCollapsedChange(!isExpanded), label: isCollapsed ? strings.expandPanel(title) : strings.collapsePanel(title), className: hooks.slotClass('column-toggle') }), _jsx("span", { id: titleId, ...hooks.slot('column-title'), children: title }), _jsxs("span", { ...hooks.slot('column-count'), children: [_jsx("span", { "aria-hidden": "true", children: limit === undefined ? count : `${count}/${limit}` }), _jsx(VisuallyHidden, { elementType: "span", children: strings.cardCount(count, limit) })] }), isEmptyNode(actions) ? null : _jsx("div", { ...hooks.slot('column-actions'), children: actions })] }));
}
//# sourceMappingURL=board-column-header.js.map