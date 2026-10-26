import { jsx as _jsx } from "react/jsx-runtime";
import { resolveContainment, } from '../layout/layout.js';
import { ResizableSplitView } from './resizable-split-view.js';
import { splitViewHooks as hooks } from './styling-hooks.js';
function isResizable(props) {
    return props.panes !== undefined;
}
/**
 * Panes side by side or stacked. With `ratio` the stylesheet sizes two fixed tracks; with `panes`
 * a window splitter between each pair resizes them by pointer and keyboard, and collapsible panes
 * collapse and open again.
 */
export function SplitView(props) {
    if (isResizable(props))
        return _jsx(ResizableSplitView, { ...props });
    const { children, className, orientation = 'horizontal', ratio = 'equal', space = 'none', grow, fill, clip, panes: _panes, ...rest } = props;
    const containment = resolveContainment({ grow, fill, clip }, { fill: true, clip: true });
    return (_jsx("div", { ...rest, ...hooks.root({ className, data: { orientation, ratio, space, ...containment } }), children: children }));
}
export { ResizeHandle } from './resize-handle.js';
//# sourceMappingURL=split-view.js.map