import type { BaseProps, Key } from '../../core/props.js';
import { type ProblemListItem } from './problem-list-items.js';
export type { ProblemListItem } from './problem-list-items.js';
export interface ProblemListProps extends BaseProps {
    /** The problems to list. Without them, a list inside a `Form` lists the problems its fields show. */
    problems?: readonly ProblemListItem[] | undefined;
    /** The heading. Defaults to the provider's `problems` string. */
    title?: string | undefined;
    /** Called with a problem's id when the reader picks it, after focus moves to its target. */
    onAction?: ((id: Key) => void) | undefined;
}
/**
 * A summary of validation problems at the top of a form or document: a heading, the count of
 * errors and warnings in a polite live region, and each problem with its severity, the label of
 * its field and its message. Picking a problem moves focus to its field. Inside a `Form`, it lists
 * the problems the form's fields show and follows them as they change; it also lists the problems
 * a caller gives, such as a document's checks.
 */
export declare function ProblemList({ problems, title, onAction, className, id, ...rest }: ProblemListProps): import("react").JSX.Element;
//# sourceMappingURL=problem-list.d.ts.map