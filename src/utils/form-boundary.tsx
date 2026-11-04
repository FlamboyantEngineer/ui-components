'use client';

// Where the forms around a subtree end: an overlay's body, which React renders inside the form that
// opened it while the document holds it elsewhere.

import { createContext, type ReactNode, useContext, useState } from 'react';
import { FormContext, FormValidationContext } from '../primitives/index.js';

/** What a form gives its subtree, with the boundary the form itself sits in. */
export interface Bounded<T> {
  value: T;
  boundary: object | null;
}

const FormBoundaryContext = createContext<object | null>(null);
const noErrors = {};

/** The nearest form boundary around the caller; null outside any. */
export function useFormBoundary(): object | null {
  return useContext(FormBoundaryContext);
}

/** What a form gave, when the form sits inside the caller's boundary; null across one. */
export function useWithinBoundary<T>(bounded: Bounded<T> | null): T | null {
  const boundary = useFormBoundary();
  return bounded?.boundary === boundary ? bounded.value : null;
}

/**
 * Ends the forms around its children: the fields inside belong to a form inside it or to none, and
 * take neither the validation, the errors nor the props of a React Aria form around it.
 */
export function FormBoundary({ children }: { children: ReactNode }) {
  const [boundary] = useState(() => ({}));
  return (
    <FormContext value={null}>
      <FormValidationContext value={noErrors}>
        <FormBoundaryContext value={boundary}>{children}</FormBoundaryContext>
      </FormValidationContext>
    </FormContext>
  );
}
