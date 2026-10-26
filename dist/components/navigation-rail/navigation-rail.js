import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useState } from 'react';
import { FocusScope, useFocusManager, useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { ResizeHandle } from '../split-view/split-view.js';
import { NavigationRailContext, collapsedCodec, navigationRailHooks as hooks, usePersistedValue, widthCodec, } from './navigation-rail-state.js';
const linkSelector = `.${hooks.slotClass('link')}, .${hooks.slotClass('group-trigger')}`;
const bodyKeys = {
    ArrowDown: 'focusNext',
    ArrowUp: 'focusPrevious',
    Home: 'focusFirst',
    End: 'focusLast',
};
/** The scrolling list of sections. Up and Down, Home and End move focus between its entries. */
function RailBody({ id, children }) {
    const focusManager = useFocusManager();
    return (_jsx("div", { ...hooks.slot('body'), id: id, onKeyDown: (event) => {
            const move = bodyKeys[event.key];
            if (!move || !focusManager || event.defaultPrevented)
                return;
            event.preventDefault();
            focusManager[move]({ accept: (node) => node.matches(linkSelector) });
        }, children: children }));
}
/** The handle that resizes the expanded rail: live while dragging, committed when the drag ends. */
function RailResizeHandle({ width, minWidth, maxWidth, onResize, onResizeEnd }) {
    const strings = useUiStrings();
    return (_jsx(ResizeHandle, { className: hooks.slotClass('resize-handle'), "aria-label": strings.resizeNavigation, orientation: "vertical", value: width, minValue: minWidth, maxValue: maxWidth, extent: maxWidth, onChange: onResize, onChangeEnd: (next) => {
            onResize(null);
            onResizeEnd(next);
        } }));
}
/** The button that collapses the rail, pointing to the inline start, or expands it again. */
function RailToggle({ isCollapsed, bodyId, onPress }) {
    const strings = useUiStrings();
    const { direction } = useLocale();
    const label = strings.toggleNavigation(isCollapsed);
    const pointsLeft = isCollapsed === (direction === 'rtl');
    return (_jsx(Button, { className: hooks.slotClass('toggle'), icon: pointsLeft ? 'chevron-double-left' : 'chevron-double-right', label: label, tooltip: label, size: "sm", "aria-expanded": !isCollapsed, "aria-controls": bodyId, onPress: onPress }));
}
/**
 * The side navigation of an application (a `navigation` landmark): a header with a collapse
 * button, sections of links and groups, and a footer. Collapsed, it shows icons with tooltips; it
 * can be resized, and its collapsed state and width persist through the provider storage.
 */
export function NavigationRail({ children, header, footer, isCollapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange, isResizable = false, width: widthProp, defaultWidth = 240, onWidthChange, minWidth = 180, maxWidth = 400, persistKey, className, ...rest }) {
    const bodyId = `${useId()}-body`;
    const [isCollapsed, setCollapsed] = usePersistedValue({
        value: collapsedProp,
        defaultValue: defaultCollapsed,
        onChange: onCollapsedChange,
        persistKey: persistKey === undefined ? undefined : `${persistKey}:collapsed`,
        codec: collapsedCodec,
    });
    const [committedWidth, setWidth] = usePersistedValue({
        value: widthProp,
        defaultValue: defaultWidth,
        onChange: onWidthChange,
        persistKey: persistKey === undefined ? undefined : `${persistKey}:width`,
        codec: widthCodec,
    });
    const [liveWidth, setLiveWidth] = useState(null);
    // A stored or controlled width outside the bounds is drawn at the nearest bound.
    const width = clamp(liveWidth ?? committedWidth, minWidth, maxWidth);
    const state = useMemo(() => ({ isCollapsed, expand: () => setCollapsed(false) }), [isCollapsed, setCollapsed]);
    const style = isResizable
        ? { '--ui-navigation-rail-width': `${width}px` }
        : undefined;
    return (_jsx("nav", { ...rest, ...hooks.root({
            className,
            data: { collapsed: isCollapsed, resizable: isResizable, resizing: liveWidth !== null },
        }), style: style, children: _jsxs(NavigationRailContext, { value: state, children: [_jsxs("div", { ...hooks.slot('header'), children: [header, _jsx(RailToggle, { isCollapsed: isCollapsed, bodyId: bodyId, onPress: () => setCollapsed(!isCollapsed) })] }), _jsx(FocusScope, { children: _jsx(RailBody, { id: bodyId, children: children }) }), isEmptyNode(footer) ? null : _jsx("div", { ...hooks.slot('footer'), children: footer }), isResizable && !isCollapsed ? (_jsx(RailResizeHandle, { width: width, minWidth: minWidth, maxWidth: maxWidth, onResize: setLiveWidth, onResizeEnd: setWidth })) : null] }) }));
}
//# sourceMappingURL=navigation-rail.js.map