import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// The sections, links and groups a navigation rail lists.
import { useContext, useId, useState } from 'react';
import { Button as AriaButton, Disclosure as AriaDisclosure, DisclosurePanel as AriaDisclosurePanel, } from '../../primitives/index.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { formatCount, normalizeCount } from '../../utils/count.js';
import { getInitials } from '../../utils/initials.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Badge } from '../badge/badge.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { Link, renderLinkElement } from '../link/link.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { CurrentItemContext, NavigationRailContext, navigationRailHooks as hooks, useCurrentItems, useReportCurrent, } from './navigation-rail-state.js';
const countMax = 99;
/** The shown count, read as part of the link's name, and the hidden description of the full count. */
function ItemCount({ id, count, description, isCollapsed }) {
    const shown = formatCount(count, { max: countMax });
    return (_jsxs(_Fragment, { children: [' ', _jsx(Badge, { className: hooks.slotClass('count'), count: count, max: countMax, size: "sm", placement: isCollapsed ? 'overlay' : 'inline', "aria-label": shown }), _jsx("span", { id: id, hidden: true, children: description })] }));
}
// The tooltip of a collapsed group repeats the label the button is named by, so it describes nothing.
function renderUndescribedButton(props) {
    return _jsx("button", { ...props, "aria-describedby": undefined });
}
/** An entry's icon, or its initials while collapsed without one, then its label. */
function EntryContent({ label, icon, isCollapsed }) {
    const text = isCollapsed ? (_jsx(VisuallyHidden, { elementType: "span", className: hooks.slotClass('label'), children: label })) : (_jsx("span", { ...hooks.slot('label'), children: label }));
    let tile = null;
    if (!isEmptyNode(icon))
        tile = _jsx(Icon, { ...toIconProps(icon), className: hooks.slotClass('icon') });
    else if (isCollapsed) {
        tile = (_jsx("span", { ...hooks.slot('monogram'), "aria-hidden": "true", children: getInitials(label) }));
    }
    return (_jsxs(_Fragment, { children: [tile, text] }));
}
/** A titled list of a rail's items and groups. Its title shows only while the rail is expanded. */
export function NavigationRailSection({ title, children, className, ...rest }) {
    const { isCollapsed } = useContext(NavigationRailContext);
    const titleId = useId();
    const titleProps = { id: titleId, className: hooks.slotClass('section-title') };
    return (_jsxs("div", { ...rest, ...hooks.slot('section', undefined, className), children: [title === undefined ? null : isCollapsed ? (_jsx(VisuallyHidden, { elementType: "span", ...titleProps, children: title })) : (_jsx("span", { ...titleProps, children: title })), _jsx("ul", { ...hooks.slot('list'), "aria-labelledby": title === undefined ? undefined : titleId, children: children })] }));
}
/**
 * A link in the rail: an icon, a label and a count, `aria-current="page"` when it is the current
 * page. While the rail is collapsed it shows its icon, with the label in a tooltip.
 */
export function NavigationRailItem({ label, href, onPress, icon, count, countLabel, isCurrent = false, className, ...rest }) {
    const strings = useUiStrings();
    const { isCollapsed } = useContext(NavigationRailContext);
    const descriptionId = useId();
    useReportCurrent(isCurrent);
    const shownCount = normalizeCount(count) ?? 0;
    const hasCount = shownCount > 0;
    // The collapsed tooltip repeats the label the link is named by, so only the count describes it.
    const describedBy = hasCount ? descriptionId : undefined;
    return (_jsx("li", { ...rest, ...hooks.slot('item', { current: isCurrent }, className), children: _jsx(Tooltip, { content: label, placement: "end", isDisabled: !isCollapsed, children: _jsxs(Link, { className: hooks.slotClass('link'), href: href, onPress: onPress, variant: "secondary", isStandalone: true, underline: "none", "aria-current": isCurrent ? 'page' : undefined, render: (props) => renderLinkElement({ ...props, 'aria-describedby': describedBy }), children: [_jsx(EntryContent, { label: label, icon: icon, isCollapsed: isCollapsed }), hasCount ? (_jsx(ItemCount, { id: descriptionId, count: shownCount, description: countLabel ?? strings.itemCount(shownCount), isCollapsed: isCollapsed })) : null] }) }) }));
}
/**
 * A group of items that opens and closes under a button. It publishes `data-current` while it
 * holds the current page, and opens when the current page moves inside it. In a collapsed rail
 * its items stay closed, and pressing it expands the rail and opens it.
 */
export function NavigationRailGroup({ label, icon, children, isExpanded: expandedProp, defaultExpanded = false, onExpandedChange, className, ...rest }) {
    const rail = useContext(NavigationRailContext);
    const [ownExpanded, setOwnExpanded] = useState(defaultExpanded);
    const [holdsCurrent, register] = useCurrentItems();
    useReportCurrent(holdsCurrent);
    // The current page moving inside opens the group; leaving it changes nothing.
    const [heldCurrent, setHeldCurrent] = useState(holdsCurrent);
    if (holdsCurrent !== heldCurrent) {
        setHeldCurrent(holdsCurrent);
        if (holdsCurrent)
            setOwnExpanded(true);
    }
    const isOpen = expandedProp ?? ownExpanded;
    const glyph = useExpandGlyph(isOpen && !rail.isCollapsed);
    const changeExpanded = (next) => {
        if (rail.isCollapsed)
            rail.expand();
        const value = rail.isCollapsed || next;
        setOwnExpanded(value);
        onExpandedChange?.(value);
    };
    return (_jsx("li", { ...rest, ...hooks.slot('item', { current: holdsCurrent }, className), children: _jsxs(AriaDisclosure, { className: hooks.slotClass('group'), isExpanded: isOpen && !rail.isCollapsed, onExpandedChange: changeExpanded, children: [_jsx(Tooltip, { content: label, placement: "end", isDisabled: !rail.isCollapsed, children: _jsxs(AriaButton, { className: hooks.slotClass('group-trigger'), slot: "trigger", render: renderUndescribedButton, children: [_jsx(EntryContent, { label: label, icon: icon, isCollapsed: rail.isCollapsed }), _jsx(Glyph, { name: glyph, className: hooks.slotClass('indicator') })] }) }), _jsx(AriaDisclosurePanel, { className: hooks.slotClass('group-panel'), children: _jsx(CurrentItemContext, { value: register, children: _jsx("ul", { ...hooks.slot('list'), children: children }) }) })] }) }));
}
//# sourceMappingURL=navigation-rail-items.js.map