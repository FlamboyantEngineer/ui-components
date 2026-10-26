// The problems a form's fields show, kept for a problem list that summarises them.
import { createContext, useContext } from 'react';
/** The fields in the order the document has them. */
export function inDocumentOrder(fields) {
    return [...fields].sort((left, right) => {
        const first = left.getElement();
        const second = right.getElement();
        if (!first || !second)
            return 0;
        return first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
}
function isSameProblem(left, right) {
    const { issue } = left;
    return (left.key === right?.key &&
        left.label === right.label &&
        issue.severity === right.issue.severity &&
        issue.message === right.issue.message &&
        issue.validity === right.issue.validity);
}
/**
 * A store of the problems the registered fields show. A notification only marks the list stale:
 * the fields are sorted and read when the list is next asked for, never while no one asks, and an
 * unchanged list stays the same object.
 */
export function createFormProblemStore(fields) {
    const listeners = new Set();
    const numbers = new WeakMap();
    let next = 0;
    let problems = [];
    let isStale = false;
    const numberOf = (field) => {
        if (!numbers.has(field))
            numbers.set(field, (next += 1));
        return numbers.get(field);
    };
    const read = () => inDocumentOrder(fields).flatMap((field) => field.getIssues().map((issue, index) => ({
        key: `${numberOf(field)}-${index}`,
        label: field.getLabel(),
        issue,
        focus: () => field.focus(),
    })));
    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => void listeners.delete(listener);
        },
        getProblems() {
            if (!isStale)
                return problems;
            isStale = false;
            const fresh = read();
            const isSame = fresh.length === problems.length &&
                fresh.every((problem, index) => isSameProblem(problem, problems[index]));
            if (!isSame)
                problems = fresh;
            return problems;
        },
        notify() {
            isStale = true;
            for (const listener of listeners)
                listener();
        },
    };
}
/** The problems of the enclosing form; `null` outside a form. */
export const FormProblemContext = createContext(null);
export function useFormProblems() {
    return useContext(FormProblemContext);
}
//# sourceMappingURL=form-problems.js.map