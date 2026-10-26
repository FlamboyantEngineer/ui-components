import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { resolveContainment } from './layout.js';
const contentsHooks = createHooks('contents');
const inlineContentsHooks = createHooks('inline-contents');
const embeddedFrameHooks = createHooks('embedded-frame');
/**
 * A wrapper that adds no box of its own (`display: contents` in the stylesheet), for event capture,
 * portals and adapters. `hidden` removes its children from layout without unmounting them.
 */
export function Contents({ children, className, ...rest }) {
    return (_jsx("div", { ...rest, ...contentsHooks.root({ className }), children: children }));
}
/** The inline counterpart of `Contents`, valid inside phrasing content. */
export function InlineContents({ children, className, ...rest }) {
    return (_jsx("span", { ...rest, ...inlineContentsHooks.root({ className }), children: children }));
}
/**
 * An `<iframe>` that fills its host like `View`. It is fully sandboxed unless the caller grants
 * permissions through `sandbox`.
 */
export function EmbeddedFrame({ className, sandbox, grow, fill, clip, ...rest }) {
    const data = resolveContainment({ grow, fill, clip }, { grow: true, fill: true, clip: true });
    return (_jsx("iframe", { ...rest, sandbox: sandbox ?? '', ...embeddedFrameHooks.root({ className, data }) }));
}
//# sourceMappingURL=wrappers.js.map