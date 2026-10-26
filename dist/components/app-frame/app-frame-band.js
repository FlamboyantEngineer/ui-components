import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { ToolbarRow } from '../layout/layout.js';
import { ProjectionContent, useProjectedContent } from '../projection/projection.js';
import { toAppFrameSlot, useIsInsideAppFrame } from './app-frame.js';
const hooks = createHooks('app-frame-band', ['leading', 'status', 'tools', 'actions']);
/** Each part's content: what a descendant projects into it, else the band's own prop. */
function useBandContents(own) {
    return {
        leading: useProjectedContent(toAppFrameSlot('leading')) ?? own.leading,
        status: useProjectedContent(toAppFrameSlot('status')) ?? own.status,
        tools: useProjectedContent(toAppFrameSlot('tools')) ?? own.tools,
        actions: useProjectedContent(toAppFrameSlot('actions')) ?? own.actions,
    };
}
/**
 * The command band of an application frame, a named group: a leading title or breadcrumb, a
 * transient status, the tools in a toolbar that scrolls instead of wrapping, and trailing actions.
 * Inside an `AppFrame`, descendants fill its parts through `AppFrameBandContent`.
 */
export function AppFrameBand({ leading, status, children, actions, toolsLabel, actionsLabel, className, ...rest }) {
    const strings = useUiStrings();
    const contents = useBandContents({ leading, status, tools: children, actions });
    return (_jsxs("div", { ...rest, ...hooks.root({ className }), role: "group", children: [isEmptyNode(contents.leading) ? null : (_jsx("div", { ...hooks.slot('leading'), children: contents.leading })), isEmptyNode(contents.status) ? null : _jsx("div", { ...hooks.slot('status'), children: contents.status }), isEmptyNode(contents.tools) ? null : (_jsx(ToolbarRow, { className: hooks.slotClass('tools'), overflow: "scroll", justify: "start", "aria-label": toolsLabel ?? strings.tools, children: contents.tools })), isEmptyNode(contents.actions) ? null : (_jsx("div", { ...hooks.slot('actions'), role: "group", "aria-label": actionsLabel ?? strings.actions, children: contents.actions }))] }));
}
/**
 * Fills a part of the nearest frame's band from anywhere below the frame, in place of its own.
 * Without a frame above, it renders its children in place.
 */
export function AppFrameBandContent({ slot, children }) {
    if (!useIsInsideAppFrame())
        return _jsx(_Fragment, { children: children });
    return _jsx(ProjectionContent, { slot: toAppFrameSlot(slot), children: children });
}
//# sourceMappingURL=app-frame-band.js.map