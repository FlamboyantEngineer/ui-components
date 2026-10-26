import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Icon, toIconProps } from '../icon/icon.js';
const hooks = createHooks('empty-state', ['spinner', 'icon', 'title', 'description', 'actions']);
const loadingRegion = { role: 'status', 'aria-live': 'polite', 'aria-atomic': true };
function toTypographicEllipsis(node) {
    return typeof node === 'string' ? node.replace(/\.{3}/g, '…') : node;
}
/** The decorative lead: the spinner while loading, else the icon, if any. */
function EmptyStateLead({ icon, isLoading }) {
    if (isLoading)
        return _jsx("span", { ...hooks.slot('spinner'), "aria-hidden": "true" });
    if (isEmptyNode(icon))
        return null;
    return _jsx(Icon, { ...toIconProps(icon), className: hooks.slotClass('icon') });
}
/**
 * The notice a collection, panel or section shows in place of its content while it loads, when it
 * has nothing to show, or when it could not load.
 */
export function EmptyState({ description, title, variant = 'empty', size = 'md', headingLevel = 3, icon, actions, className, ...rest }) {
    const isLoading = variant === 'loading';
    const Heading = `h${headingLevel}`;
    return (_jsxs("section", { ...rest, ...hooks.root({ className, data: { variant, size } }), ...(isLoading ? loadingRegion : {}), children: [_jsx(EmptyStateLead, { icon: icon, isLoading: isLoading }), isEmptyNode(title) ? null : _jsx(Heading, { ...hooks.slot('title'), children: title }), _jsx("p", { ...hooks.slot('description'), children: isLoading ? toTypographicEllipsis(description) : description }), isEmptyNode(actions) ? null : _jsx("div", { ...hooks.slot('actions'), children: actions })] }));
}
//# sourceMappingURL=empty-state.js.map