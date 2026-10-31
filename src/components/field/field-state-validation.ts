'use client';

// The validation a field's state holds: the value's issues, the control's draft issue, and what is
// shown of them.

import { isEmptyValue } from '../../utils/is-empty-value.js';
import { useCallback, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useAsyncCheck } from './field-async.js';
import type { FieldScope } from './field-scope.js';
import type { FieldStateOptions } from './field-state.js';
import {
  checkFieldValue,
  resolveFieldValidation,
  selectShownValidation,
  useExternalIssues,
  useFieldReveal,
  type FieldIssue,
} from './field-validation.js';

/**
 * The validation of the value: the control's draft issue, external errors for the field's name,
 * the required check, `validate` and the debounced `validateAsync`, shown as the validation mode
 * allows.
 */
export function useFieldValidation<T>(
  value: T,
  options: FieldStateOptions<T>,
  {
    scope,
    isEqual,
    isEmpty = isEmptyValue,
  }: {
    scope: FieldScope;
    isEqual: (left: T, right: T) => boolean;
    isEmpty?: ((value: T) => boolean) | undefined;
  },
) {
  const strings = useUiStrings();
  const [draftIssue, setDraftIssue] = useDraftIssue();
  const reveal = useFieldReveal(options.validationMode ?? scope.validationMode ?? 'immediate');
  const external = useExternalIssues(value, {
    errors: scope.validationErrors,
    name: options.name,
    sources: options.errorSources,
    isEqual,
  });
  const draft = draftIssue ? [draftIssue] : [];
  const own = [...draft, ...external, ...checkFieldValue(value, { ...options, isEmpty }, strings)];
  const check = useAsyncCheck(value, {
    validateAsync: options.validateAsync,
    debounce: options.validationDebounce ?? 0,
    isSkipped: own.some((issue) => issue.severity === 'error'),
    isEqual,
  });
  const isPending = Boolean(options.isPending) || check.isRunning;
  const realtime = resolveFieldValidation([...own, ...check.issues], isPending, strings);
  const shown = selectShownValidation(
    realtime,
    { external, isRevealed: reveal.isRevealed },
    strings,
  );
  return { reveal, realtime, shown, isEmpty: isEmpty(value), setDraftIssue };
}

/** The control's report on its draft, kept while it reports the same issue again. */
function useDraftIssue() {
  const [issue, setIssue] = useState<FieldIssue | null>(null);
  const report = useCallback((next: FieldIssue | null) => {
    setIssue((previous) =>
      previous?.severity === next?.severity && previous?.message === next?.message
        ? previous
        : next,
    );
  }, []);
  return [issue, report] as const;
}
