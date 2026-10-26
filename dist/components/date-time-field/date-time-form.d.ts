import type { DateFieldValue } from './date-values.js';
export interface DateFormNames {
    /** The form name of a single value. */
    name?: string | undefined;
    /** The form names of a range's ends. */
    startName?: string | undefined;
    endName?: string | undefined;
}
/**
 * The field's value in its form: hidden inputs holding the canonical text of a single value, or of a
 * range's start and end, empty while there is none. A disabled field submits nothing.
 */
export declare function DateFormInputs({ value, names, isDisabled, }: {
    value: DateFieldValue;
    names: DateFormNames;
    isDisabled: boolean;
}): import("react").JSX.Element;
//# sourceMappingURL=date-time-form.d.ts.map