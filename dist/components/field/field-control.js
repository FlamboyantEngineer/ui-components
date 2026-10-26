import { useFieldState, } from './field-state.js';
const stateKeys = new Set([
    'value',
    'defaultValue',
    'committedValue',
    'emptyValue',
    'onChange',
    'onCommit',
    'validate',
    'validateAsync',
    'validationDebounce',
    'validationMode',
    'validationBehavior',
    'isRequired',
    'isReadOnly',
    'isDisabled',
    'isPending',
]);
const layoutKeys = new Set([
    'label',
    'labelLayout',
    'size',
    'description',
    'help',
    'decoration',
    'menu',
    'onMenuAction',
    'renderMessage',
    'className',
    'id',
]);
function bucketOf(key) {
    if (stateKeys.has(key))
        return 'state';
    return layoutKeys.has(key) || key.startsWith('data-') ? 'field' : 'rest';
}
// The form name is the field's (for external errors) and the control's (to submit its value).
function splitFieldProps(props) {
    const buckets = {
        state: {},
        field: {},
        rest: {},
    };
    for (const [key, value] of Object.entries(props)) {
        if (key === 'name')
            buckets.state[key] = value;
        buckets[bucketOf(key)][key] = value;
    }
    return buckets;
}
/**
 * Builds a field control from its props: the field state (with the control's own check before the
 * caller's `validate`), the props for `Field`, and the props left for the control itself.
 */
export function useFieldControl(props, options) {
    const buckets = splitFieldProps(props);
    const own = buckets.state;
    const { check } = options;
    const state = useFieldState({
        ...own,
        defaultValue: own.defaultValue !== undefined ? own.defaultValue : options.initialValue,
        emptyValue: own.emptyValue !== undefined ? own.emptyValue : options.emptyValue,
        validate: (value) => check?.(value) ?? own.validate?.(value) ?? null,
    });
    return {
        state,
        field: buckets.field,
        rest: buckets.rest,
    };
}
/**
 * The control props in the library's prop vocabulary, for a control built on a building block: its
 * id, name, description and states. Controls validate through the field, so the building block only
 * reports the field's status (`validationBehavior="aria"`).
 */
export function toAriaControlProps(control) {
    return {
        id: control.id,
        'aria-label': control['aria-label'],
        'aria-labelledby': control['aria-labelledby'],
        'aria-describedby': control['aria-describedby'],
        'aria-errormessage': control['aria-errormessage'],
        isInvalid: control['aria-invalid'] === true,
        isRequired: control['aria-required'] === true,
        isReadOnly: control.readOnly,
        isDisabled: control.disabled,
        validationBehavior: 'aria',
    };
}
//# sourceMappingURL=field-control.js.map