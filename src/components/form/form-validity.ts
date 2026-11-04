'use client';

// The verdict of a form's fields as they stand, for an action outside the submit, such as a Save
// button, that must not reveal validation, move focus or submit just to ask.

import { createContext, useContext } from 'react';
import { type Bounded, useWithinBoundary } from '../../utils/form-boundary.js';
import type { FieldRegistration } from '../field/field.js';
import { inDocumentOrder } from './form-problems.js';

/** A field that keeps the form from going through: it has an error or a check in progress. */
export interface FormBlocker {
  /** The field's label. */
  label: string;
  /** `invalid` for an error, `pending` while a check of the value runs. */
  status: 'invalid' | 'pending';
  /** The error, when the field has one. */
  message?: string | undefined;
  /** Moves focus to the field's control. */
  focus(): void;
}

/**
 * The form's verdict on the values and drafts its fields show, whether or not they show their
 * validation yet: what a submit would check, read without revealing, focusing or submitting.
 */
export interface FormValidity {
  /** Whether a field blocks the form. */
  isBlocked(): boolean;
  /** The blocking fields in document order; the same array until the verdict changes. */
  getBlockers(): readonly FormBlocker[];
  /** Calls `listener` after the verdict changes. Returns the function that unsubscribes. */
  subscribe(listener: () => void): () => void;
  /**
   * The deliberate check: shows every field's validation and focuses the first blocking field, as a
   * submit does, without submitting. Returns whether the form passes.
   */
  validate(): boolean;
}

/** The validity the form updates: it tells its listeners when the verdict has changed. */
export interface FormValidityStore extends FormValidity {
  notify(): void;
}

/** The field each blocker reads, so a field replaced by an equal-looking one is a new blocker. */
const owners = new WeakMap<FormBlocker, FieldRegistration>();

function readBlockers(fields: ReadonlySet<FieldRegistration>): FormBlocker[] {
  return inDocumentOrder(fields).flatMap((field) => {
    if (!field.isBlocking()) return [];
    const { status, message } = field.getRealtimeValidation();
    const blocker: FormBlocker = {
      label: field.getLabel(),
      status: status === 'pending' ? 'pending' : 'invalid',
      message: status === 'invalid' ? message : undefined,
      focus: () => field.focus(),
    };
    owners.set(blocker, field);
    return [blocker];
  });
}

function isSameBlockers(left: readonly FormBlocker[], right: readonly FormBlocker[]): boolean {
  return (
    left.length === right.length &&
    left.every((blocker, index) => {
      const other = right[index];
      return (
        other !== undefined &&
        owners.get(blocker) === owners.get(other) &&
        blocker.label === other.label &&
        blocker.status === other.status &&
        blocker.message === other.message
      );
    })
  );
}

export function createFormValidityStore(fields: ReadonlySet<FieldRegistration>): FormValidityStore {
  const listeners = new Set<() => void>();
  let blockers: readonly FormBlocker[] = [];
  let notified = blockers;
  // Read from the fields at each call, so a read right after a change is current.
  const getBlockers = () => {
    const fresh = readBlockers(fields);
    if (!isSameBlockers(fresh, blockers)) blockers = fresh;
    return blockers;
  };
  return {
    isBlocked: () => [...fields].some((field) => field.isBlocking()),
    getBlockers,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    validate() {
      const ordered = inDocumentOrder(fields);
      for (const field of ordered) field.revealValidation();
      const first = ordered.find((field) => field.isBlocking());
      first?.focus();
      return first === undefined;
    },
    notify() {
      if (getBlockers() === notified) return;
      notified = blockers;
      for (const listener of [...listeners]) listener();
    },
  };
}

/** The validity of the enclosing form; `null` outside a form. */
export const FormValidityContext = createContext<Bounded<FormValidity> | null>(null);

/**
 * The enclosing form's verdict on its fields as they stand; `null` outside a form or across an
 * overlay's body.
 */
export function useFormValidity(): FormValidity | null {
  return useWithinBoundary(useContext(FormValidityContext));
}
