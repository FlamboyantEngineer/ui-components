import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
const hooks = createHooks('status-light', ['dot', 'label']);
/**
 * A coloured dot beside a short label that names a status, such as a service state or a person's
 * presence. Without a visible label it is an image named by `aria-label`, or decorative.
 */
export function StatusLight({ children, tone = 'neutral', status, size = 'md', isProcessing = false, className, 'aria-label': ariaLabel, ...rest }) {
    const strings = useUiStrings();
    const presenceLabel = status && !ariaLabel ? strings.presenceStatus(status) : undefined;
    const label = isEmptyNode(children) ? presenceLabel : children;
    const data = { tone, size, status, processing: isProcessing };
    const name = label === undefined && ariaLabel ? ariaLabel : undefined;
    return (_jsxs("span", { ...rest, ...hooks.root({ className, data }), role: name ? 'img' : undefined, "aria-label": name, "aria-hidden": label === undefined && !name ? true : undefined, children: [_jsx("span", { ...hooks.slot('dot'), "aria-hidden": "true" }), label === undefined ? null : _jsx("span", { ...hooks.slot('label'), children: label })] }));
}
//# sourceMappingURL=status-light.js.map