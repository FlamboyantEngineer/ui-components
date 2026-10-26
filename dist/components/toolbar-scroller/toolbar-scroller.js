import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useRef } from 'react';
import { Toolbar, useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import { scrollStripPage, scrollStripTo, useScrollStripOverflow, } from '../../utils/use-scroll-strip-overflow.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { ScrollStripButton } from '../button/button.js';
const hooks = createHooks('toolbar-scroller', [
    'strip',
    'item',
    'overflow',
    'fade',
    'scroll-button',
]);
/** How far the visible overlays (scroll buttons, fades) cover each side of the strip, in pixels. */
function measureCoveredInsets(strip, overlays) {
    const box = strip.getBoundingClientRect();
    let left = 0;
    let right = 0;
    for (const overlay of overlays) {
        if (!(overlay instanceof HTMLElement) || overlay.hidden)
            continue;
        const rect = overlay.getBoundingClientRect();
        const overlap = Math.min(rect.right, box.right) - Math.max(rect.left, box.left);
        if (rect.width === 0 || overlap <= 0)
            continue;
        if (rect.left + rect.right < box.left + box.right)
            left = Math.max(left, rect.right - box.left);
        else
            right = Math.max(right, box.right - rect.left);
    }
    return { left, right };
}
/** Scrolls the strip so a focused tool lies clear of the overlays beside the strip that cover it. */
function revealTool(strip, tool) {
    const overlays = Array.from(strip.parentElement?.children ?? []).filter((node) => node !== strip);
    const insets = measureCoveredInsets(strip, overlays);
    const box = strip.getBoundingClientRect();
    const item = tool.getBoundingClientRect();
    const visibleLeft = box.left + insets.left;
    const visibleRight = box.right - insets.right;
    let delta = 0;
    if (item.left < visibleLeft)
        delta = item.left - visibleLeft;
    else if (item.right > visibleRight)
        delta = item.right - visibleRight;
    if (delta !== 0)
        scrollStripTo(strip, strip.scrollLeft + delta, 'instant');
}
/** The strip of a scroller that collapses tools into a menu: the tools that fit, then the menu. */
function MenuStrip({ items, renderItem, stripProps, }) {
    const strings = useUiStrings();
    const { containerRef, visibleItems, hiddenItems } = useOverflowItems({
        items,
        getPriority: (item) => item.priority ?? 0,
    });
    return (_jsxs(Toolbar, { ...stripProps, ref: containerRef, className: hooks.slotClass('strip'), orientation: "horizontal", children: [visibleItems.map((item) => (_jsx("div", { ...hooks.slot('item'), children: renderItem(item) }, toKeyIdentity(item.id)))), hiddenItems.length > 0 ? (_jsx("div", { ...hooks.slot('overflow'), children: _jsx(DropdownMenu, { iconOnly: true, size: "sm", placement: "bottom end", label: strings.moreItems(hiddenItems.length), items: hiddenItems.map(({ id, label, icon, isDisabled }) => ({
                        id,
                        label,
                        icon,
                        isDisabled,
                    })), onAction: (key) => hiddenItems.find((item) => item.id === key)?.onAction?.() }) })) : null] }));
}
/**
 * One horizontal row of tools that scrolls instead of squeezing them. A toolbar gives the tools
 * arrow-key focus; scroll buttons and decorative fades appear only at an edge that hides tools.
 */
export function ToolbarScroller({ children, scrollButtons = true, items, renderItem, overflow = 'scroll', 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, className, ...rest }) {
    const rtl = useLocale().direction === 'rtl';
    const stripRef = useRef(null);
    const { overflow: edges, syncOverflow } = useScrollStripOverflow(stripRef);
    const pageToward = (edge) => {
        if (!stripRef.current)
            return;
        scrollStripPage(stripRef.current, { edge, rtl });
        syncOverflow();
    };
    const onFocus = (event) => {
        const strip = stripRef.current;
        if (strip && event.target !== strip && strip.contains(event.target)) {
            revealTool(strip, event.target);
        }
    };
    const stripProps = { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy };
    if (overflow === 'menu' && items && renderItem) {
        return (_jsx("div", { ...rest, ...hooks.root({ className, props: rest, data: { overflow } }), children: _jsx(MenuStrip, { items: items, renderItem: renderItem, stripProps: stripProps }) }));
    }
    return (_jsxs("div", { ...rest, ...hooks.root({
            className,
            props: rest,
            data: { overflow: 'scroll', overflowStart: edges.start, overflowEnd: edges.end },
        }), onFocus: onFocus, children: [scrollButtons ? (_jsx(ScrollStripButton, { ...hooks.slot('scroll-button', { edge: 'start' }), edge: "start", isHidden: !edges.start, onPress: pageToward })) : null, _jsx(Toolbar, { ref: stripRef, className: hooks.slotClass('strip'), orientation: "horizontal", ...stripProps, onScroll: syncOverflow, children: items && renderItem
                    ? items.map((item) => (_jsx(Fragment, { children: renderItem(item) }, toKeyIdentity(item.id))))
                    : children }), _jsx("span", { ...hooks.slot('fade', { edge: 'start' }), "aria-hidden": "true", hidden: !edges.start }), _jsx("span", { ...hooks.slot('fade', { edge: 'end' }), "aria-hidden": "true", hidden: !edges.end }), scrollButtons ? (_jsx(ScrollStripButton, { ...hooks.slot('scroll-button', { edge: 'end' }), edge: "end", isHidden: !edges.end, onPress: pageToward })) : null] }));
}
//# sourceMappingURL=toolbar-scroller.js.map