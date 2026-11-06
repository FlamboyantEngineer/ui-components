// The constraint model: which constraints each kind of field takes, and the problems a set of them
// has. It reports problems and never repairs or drops what the author typed.

import { compareDecimalText, isDecimalText } from './decimal-text.js';

/** The kind of field whose constraints are edited. */
export type ConstraintEditorKind = 'text' | 'number' | 'date' | 'options';

/** A constraint the editor can author. */
export type ConstraintName =
  | 'required'
  | 'default'
  | 'minimum'
  | 'maximum'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'minCount'
  | 'maxCount';

/**
 * The authored constraints. A constraint that is not set is absent, which stays apart from `false`,
 * `0` or an empty text default. Numeric bounds and defaults are decimal text and dates are
 * `YYYY-MM-DD`, so nothing passes through a JavaScript number; a default of an options field is an
 * option id.
 */
export interface ConstraintSet {
  required?: boolean | undefined;
  default?: string | undefined;
  minimum?: string | undefined;
  maximum?: string | undefined;
  minLength?: number | undefined;
  maxLength?: number | undefined;
  pattern?: string | undefined;
  minCount?: number | undefined;
  maxCount?: number | undefined;
}

/** Why a constraint set does not hold together. */
export type ConstraintIssueReason =
  | 'notNumber'
  | 'boundsReversed'
  | 'lengthsReversed'
  | 'countsReversed'
  | 'defaultBelowMinimum'
  | 'defaultAboveMaximum'
  | 'defaultTooShort'
  | 'defaultTooLong'
  | 'patternInvalid'
  | 'defaultPatternMismatch';

/** A problem, on the constraint whose control shows it. */
export interface ConstraintIssue {
  constraint: ConstraintName;
  reason: ConstraintIssueReason;
}

/** Orders two bound or default values of a kind: negative, zero or positive, or `null` if unreadable. */
export type ConstraintCompare = (left: string, right: string) => number | null;

/** The constraints each kind takes, in the order the editor shows them. */
export const constraintsByKind: Readonly<Record<ConstraintEditorKind, readonly ConstraintName[]>> =
  {
    text: ['required', 'default', 'minLength', 'maxLength', 'pattern'],
    number: ['required', 'default', 'minimum', 'maximum'],
    date: ['required', 'default', 'minimum', 'maximum'],
    options: ['required', 'default', 'minCount', 'maxCount'],
  };

const compareDates: ConstraintCompare = (left, right) =>
  left === right ? 0 : left < right ? -1 : 1;

function isReversed(low: number | undefined, high: number | undefined) {
  return low !== undefined && high !== undefined && low > high;
}

function readPattern(pattern: string): RegExp | null {
  try {
    return new RegExp(`^(?:${pattern})$`, 'u');
  } catch {
    return null;
  }
}

/** Number bounds and defaults that are not decimal text. */
function findUnreadableNumbers(set: ConstraintSet): ConstraintIssue[] {
  return (['default', 'minimum', 'maximum'] as const)
    .filter((name) => set[name] !== undefined && !isDecimalText(set[name] ?? ''))
    .map((name) => ({ constraint: name, reason: 'notNumber' }));
}

/** A reversed range of bounds, and a default outside it. */
function findBoundIssues(set: ConstraintSet, compare: ConstraintCompare): ConstraintIssue[] {
  const issues: ConstraintIssue[] = [];
  const { minimum, maximum } = set;
  if (minimum !== undefined && maximum !== undefined && (compare(minimum, maximum) ?? 0) > 0) {
    issues.push({ constraint: 'maximum', reason: 'boundsReversed' });
  }
  if (set.default === undefined) return issues;
  if (minimum !== undefined && (compare(set.default, minimum) ?? 0) < 0) {
    issues.push({ constraint: 'default', reason: 'defaultBelowMinimum' });
  }
  if (maximum !== undefined && (compare(set.default, maximum) ?? 0) > 0) {
    issues.push({ constraint: 'default', reason: 'defaultAboveMaximum' });
  }
  return issues;
}

/** Reversed lengths, an unreadable pattern, and a text default that breaks either. */
function findTextIssues(set: ConstraintSet): ConstraintIssue[] {
  const issues: ConstraintIssue[] = [];
  if (isReversed(set.minLength, set.maxLength)) {
    issues.push({ constraint: 'maxLength', reason: 'lengthsReversed' });
  }
  const pattern = set.pattern === undefined ? undefined : readPattern(set.pattern);
  if (pattern === null) issues.push({ constraint: 'pattern', reason: 'patternInvalid' });
  if (set.default === undefined) return issues;
  const length = [...set.default].length;
  if (set.minLength !== undefined && length < set.minLength) {
    issues.push({ constraint: 'default', reason: 'defaultTooShort' });
  }
  if (set.maxLength !== undefined && length > set.maxLength) {
    issues.push({ constraint: 'default', reason: 'defaultTooLong' });
  }
  if (pattern && !pattern.test(set.default)) {
    issues.push({ constraint: 'default', reason: 'defaultPatternMismatch' });
  }
  return issues;
}

/**
 * The problems of a constraint set for a kind of field, considering only the constraints it
 * takes. Numbers compare as decimal text and dates as `YYYY-MM-DD` unless `compare` orders them.
 */
export function validateConstraints(
  kind: ConstraintEditorKind,
  set: ConstraintSet,
  compare?: ConstraintCompare,
): ConstraintIssue[] {
  switch (kind) {
    case 'text':
      return findTextIssues(set);
    case 'number': {
      const unreadable = findUnreadableNumbers(set);
      return unreadable.length > 0
        ? unreadable
        : findBoundIssues(set, compare ?? compareDecimalText);
    }
    case 'date':
      return findBoundIssues(set, compare ?? compareDates);
    case 'options':
      return isReversed(set.minCount, set.maxCount)
        ? [{ constraint: 'maxCount', reason: 'countsReversed' }]
        : [];
  }
}
