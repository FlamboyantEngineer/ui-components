import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
const stripHooks = createHooks('property-strip');
const cellHooks = createHooks('property-strip-cell', ['letter']);
/** An inline run of small labelled controls inside one property row, such as the sides of a margin. */
export function PropertyStrip({ children, className, ...rest }) {
    return (_jsx("span", { ...rest, ...stripHooks.root({ className }), children: children }));
}
/** One cell of a `PropertyStrip`: a decorative letter before its control. */
export function PropertyStripCell({ letter, label, children, className, ...rest }) {
    return (_jsxs("span", { ...rest, ...cellHooks.root({ className }), children: [_jsx("span", { ...cellHooks.slot('letter'), title: label, "aria-hidden": "true", children: letter }), children] }));
}
//# sourceMappingURL=property-strip.js.map