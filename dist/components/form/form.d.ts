import { type FormEvent, type ReactNode, type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type FieldValidationBehavior, type FieldValidationErrors, type FieldValidationMode } from '../field/field.js';
/** The HTTP method a native submit uses. */
export type FormMethod = 'get' | 'post' | 'dialog';
export interface FormProps extends BaseProps, AriaLabellingProps {
    /** The `<form>` element, for code that submits it with `requestSubmit()`. */
    ref?: Ref<HTMLFormElement> | undefined;
    /** When the fields inside show their validation, unless a field sets its own. Defaults to `submit`. */
    validationMode?: FieldValidationMode | undefined;
    /**
     * `native` (the default) lets the browser's constraint validation block a submit through the
     * fields' custom validity; `aria` reports validation through ARIA only. Fields that set none use it.
     */
    validationBehavior?: FieldValidationBehavior | undefined;
    /** Errors from outside the form (a server's answer), by field name. */
    validationErrors?: FieldValidationErrors | undefined;
    /** Where a native submit sends the form's data. */
    action?: string | undefined;
    /** The HTTP method of a native submit. */
    method?: FormMethod | undefined;
    /** Called with the submit event once every field inside passes; prevent its default to stay. */
    onSubmit?: ((event: FormEvent<HTMLFormElement>) => void) | undefined;
    children?: ReactNode;
}
/**
 * A form on React Aria's `Form` that validates its fields on submit: it shows every field's
 * validation and, while any field has an error or is still being checked, blocks the submit and
 * focuses the first such field. `validationErrors` (a server's answer) show on the fields they name
 * until their values change. A `ProblemList` inside it lists the problems its fields show.
 */
export declare function Form({ validationMode, validationBehavior, validationErrors, onSubmit, className, children, ref, ...rest }: FormProps): import("react").JSX.Element;
export { useFormProblems } from './form-problems.js';
export type { FormProblem, FormProblemSource } from './form-problems.js';
//# sourceMappingURL=form.d.ts.map