import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { renderElement } from '../../utils/render-element.js';
import { useOverflowItems } from '../../utils/use-overflow-items.js';
const hooks = createHooks('overflow-list', ['item', 'overflow']);
/**
 * One row of items that keeps as many as fit and hands the rest to an indicator at one end, such as
 * a "+N" count or a "more" menu. The row measures itself; the stylesheet lays it out on one line.
 */
export function OverflowList({ items, renderItem, renderOverflow, collapseFrom = 'end', render, className, ref, ...rest }) {
    const { containerRef, visibleItems, hiddenItems } = useOverflowItems({ items, collapseFrom });
    const rootRef = useMemo(() => mergeRefs(containerRef, ref), [containerRef, ref]);
    const isOverflowing = hiddenItems.length > 0;
    const offset = collapseFrom === 'start' ? items.length - visibleItems.length : 0;
    const indicator = isOverflowing ? (_jsx("div", { ...hooks.slot('overflow'), children: renderOverflow(hiddenItems) })) : null;
    return renderElement('div', {
        ...rest,
        ...hooks.root({ className, props: rest, data: { collapseFrom, overflowing: isOverflowing } }),
        ref: rootRef,
        children: (_jsxs(_Fragment, { children: [collapseFrom === 'start' ? indicator : null, visibleItems.map((item, index) => (_jsx("div", { ...hooks.slot('item'), children: renderItem(item, offset + index) }, offset + index))), collapseFrom === 'end' ? indicator : null] })),
    }, { render, state: { isOverflowing } });
}
export { VisibleCollection } from './visible-collection.js';
//# sourceMappingURL=overflow-list.js.map