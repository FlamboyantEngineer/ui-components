import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { Group, Toolbar } from '../../primitives/index.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { Separator } from '../separator/separator.js';
import { ToolbarScroller } from '../toolbar-scroller/toolbar-scroller.js';
import { resolveContainment, } from './layout.js';
const hooks = createHooks('toolbar-row', ['group', 'separator']);
/** The direction and wrapping of the enclosing row, which its groups follow and its separators cross. */
const ToolbarRowContext = createContext({
    orientation: 'horizontal',
    wrap: 'wrap',
});
/** The overflow a row applies: a vertical row is one column that never scrolls sideways. */
function resolveOverflow(overflow, orientation) {
    return orientation === 'vertical' && overflow === 'scroll' ? 'none' : overflow;
}
/** A row of controls, vertically centred, with a gap; or a column of them when vertical. */
export function ToolbarRow({ children, className, role = 'toolbar', variant = 'plain', orientation = 'horizontal', space = 'md', justify = 'end', overflow: requestedOverflow = 'wrap', isPending = false, grow, fill, clip, ...rest }) {
    const containment = resolveContainment({ grow, fill, clip });
    const overflow = resolveOverflow(requestedOverflow, orientation);
    const wrap = overflow === 'wrap' ? 'wrap' : 'nowrap';
    const hookProps = {
        ...hooks.root({
            className,
            data: {
                variant,
                orientation,
                space,
                justify,
                wrap,
                overflow,
                pending: isPending,
                ...containment,
            },
        }),
        inert: isPending || undefined,
    };
    const content = _jsx(ToolbarRowContext, { value: { orientation, wrap }, children: children });
    if (overflow === 'scroll') {
        const { 'aria-label': label, 'aria-labelledby': labelledBy, ...own } = rest;
        return (_jsx("div", { ...own, ...hookProps, children: _jsx(ToolbarScroller, { "aria-label": label, "aria-labelledby": labelledBy, children: content }) }));
    }
    if (role === 'toolbar') {
        return (_jsx(Toolbar, { ...rest, ...hookProps, orientation: orientation, children: content }));
    }
    return (_jsx("div", { ...rest, ...hookProps, role: role === 'group' ? 'group' : undefined, children: content }));
}
/**
 * A named group of related controls inside a `ToolbarRow` (`role="group"`), laid out along the
 * row. In a toolbar, arrow keys still move through every control of the row.
 */
export function ToolbarRowGroup({ children, className, density = 'regular', ...rest }) {
    const { orientation, wrap } = useContext(ToolbarRowContext);
    return (_jsx(Group, { ...rest, ...hooks.slot('group', { orientation, wrap, density }, className), children: children }));
}
/** A divider between controls or groups of a `ToolbarRow`, across the row: a `Separator`. */
export function ToolbarRowSeparator({ className, ...rest }) {
    const across = useContext(ToolbarRowContext).orientation;
    const orientation = across === 'horizontal' ? 'vertical' : 'horizontal';
    return (_jsx(Separator, { ...rest, className: mergeClassNames(hooks.slotClass('separator'), className), orientation: orientation }));
}
//# sourceMappingURL=toolbar-row.js.map