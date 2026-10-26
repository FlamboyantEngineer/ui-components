import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { pickDataAttributes } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { ActionRow } from '../action-row/action-row.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';
export const DockPanelPaneContext = createContext(null);
const noActions = Object.freeze([]);
/**
 * One pane of an `DockPanel`, which draws its launcher from the pane's label, icon and count. The
 * pane is a labelled region with an optional header row (a title and `ActionRow` actions) above
 * its content; while another pane is open it stays mounted, hidden and inert, keeping its state.
 */
export function DockPanelPane({ id: _id, label, icon: _icon, count: _count, isDisabled: _isDisabled, title, actions = noActions, children, className, ...rest }) {
    const context = useContext(DockPanelPaneContext);
    const level = useHeadingLevel(undefined);
    const Heading = `h${level}`;
    const isHidden = context?.isHidden ?? false;
    const heading = context?.isOverlay || isEmptyNode(title) ? null : (_jsx(Heading, { ...hooks.slot('title'), children: title }));
    return (_jsxs("section", { ...pickDataAttributes(rest), ...hooks.slot('pane', undefined, className), ref: context?.paneRef, id: context?.elementId, "aria-label": label, tabIndex: context ? -1 : undefined, hidden: isHidden, inert: isHidden, children: [_jsx(ActionRow, { className: hooks.slotClass('header'), lead: heading, actions: actions, size: "sm" }), _jsx("div", { ...hooks.slot('content'), tabIndex: 0, children: children })] }));
}
//# sourceMappingURL=dock-panel-pane.js.map