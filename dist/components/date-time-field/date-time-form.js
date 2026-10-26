import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
function HiddenValue({ name, value, isDisabled, }) {
    return name ? _jsx("input", { type: "hidden", name: name, value: value, disabled: isDisabled }) : null;
}
/**
 * The field's value in its form: hidden inputs holding the canonical text of a single value, or of a
 * range's start and end, empty while there is none. A disabled field submits nothing.
 */
export function DateFormInputs({ value, names, isDisabled, }) {
    const range = typeof value === 'object' ? value : null;
    return (_jsxs(_Fragment, { children: [_jsx(HiddenValue, { name: names.name, value: typeof value === 'string' ? value : '', isDisabled: isDisabled }), _jsx(HiddenValue, { name: names.startName, value: range?.start ?? '', isDisabled: isDisabled }), _jsx(HiddenValue, { name: names.endName, value: range?.end ?? '', isDisabled: isDisabled })] }));
}
//# sourceMappingURL=date-time-form.js.map