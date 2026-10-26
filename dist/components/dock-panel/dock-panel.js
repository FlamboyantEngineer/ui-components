import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef, useState } from 'react';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';
import { DockPanelLaunchers, } from './dock-panel-launchers.js';
import { DockPanelDrawer, DockPanelSeparator, PaneFrame, readEnabledKeys, readPanes, useDockPanelBounds, useDockPanelOpenState, } from './dock-panel-parts.js';
import { useDockPanelFocus } from './use-dock-panel-focus.js';
import { useDockPanelState } from './use-dock-panel-state.js';
/** A launcher press opens its pane (focus follows it in) or, on the open pane, closes it. */
function createLaunch(state, open, focus) {
    return (key) => {
        if (key === open.selectedKey && open.isOpen)
            return open.setOpen(false);
        focus.requestFocus(key);
        if (key !== open.selectedKey)
            state.setSelectedKey(key);
        if (!open.isOpen)
            open.setOpen(true);
    };
}
/**
 * A panel docked against an edge of an application frame: a toolbar of pane launchers that stays
 * visible while the panel is collapsed, one open pane at a time beside the main content, a
 * separator that resizes it, and a drawer over the page below `overlayBelow`. Panes stay mounted
 * while hidden; the selection, expanded state and size persist under `persistKey`.
 */
export function DockPanel({ label, position = 'end', children, defaultExpanded = true, defaultSize = 320, minSize = 200, maxSize = 640, minMainSize, overlayBelow, className, id, ...rest }) {
    const baseId = useId();
    const bodyId = `${baseId}-body`;
    const rootRef = useRef(null);
    const [isResizing, setResizing] = useState(false);
    const bounds = { position, minSize, maxSize, minMainSize, overlayBelow };
    const { isOverlay, largest } = useDockPanelBounds(rootRef, bounds);
    const panes = readPanes(children, baseId);
    const state = useDockPanelState({
        ...rest,
        enabledKeys: readEnabledKeys(panes),
        defaultExpanded,
        defaultSize,
        minSize,
        maxSize: largest,
    });
    const openKey = state.isExpanded && !isOverlay ? state.selectedKey : null;
    const focus = useDockPanelFocus(openKey);
    const open = useDockPanelOpenState(state, isOverlay);
    const selected = panes.find((pane) => pane.launcher.id === state.selectedKey);
    const frame = (entry) => (_jsx(PaneFrame, { entry, openKey, isOverlay, focus }, entry.element.key));
    const isDocked = openKey !== null;
    // A drag ends with its separator if the panel collapses mid-drag.
    const data = {
        position,
        expanded: isDocked,
        overlay: isOverlay,
        resizing: isDocked && isResizing,
    };
    const axis = position === 'bottom' ? 'height' : 'width';
    return (_jsxs("section", { ...hooks.root({ className, props: rest, data }), ref: rootRef, id: id, "aria-label": label, style: openKey === null ? undefined : { [axis]: state.size }, children: [_jsx(DockPanelLaunchers, { label, position, isOverlay, bodyId, state: open, focus: focus, panes: panes.map((pane) => pane.launcher), onLaunch: createLaunch(state, open, focus) }), openKey === null ? null : (_jsx(DockPanelSeparator, { label, position, state, minSize, bodyId, maxSize: largest, onResizingChange: setResizing })), isOverlay ? null : (_jsx("div", { ...hooks.slot('body'), id: bodyId, hidden: openKey === null, children: panes.map(frame) })), isOverlay && selected ? (_jsx(DockPanelDrawer, { position: position, entry: selected, state: open, children: frame(selected) })) : null] }));
}
export { DockPanelPane } from './dock-panel-pane.js';
//# sourceMappingURL=dock-panel.js.map