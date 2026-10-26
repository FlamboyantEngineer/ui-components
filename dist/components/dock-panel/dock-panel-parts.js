import { jsx as _jsx } from "react/jsx-runtime";
import { Children, isValidElement, useState, } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { Drawer } from '../drawer/drawer.js';
import { ResizeHandle } from '../split-view/split-view.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';
import { DockPanelPane, DockPanelPaneContext } from './dock-panel-pane.js';
/** Arrow keys step 5 % of this many pixels (10), Shift+arrows 1 % (2). */
const keyboardExtent = 200;
/** The `DockPanelPane` children, each with its launcher and the id of its element. */
export function readPanes(children, baseId) {
    return Children.toArray(children)
        .filter((child) => isValidElement(child) && child.type === DockPanelPane)
        .map((element, index) => ({
        element,
        launcher: { ...element.props, elementId: `${baseId}-pane-${index}` },
    }));
}
/** The keys of the panes whose launchers are enabled, in order. */
export function readEnabledKeys(panes) {
    return panes.filter((pane) => !pane.launcher.isDisabled).map((pane) => pane.launcher.id);
}
/**
 * Whether the panel is an overlay, from its parent's width, and its largest size: `maxSize`,
 * lowered to leave `minMainSize` of the parent along the panel's axis, never below `minSize`.
 */
export function useDockPanelBounds(rootRef, options) {
    const { position, minSize, maxSize, minMainSize, overlayBelow } = options;
    const parent = useElementSize(rootRef, { parent: true, box: 'client' });
    if (parent === null)
        return { isOverlay: false, largest: Math.max(minSize, maxSize) };
    const extent = position === 'bottom' ? parent.height : parent.width;
    const room = minMainSize === undefined ? maxSize : Math.min(maxSize, extent - minMainSize);
    return {
        isOverlay: overlayBelow !== undefined && parent.width < overlayBelow,
        largest: Math.max(minSize, room),
    };
}
/** The window splitter on the panel's inner edge, sizing the panel in pixels. */
export function DockPanelSeparator({ label, position, state, minSize, maxSize, bodyId, onResizingChange, }) {
    const strings = useUiStrings();
    return (_jsx(ResizeHandle, { className: hooks.slotClass('handle'), orientation: position === 'bottom' ? 'horizontal' : 'vertical', sizedPane: position === 'start' ? 'before' : 'after', value: state.size, minValue: minSize, maxValue: maxSize, extent: keyboardExtent, "aria-label": strings.resizePanel(label), "aria-controls": bodyId, onChange: state.changeSize, onChangeEnd: state.commitSize, onResizingChange: onResizingChange }));
}
/** Hands a pane its element id, its visibility and the ref that lets its launcher focus it. */
export function PaneFrame({ entry, openKey, isOverlay, focus }) {
    const { id, elementId } = entry.launcher;
    const isHidden = !isOverlay && id !== openKey;
    const value = { elementId, isHidden, isOverlay, paneRef: focus.paneRef(id) };
    return (_jsx(DockPanelPaneContext.Provider, { value: value, children: entry.element }));
}
/** The drawer that holds the open pane while the panel is an overlay, titled by the pane. */
export function DockPanelDrawer({ position, entry, state, children }) {
    return (_jsx(Drawer, { className: hooks.slotClass('drawer'), position: position, title: entry.element.props.title ?? entry.launcher.label, showCloseButton: true, isOpen: state.isOpen, onOpenChange: state.setOpen, children: children }));
}
/**
 * Whether the selected pane shows: the expanded state while docked; while an overlay, whether the
 * drawer is open, which only a launcher or the toggle opens and which closes when the panel docks.
 */
export function useDockPanelOpenState(state, isOverlay) {
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    if (!isOverlay && isDrawerOpen)
        setDrawerOpen(false);
    return isOverlay
        ? { selectedKey: state.selectedKey, isOpen: isDrawerOpen, setOpen: setDrawerOpen }
        : { selectedKey: state.selectedKey, isOpen: state.isExpanded, setOpen: state.setExpanded };
}
//# sourceMappingURL=dock-panel-parts.js.map