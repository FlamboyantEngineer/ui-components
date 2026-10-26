import type { Key } from '../../core/props.js';
import type { FieldSeverity } from '../field/field.js';
/** A problem a problem list shows. */
export interface ProblemListItem {
    /** Unique among the list's problems. */
    id: Key;
    /** What is wrong. */
    message: string;
    /** Defaults to `error`. */
    severity?: FieldSeverity | undefined;
    /** The label of the field or part the problem is about. */
    label?: string | undefined;
    /** The id of the element focused when the reader picks the problem. */
    targetId?: string | undefined;
}
/** A problem as the list draws it, with the way to reach its field when it has one. */
export interface ShownProblem extends ProblemListItem {
    severity: FieldSeverity;
    /** Moves focus to the problem's field; without it the problem is plain text. */
    focus: (() => void) | undefined;
}
export declare const problemListHooks: import("../../core/hooks.js").ComponentHooks<"label" | "summary" | "title" | "message" | "icon" | "items" | "item" | "jump">;
/** The problems, each a button that reaches its field when it can, else plain text. */
export declare function ProblemItems({ problems, onAction, }: {
    problems: readonly ShownProblem[];
    onAction: ((id: Key) => void) | undefined;
}): import("react").JSX.Element;
//# sourceMappingURL=problem-list-items.d.ts.map