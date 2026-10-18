// The problems a form's fields show, kept for a problem list that summarises them.

import { createContext, useContext } from 'react';
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

/** The source the form updates: it reads the fields again on each notification. */
export interface FormProblemStore extends FormProblemSource {
  notify(): void;
}

/** The fields in the order the document has them. */
export function inDocumentOrder(fields: Iterable<FieldRegistration>): FieldRegistration[] {
  return [...fields].sort((left, right) => {
    const first = left.getElement();
    const second = right.getElement();
    if (!first || !second) return 0;
    return first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
}

/** A store of the problems the registered fields show. */
export function createFormProblemStore(fields: ReadonlySet<FieldRegistration>): FormProblemStore {
  const listeners = new Set<() => void>();
  const numbers = new WeakMap<FieldRegistration, number>();
  let next = 0;
  let problems: readonly FormProblem[] = [];
  const numberOf = (field: FieldRegistration) => {
    if (!numbers.has(field)) numbers.set(field, (next += 1));
    return numbers.get(field) as number;
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    getProblems: () => problems,
    notify() {
      problems = inDocumentOrder(fields).flatMap((field) =>
        field.getIssues().map((issue, index) => ({
          key: `${numberOf(field)}-${index}`,
          label: field.getLabel(),
          issue,
          focus: () => field.focus(),
        })),
      );
      for (const listener of listeners) listener();
    },
  };
}

/** The problems of the enclosing form; `null` outside a form. */
export const FormProblemContext = createContext<FormProblemSource | null>(null);

export function useFormProblems(): FormProblemSource | null {
  return useContext(FormProblemContext);
}
