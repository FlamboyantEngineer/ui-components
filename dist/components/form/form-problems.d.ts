import type { FieldIssue, FieldRegistration } from '../field/field.js';
/** One issue a field inside a form shows, with the field's label and a way to reach it. */
export interface FormProblem {
    /** Stable while the field stays mounted: the field's number in the form, then the issue's. */
    key: string;
    /** The field's label. */
    label: string;
    issue: FieldIssue;
    /** Moves focus to the field's control. */
    focus(): void;
}
/** The fields' problems in document order, and a subscription to their changes. */
export interface FormProblemSource {
    subscribe(listener: () => void): () => void;
    /** The same list until a field's problems change. */
    getProblems(): readonly FormProblem[];
}
/** The source the form updates: it reads the fields again after each notification, when asked. */
export interface FormProblemStore extends FormProblemSource {
    notify(): void;
}
/** The fields in the order the document has them. */
export declare function inDocumentOrder(fields: Iterable<FieldRegistration>): FieldRegistration[];
/**
 * A store of the problems the registered fields show. A notification only marks the list stale:
 * the fields are sorted and read when the list is next asked for, never while no one asks, and an
 * unchanged list stays the same object.
 */
export declare function createFormProblemStore(fields: ReadonlySet<FieldRegistration>): FormProblemStore;
/** The problems of the enclosing form; `null` outside a form. */
export declare const FormProblemContext: import("react").Context<FormProblemSource | null>;
export declare function useFormProblems(): FormProblemSource | null;
//# sourceMappingURL=form-problems.d.ts.map