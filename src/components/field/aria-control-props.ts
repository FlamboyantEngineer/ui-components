import type { FieldControlProps } from './field-parts.js';

/**
 * The control props in the library's prop vocabulary, for a control built on a building block: its
 * id, name, description and states. Controls validate through the field, so the building block only
 * reports the field's status (`validationBehavior="aria"`).
 */
export function toAriaControlProps(control: FieldControlProps) {
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
    validationBehavior: 'aria' as const,
  };
}
