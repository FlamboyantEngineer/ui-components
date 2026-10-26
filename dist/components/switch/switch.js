import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Switch as AriaSwitch } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
const hooks = createHooks('switch', ['track', 'thumb', 'label']);
/**
 * An on-off switch on React Aria's `Switch`, with no field around it: a native input with role
 * `switch` inside a `<label>`, a track and thumb, and an optional visible label.
 */
export function Switch({ children, size = 'md', className, ...rest }) {
    return (_jsxs(AriaSwitch, { ...rest, ...hooks.root({ className, props: rest, data: { size } }), children: [_jsx("span", { ...hooks.slot('track'), "aria-hidden": "true", children: _jsx("span", { ...hooks.slot('thumb') }) }), children ? _jsx("span", { ...hooks.slot('label'), children: children }) : null] }));
}
//# sourceMappingURL=switch.js.map