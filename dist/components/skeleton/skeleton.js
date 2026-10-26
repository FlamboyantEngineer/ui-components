import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { normalizeCount } from '../../utils/count.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
const hooks = createHooks('skeleton', ['content']);
const textHooks = createHooks('skeleton-text', ['line']);
/**
 * A placeholder for content that is loading. Without children it is a decorative block of `shape`;
 * around real content it is the loading region, drawing the placeholder in the content's place
 * until `isLoading` turns false, without remounting the content.
 */
export function Skeleton({ shape = 'rectangle', isLoading = true, animated = true, children, className, ...rest }) {
    const data = { shape, loading: isLoading, animated: isLoading && animated };
    if (isEmptyNode(children)) {
        return _jsx("div", { ...rest, ...hooks.root({ className, data }), "aria-hidden": "true" });
    }
    return (_jsx("div", { ...rest, ...hooks.root({ className, data }), "aria-busy": isLoading || undefined, children: _jsx("div", { ...hooks.slot('content'), inert: isLoading, "aria-hidden": isLoading || undefined, children: children }) }));
}
/** A decorative placeholder for a paragraph: `lines` text skeletons. */
export function SkeletonText({ lines = 3, animated, className, ...rest }) {
    const count = Math.max(1, normalizeCount(lines) ?? 3);
    return (_jsx("div", { ...rest, ...textHooks.root({ className }), "aria-hidden": "true", children: Array.from({ length: count }, (_, line) => (_jsx(Skeleton, { shape: "text", animated: animated, className: textHooks.slotClass('line') }, line))) }));
}
//# sourceMappingURL=skeleton.js.map