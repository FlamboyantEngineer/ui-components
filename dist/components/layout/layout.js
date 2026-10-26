import { jsx as _jsx } from "react/jsx-runtime";
import { createElement } from 'react';
import { createHooks } from '../../core/hooks.js';
import { interleaveDividers } from './dividers.js';
// Other components reach the toolbar row through this main module.
export { ToolbarRow, ToolbarRowSeparator } from './toolbar-row.js';
const viewHooks = createHooks('view');
const pageHooks = createHooks('page');
const stackHooks = createHooks('stack', ['divider']);
const clusterHooks = createHooks('cluster', ['divider']);
const gridHooks = createHooks('grid');
const flexRowHooks = createHooks('flex-row');
const inlineFieldHooks = createHooks('inline-field');
const statusBarHooks = createHooks('status-bar');
function renderAs(element, props, children) {
    return createElement(element, props, children);
}
/**
 * The `data-grow`, `data-fill` and `data-clip` hook values of containment props, each falling back
 * to the component's default: `grow` publishes nothing for `false`, `fill` and `clip` default off.
 */
export function resolveContainment({ grow, fill, clip }, defaults = {}) {
    const growth = grow ?? defaults.grow ?? false;
    return {
        grow: growth === true ? 'true' : growth || undefined,
        fill: fill ?? defaults.fill ?? false,
        clip: clip ?? defaults.clip ?? false,
    };
}
/**
 * The grid hook values of a column template: the columns, the fit minimum (published only for
 * `fit`), the gap and the cell alignment.
 */
export function resolveGridLayout({ columns, minColumnWidth, space, align, }) {
    return {
        columns,
        minColumnWidth: columns === 'fit' ? minColumnWidth : undefined,
        space,
        align,
    };
}
/** A view that fills its host as a column: it grows, fills the block size and clips by default. */
export function View({ children, className, grow, fill, clip, ...rest }) {
    const data = resolveContainment({ grow, fill, clip }, { grow: true, fill: true, clip: true });
    return (_jsx("section", { ...rest, ...viewHooks.root({ className, data }), children: children }));
}
/** A centred page column with a maximum width and a gutter. */
export function Page({ children, className, width = 'wide', gutter = '3xl', grow, fill, clip, ...rest }) {
    const data = { width, gutter, ...resolveContainment({ grow, fill, clip }, { grow: true }) };
    return (_jsx("section", { ...rest, ...pageHooks.root({ className, data }), children: children }));
}
/** Children in a column with a gap. */
export function Stack({ as, children, className, space = '2xl', align = 'stretch', divided = false, grow, fill, clip, ...rest }) {
    const element = as ?? 'div';
    const data = { space, align, divided, ...resolveContainment({ grow, fill, clip }) };
    const content = divided
        ? interleaveDividers(children, { parent: element, className: stackHooks.slotClass('divider') })
        : children;
    return renderAs(element, { ...rest, ...stackHooks.root({ className, data }) }, content);
}
/** Children in a row that wraps, with a gap. */
export function Cluster({ as, children, className, space = 'md', align = 'center', justify = 'start', wrap = 'wrap', inline = false, divided = false, grow, fill, clip, ...rest }) {
    const element = as ?? 'div';
    const containment = resolveContainment({ grow, fill, clip });
    const data = { space, align, justify, wrap, inline, divided, ...containment };
    const content = divided
        ? interleaveDividers(children, {
            parent: element,
            className: clusterHooks.slotClass('divider'),
        })
        : children;
    return renderAs(element, { ...rest, ...clusterHooks.root({ className, data }) }, content);
}
/** Children in a grid of columns with a gap. */
export function Grid({ as, children, className, columns = 2, minColumnWidth = 'sm', space = '2xl', align = 'stretch', gutter = 'none', grow, fill, clip, ...rest }) {
    const data = {
        ...resolveGridLayout({ columns, minColumnWidth, space, align }),
        gutter,
        ...resolveContainment({ grow, fill, clip }),
    };
    return renderAs(as ?? 'div', { ...rest, ...gridHooks.root({ className, data }) }, children);
}
/** A full-bleed row whose children divide the remaining space; it grows by default. */
export function FlexRow({ children, className, grow, fill, clip, ...rest }) {
    const data = resolveContainment({ grow, fill, clip }, { grow: true });
    return (_jsx("div", { ...rest, ...flexRowHooks.root({ className, data }), children: children }));
}
/** A `<label>` holding a caption and its control in one row. */
export function InlineField({ children, className, space = 'xs', align = 'center', justify = 'start', wrap = 'nowrap', inline = false, grow, fill, clip, ...rest }) {
    const data = { space, align, justify, wrap, inline, ...resolveContainment({ grow, fill, clip }) };
    return (_jsx("label", { ...rest, ...inlineFieldHooks.root({ className, data }), children: children }));
}
/**
 * A `<footer>` strip of status items along the bottom of a view. It is not a landmark (outside
 * sectioning content a `<footer>` would be the page's content information): a named bar is a group,
 * and a caller `role` wins.
 */
export function StatusBar({ children, className, space = 'xs', justify = 'between', wrap = 'nowrap', grow, fill, clip, ...rest }) {
    const data = { space, justify, wrap, ...resolveContainment({ grow, fill, clip }) };
    const isNamed = Boolean(rest['aria-label'] ?? rest['aria-labelledby']);
    return (_jsx("footer", { role: isNamed ? 'group' : 'none', ...rest, ...statusBarHooks.root({ className, data }), children: children }));
}
//# sourceMappingURL=layout.js.map