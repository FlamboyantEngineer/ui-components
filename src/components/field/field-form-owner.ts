'use client';

// The form a field's native inputs name in their `form` attribute, given to every input it renders.

import { createContext, useContext } from 'react';
import { getElementByIdFrom } from '../../utils/owner-window.js';

/** The id of the form the field's inputs belong to, when the field names one. */
export const FieldFormOwnerContext = createContext<string | undefined>(undefined);

/** The `form` attribute for each native input a field control renders: its field's `form`. */
export function useFieldFormOwner(): string | undefined {
  return useContext(FieldFormOwnerContext);
}

/**
 * The form `id` names in `node`'s tree (its shadow root, else its document), as a native `form`
 * attribute resolves it: an id that names no form, or no element, gives no form.
 */
export function findFormById(node: Node, id: string): HTMLFormElement | null {
  const element = getElementByIdFrom(node, id);
  return element?.localName === 'form' ? (element as HTMLFormElement) : null;
}
