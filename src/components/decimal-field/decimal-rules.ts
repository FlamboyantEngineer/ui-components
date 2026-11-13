// The rules of a decimal field: its bounds, step grid and scale, how a value is checked against
// them, and how a value the reader typed or stepped settles onto them.

import type { UiStrings } from '../../core/strings.js';
import type { FieldIssue } from '../field/field.js';
import {
  addDecimals,
  clampDecimal,
  compareDecimals,
  countFractionDigits,
  type DecimalBounds,
  type DecimalGrid,
  type DecimalRoundingMode,
  isOnDecimalStep,
  roundDecimal,
  snapDecimal,
  stepDecimal,
  toCanonicalDecimal,
} from './decimal.js';

/**
 * What a commit does with a value outside the range or off the step: `snap` moves it to the
 * nearest step inside the range; `validate` keeps it and reports an error.
 */
export type DecimalFieldCommitBehavior = 'snap' | 'validate';

/** The rules a value is checked and moved by. */
export interface DecimalRules extends DecimalBounds {
  /** The step grid when `step` is given; without one, values only clamp and arrows add 1. */
  grid: DecimalGrid | null;
  /** Where an empty field starts stepping: `minValue`, or 0. */
  origin: string;
  scale: number | undefined;
  roundingMode: DecimalRoundingMode;
}

/** The given texts of the rules. */
export interface DecimalRuleProps {
  minValue?: string | undefined;
  maxValue?: string | undefined;
  step?: string | undefined;
  scale?: number | undefined;
  roundingMode?: DecimalRoundingMode | undefined;
}

function toDecimalOrUndefined(text: string | undefined): string | undefined {
  return text === undefined ? undefined : (toCanonicalDecimal(text) ?? undefined);
}

export function toDecimalRules(props: DecimalRuleProps): DecimalRules {
  const minValue = toDecimalOrUndefined(props.minValue);
  const step = toDecimalOrUndefined(props.step);
  return {
    minValue,
    maxValue: toDecimalOrUndefined(props.maxValue),
    grid: step === undefined ? null : { step, origin: minValue ?? '0' },
    origin: minValue ?? '0',
    scale: props.scale,
    roundingMode: props.roundingMode ?? 'halfExpand',
  };
}

interface CheckContext {
  strings: UiStrings;
  /** Writes a decimal in the locale, for the messages. */
  format: (value: string) => string;
}

/** The range error of a decimal, if any. */
function checkBounds(value: string, rules: DecimalRules, { strings, format }: CheckContext) {
  if (rules.minValue !== undefined && compareDecimals(value, rules.minValue) < 0) {
    const message = strings.rangeUnderflow(format(rules.minValue));
    return { severity: 'error' as const, message, validity: 'rangeUnderflow' as const };
  }
  if (rules.maxValue !== undefined && compareDecimals(value, rules.maxValue) > 0) {
    const message = strings.rangeOverflow(format(rules.maxValue));
    return { severity: 'error' as const, message, validity: 'rangeOverflow' as const };
  }
  return null;
}

/** The step error of a decimal off the grid, or with more fraction digits than the scale. */
function checkStep(value: string, rules: DecimalRules, { strings, format }: CheckContext) {
  const { scale, grid } = rules;
  const step =
    scale !== undefined && countFractionDigits(value) > scale
      ? scale === 0
        ? '1'
        : `0.${'1'.padStart(scale, '0')}`
      : grid !== null && !isOnDecimalStep(value, grid)
        ? grid.step
        : null;
  if (step === null) return null;
  const message = strings.stepMismatch(format(step));
  return { severity: 'error' as const, message, validity: 'stepMismatch' as const };
}

/** The issue of a value: no decimal, below or above the range, or off the step or the scale. */
export function checkDecimal(
  value: string | null,
  rules: DecimalRules,
  context: CheckContext,
): FieldIssue | null {
  if (value === null || value === '') return null;
  const decimal = toCanonicalDecimal(value);
  if (decimal === null) {
    return { severity: 'error', message: context.strings.decimalUnreadable, validity: 'badInput' };
  }
  return checkBounds(decimal, rules, context) ?? checkStep(decimal, rules, context);
}

/** The value a reader's decimal becomes: rounded to the scale, then snapped unless validated. */
export function settleDecimal(
  value: string,
  rules: DecimalRules,
  behavior: DecimalFieldCommitBehavior,
): string {
  const rounded =
    rules.scale === undefined ? value : roundDecimal(value, rules.scale, rules.roundingMode);
  if (behavior === 'validate') return rounded;
  return rules.grid
    ? snapDecimal(rounded, { ...rules.grid, ...rules })
    : clampDecimal(rounded, rules);
}

/**
 * One step up or down from the decimal the input shows, within the bounds: on the grid, or by 1
 * without a step. An empty field starts at the origin.
 */
export function stepFrom(value: string | null, direction: 1 | -1, rules: DecimalRules): string {
  if (value === null) return settleDecimal(clampDecimal(rules.origin, rules), rules, 'snap');
  const rounded = settleDecimal(value, rules, 'validate');
  if (rules.grid) return stepDecimal(rounded, direction, { ...rules.grid, ...rules });
  return clampDecimal(addDecimals(rounded, direction === 1 ? '1' : '-1'), rules);
}
