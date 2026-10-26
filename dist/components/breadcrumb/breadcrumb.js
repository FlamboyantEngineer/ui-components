import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Breadcrumb as AriaBreadcrumb, Breadcrumbs as AriaBreadcrumbs, Link as AriaLink, useLocale, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { UiLink, useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { VisibleCollection } from '../overflow-list/overflow-list.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
import { OverflowCrumb, toCrumbKey, toCrumbText, useCrumbOverflow, } from './crumb-overflow.js';
const hooks = createHooks('breadcrumb', ['list', 'item', 'link', 'label', 'menu', 'separator']);
/** Crumbs that navigate render through the provider's link renderer; the others stay spans. */
function renderCrumbLink(props) {
    if ('href' in props && typeof props.href === 'string' && props['aria-disabled'] === undefined) {
        return _jsx(UiLink, { ...props, href: props.href });
    }
    const { href: _href, ...spanProps } = props;
    return _jsx("span", { ...spanProps });
}
/** The index of the crumb a navigation key moves focus to, or `undefined` for other keys. */
function resolveFocusTarget(key, { index, count, rtl }) {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (key === forward)
        return Math.min(count - 1, index + 1);
    if (key === backward)
        return Math.max(0, index - 1);
    if (key === 'Home')
        return 0;
    if (key === 'End')
        return count - 1;
    return undefined;
}
/** Arrow keys, Home and End move focus between the crumbs other than the current one. */
function moveFocus(event, rtl) {
    const crumbs = Array.from(event.currentTarget.querySelectorAll(`.${hooks.slotClass('link')}`)).filter((crumb) => !crumb.hasAttribute('data-current') && !crumb.hasAttribute('data-disabled'));
    const index = crumbs.indexOf(event.target);
    if (index === -1)
        return;
    const next = resolveFocusTarget(event.key, { index, count: crumbs.length, rtl });
    if (next === undefined)
        return;
    event.preventDefault();
    crumbs[next]?.focus();
}
/** The button after a crumb that opens the menu of the places beside it. */
function CrumbMenu({ item, index, isDisabled, onAction }) {
    const strings = useUiStrings();
    return (_jsx(DropdownMenu, { iconOnly: true, size: "xs", variant: "ghost", icon: "chevron-down", isDisabled: isDisabled, className: hooks.slotClass('menu'), label: strings.placesBeside(toCrumbText(item, index)), items: item.menu, onAction: (key) => onAction?.(key) }));
}
function Separator({ glyph }) {
    return _jsx(Icon, { ...toIconProps(glyph), size: "sm", className: hooks.slotClass('separator') });
}
function Crumb({ item, index, isLast, separator, isDisabled, onAction }) {
    return (_jsxs(AriaBreadcrumb, { id: toCrumbKey(item, index), className: hooks.slotClass('item'), children: [_jsx(AriaLink, { className: hooks.slotClass('link'), href: isLast ? undefined : item.href, render: renderCrumbLink, children: _jsx(TruncationTooltip, { className: hooks.slotClass('label'), children: item.label }) }), item.menu?.length ? (_jsx(CrumbMenu, { item: item, index: index, isDisabled: isDisabled, onAction: onAction })) : null, isLast ? null : _jsx(Separator, { glyph: separator })] }));
}
/** The crumbs, with the overflow crumb after the first while the trail collapses into a menu. */
function renderCrumbs({ items, glyph, onAction, isDisabled, }, overflow) {
    const crumbs = items.map((item, index) => (_jsx(Crumb, { item: item, index: index, isLast: index === items.length - 1, separator: glyph, isDisabled: isDisabled, onAction: onAction }, toKeyIdentity(toCrumbKey(item, index)))));
    if (overflow.visibleKeys === null)
        return crumbs;
    const entries = overflow.hiddenIndices.map((index) => {
        const item = items[index];
        return { id: toCrumbKey(item, index), label: toCrumbText(item, index), href: item.href };
    });
    crumbs.splice(1, 0, _jsx(OverflowCrumb, { id: overflow.overflowKey, menuRef: overflow.indicatorRef, items: entries, onAction: onAction, isDisabled: isDisabled, separator: _jsx(Separator, { glyph: glyph }) }, overflow.overflowKey));
    return crumbs;
}
/** A location trail: crumbs from the outermost container to the current page. */
export function Breadcrumb({ items, size = 'md', separator, overflow = 'truncate', isDisabled, onAction, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, className, ...rest }) {
    const rtl = useLocale().direction === 'rtl';
    const navProps = {
        ...rest,
        ...hooks.root({ className, props: rest, data: { size, overflow } }),
    };
    const glyph = separator ?? (rtl ? 'chevron-left' : 'chevron-right');
    const collapse = useCrumbOverflow(items, overflow === 'menu');
    const containerRef = collapse.containerRef;
    return (_jsx(VisibleCollection, { keys: collapse.visibleKeys, children: _jsx(AriaBreadcrumbs, { className: hooks.slotClass('list'), isDisabled: isDisabled, onAction: onAction, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, render: ({ ref: listRef, 'aria-label': label, 'aria-labelledby': labelledBy, id: _listId, ...listProps }) => (_jsx("nav", { ...navProps, "aria-label": label, "aria-labelledby": labelledBy, onKeyDown: (event) => moveFocus(event, rtl), children: _jsx("ol", { ...listProps, ref: mergeRefs(listRef, containerRef) }) })), children: renderCrumbs({ items, glyph, onAction, isDisabled }, collapse) }) }));
}
//# sourceMappingURL=breadcrumb.js.map