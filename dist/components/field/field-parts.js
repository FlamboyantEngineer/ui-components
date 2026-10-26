import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { TextMatch } from '../text-match/text-match.js';
export const fieldHooks = createHooks('field', [
    'label',
    'required',
    'colon',
    'control',
    'help',
    'menu',
    'decoration',
    'description',
    'message',
]);
const controlSizes = ['xs', 'sm', 'md', 'lg'];
/** The size of a button inside or beside a control of `size`: one step smaller, never below `xs`. */
export function toInnerControlSize(size) {
    return controlSizes[Math.max(0, controlSizes.indexOf(size) - 1)] ?? 'xs';
}
/** Ids for the field's parts, derived from the caller's `id` or a generated one. */
export function useFieldIds(id) {
    const generated = useId();
    const base = id ?? generated;
    return {
        control: `${base}-control`,
        label: `${base}-label`,
        description: `${base}-description`,
        decoration: `${base}-decoration`,
        message: `${base}-message`,
        help: `${base}-help`,
    };
}
function joinIds(...ids) {
    return ids.filter(Boolean).join(' ') || undefined;
}
/**
 * The control's props: it is named by the label element, or by `label` when the layout draws none,
 * and described by the parts the field renders.
 */
export function toFieldControlProps(state, ids, parts) {
    const { status, message } = state.validation;
    const isInvalid = status === 'invalid';
    return {
        id: ids.control,
        ref: parts.ref,
        'aria-label': parts.label,
        'aria-labelledby': parts.label === undefined ? ids.label : undefined,
        'aria-describedby': joinIds(parts.hasDescription && ids.description, parts.hasDecoration && ids.decoration, Boolean(message) && ids.message),
        'aria-errormessage': isInvalid ? ids.message : undefined,
        'aria-invalid': isInvalid || undefined,
        'aria-required': state.isRequired || undefined,
        readOnly: state.isReadOnly,
        disabled: state.isDisabled,
    };
}
export function FieldLabel({ ids, label, layout, isRequired, }) {
    return (_jsxs("label", { ...fieldHooks.slot('label'), id: ids.label, htmlFor: ids.control, children: [_jsx(TextMatch, { children: label }), isRequired ? (_jsx("span", { ...fieldHooks.slot('required'), "aria-hidden": "true", children: "*" })) : null, layout === 'label-colon-control' ? (_jsx("span", { ...fieldHooks.slot('colon'), "aria-hidden": "true", children: ":" })) : null] }));
}
function severityOf({ status }) {
    if (status === 'invalid')
        return 'error';
    return status === 'warning' ? 'warning' : null;
}
/** The message region. It stays in the document so assistive technology announces new messages. */
export function FieldMessage({ id, validation, children, }) {
    return (_jsx("div", { ...fieldHooks.slot('message', { severity: severityOf(validation) }), id: id, "aria-live": "polite", "aria-atomic": "true", children: validation.message ? children : null }));
}
/** The help button: its tooltip shows the help, which also describes the button while closed. */
export function FieldHelp({ id, label, size, children, }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [_jsx(Button, { icon: "help", size: size, label: strings.fieldHelp(label), tooltip: children, className: fieldHooks.slotClass('help'), "aria-describedby": id }), _jsx("span", { id: id, hidden: true, children: children })] }));
}
//# sourceMappingURL=field-parts.js.map