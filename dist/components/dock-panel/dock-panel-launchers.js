import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { Toolbar, useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { normalizeCount } from '../../utils/count.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';
/** Tooltips open toward the main content, away from the panel's edge. */
const tooltipPlacements = {
    start: 'end',
    end: 'start',
    bottom: 'top',
};
/** The toggle points the way the panel moves: toward its edge to collapse, away to expand. */
function resolveToggleGlyph(position, isExpanded, isRtl) {
    if (position === 'bottom')
        return isExpanded ? 'chevron-down' : 'chevron-up';
    const towardEnd = (position === 'end') === isExpanded;
    const glyph = towardEnd !== isRtl ? 'chevron-double-right' : 'chevron-double-left';
    return glyph;
}
/** One pane's launcher: an icon button named and tooltipped by the pane's label, and its count. */
function DockPanelLauncher({ pane, isSelected, isOpen, isOverlay, placement, buttonRef, onPress, }) {
    const strings = useUiStrings();
    const countId = useId();
    const count = normalizeCount(pane.count) || undefined;
    return (_jsxs("span", { ...hooks.slot('launcher', { selected: isSelected }), children: [_jsx(Tooltip, { content: pane.label, relationship: "label", placement: placement, children: _jsx(Button, { ref: buttonRef, icon: pane.icon, label: pane.label, size: "sm", isDisabled: pane.isDisabled, "aria-expanded": isOpen, "aria-controls": isOverlay ? undefined : pane.elementId, "aria-haspopup": isOverlay ? 'dialog' : undefined, "aria-describedby": count === undefined ? undefined : countId, onPress: onPress }) }), count === undefined ? null : (_jsxs(_Fragment, { children: [_jsx(Badge, { className: hooks.slotClass('count'), count: count, max: 99, size: "sm", placement: "overlay", "aria-hidden": true }), _jsx("span", { id: countId, hidden: true, children: strings.itemCount(count) })] }))] }));
}
/**
 * The panel's launchers as one toolbar (arrow keys move between them), with the toggle that
 * collapses and expands the panel last.
 */
export function DockPanelLaunchers({ label, position, panes, state, focus, isOverlay, bodyId, onLaunch, }) {
    const { selectedKey, isOpen } = state;
    const strings = useUiStrings();
    const isRtl = useLocale().direction === 'rtl';
    const toggleLabel = isOpen ? strings.collapsePanel(label) : strings.expandPanel(label);
    return (_jsxs(Toolbar, { "aria-label": strings.panelPanes(label), orientation: position === 'bottom' ? 'horizontal' : 'vertical', className: hooks.slotClass('launchers'), children: [panes.map((pane) => (_jsx(DockPanelLauncher, { pane: pane, isSelected: pane.id === selectedKey, isOpen: isOpen && pane.id === selectedKey, isOverlay: isOverlay, placement: tooltipPlacements[position], buttonRef: focus.launcherRef(pane.id), onPress: () => onLaunch(pane.id) }, toKeyIdentity(pane.id)))), _jsx(Button, { className: hooks.slotClass('toggle'), icon: resolveToggleGlyph(position, isOpen, isRtl), label: toggleLabel, tooltip: toggleLabel, size: "sm", isDisabled: selectedKey === null, "aria-expanded": isOpen, "aria-controls": isOverlay ? undefined : bodyId, onPress: () => state.setOpen(!isOpen) })] }));
}
//# sourceMappingURL=dock-panel-launchers.js.map