import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo } from 'react';
import { Breadcrumb as AriaBreadcrumb } from '../../primitives/index.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
const hooks = createHooks('breadcrumb', ['item', 'overflow']);
/** A crumb's key: its `id`, or its index. */
export function toCrumbKey(item, index) {
    return item.id ?? index;
}
/** A crumb's text for a menu: `textValue`, a plain-text label, or its key. */
export function toCrumbText(item, index) {
    if (item.textValue)
        return item.textValue;
    return typeof item.label === 'string' ? item.label : String(toCrumbKey(item, index));
}
/**
 * Which crumbs a trail collapsing into a menu keeps: the first and the current crumb, then as many
 * as fit from the current end. The others leave the trail but stay in its collection.
 */
export function useCrumbOverflow(items, isMenu) {
    const overflowKey = useId();
    const collapses = isMenu && items.length > 2;
    const keys = collapses ? items.map(toCrumbKey) : [];
    const last = keys.length - 1;
    const overflow = useOverflowItems({
        items: keys,
        collapseFrom: 'start',
        getPriority: (_key, index) => (index === 0 || index === last ? 1 : 0),
    });
    const visibleKeys = useMemo(() => {
        const visible = new Set(overflow.visibleItems);
        if (overflow.hiddenItems.length > 0)
            visible.add(overflowKey);
        return visible;
    }, [overflow.visibleItems, overflow.hiddenItems, overflowKey]);
    const hidden = new Set(overflow.hiddenItems);
    return {
        overflowKey,
        visibleKeys: collapses ? visibleKeys : null,
        hiddenIndices: keys.flatMap((key, index) => (hidden.has(key) ? [index] : [])),
        containerRef: overflow.containerRef,
        indicatorRef: overflow.indicatorRef,
    };
}
/** The crumb that stands for the hidden ones: a "more" menu of them, then a separator. */
export function OverflowCrumb(props) {
    const { id, menuRef, items, onAction, isDisabled, separator } = props;
    const strings = useUiStrings();
    return (_jsxs(AriaBreadcrumb, { id: id, ref: menuRef, className: mergeClassNames(hooks.slotClass('item'), hooks.slotClass('overflow')), children: [_jsx(DropdownMenu, { iconOnly: true, size: "xs", variant: "ghost", label: strings.moreItems(items.length), isDisabled: isDisabled, items: items, onAction: (key) => onAction?.(key) }), separator] }));
}
//# sourceMappingURL=crumb-overflow.js.map