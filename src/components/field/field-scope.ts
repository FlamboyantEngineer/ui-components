// What an enclosing form or fieldset gives the fields inside it.

import { createContext, useContext } from 'react';
import type { FieldIssue, FieldValidation } from './field-validation.js';

/**
 * When a field shows its validation: from the start (`immediate`), once its value changes
 * (`change`), once focus leaves it (`blur`) or once its form is submitted (`submit`). Once shown,
 * the validation follows the value.
 */
export type FieldValidationMode = 'immediate' | 'change' | 'blur' | 'submit';

/**
 * `aria` reports validation through ARIA only. `native` also gives the control the field's error as
 * its custom validity, so the browser's constraint validation blocks a native submit.
 */
export type FieldValidationBehavior = 'aria' | 'native';

/** Errors from outside the field (a server's answer), by field name. */
export type FieldValidationErrors = Readonly<Record<string, string | readonly string[]>>;

/** A mounted field, as an enclosing form sees it. */
export interface FieldRegistration {
  /** The field's root element, which orders the fields as the document does. */
  getElement(): HTMLElement | null;
  /** The value has an error or is still being checked, so the form must not submit. */
  isBlocking(): boolean;
  /** Shows the field's validation, whatever its mode. */
  revealValidation(): void;
  /** Moves focus to the field's control. */
  focus(): void;
  /** The field's label, which names its problems in a problem list. */
  getLabel(): string;
  /** The issues the field shows, errors first. */
  getIssues(): readonly FieldIssue[];
  /** The validation of the value and draft the field shows, whether it shows it or not. */
  getRealtimeValidation(): FieldValidation;
}

export interface FieldScope {
  /** The validation mode of the fields that set none. */
  validationMode?: FieldValidationMode | undefined;
  /** The validation behavior of the fields that set none. */
  validationBehavior?: FieldValidationBehavior | undefined;
  /** External errors by field name; a field shows its own until its value changes. */
  validationErrors?: FieldValidationErrors | undefined;
  /** Disables every field inside. */
  isDisabled?: boolean | undefined;
  /** Makes every field inside read-only. */
  isReadOnly?: boolean | undefined;
  /** Registers a field for submit validation and returns the function that removes it. */
  register?: ((field: FieldRegistration) => () => void) | undefined;
  /** Called after the issues a registered field shows, or its label, change. */
  onIssuesChange?: (() => void) | undefined;
  /** Called after a registered field's realtime validation, or whether it is disabled, changes. */
  onValidityChange?: (() => void) | undefined;
}

/** The scope of the nearest form or fieldset; empty outside both. */
export const FieldScopeContext = createContext<FieldScope>({});

export function useFieldScope(): FieldScope {
  return useContext(FieldScopeContext);
}
