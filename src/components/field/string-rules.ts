import type { UiStrings } from '../../core/strings.js';
import type { FieldIssue, FieldValidity } from './field-state.js';

/** Rules for a text value. An empty text passes them all; a required field reports it instead. */
export interface StringRules {
  minLength?: number | undefined;
  maxLength?: number | undefined;
  /** A format the whole text must match. */
  pattern?: RegExp | undefined;
  /** Check the text without its leading and trailing whitespace. */
  trim?: boolean | undefined;
  /**
   * Counts a text's length for `minLength` and `maxLength`. Defaults to counting code points; pass
   * a grapheme counter so that a combined emoji counts once.
   */
  getLength?: ((text: string) => number) | undefined;
}

/** The provider strings the rules report with. */
export type StringRuleMessages = Pick<UiStrings, 'tooShort' | 'tooLong' | 'patternMismatch'>;

/**
 * Whether `pattern` matches the whole of `text`. The outer bounds are lookarounds rather than `^`
 * and `$`, so a caller's `m` flag keeps its meaning inside the pattern without letting the bounds
 * stop at a line break. `g` and `y` are dropped, so no `lastIndex` carries over between checks.
 */
function matchesWhole(pattern: RegExp, text: string): boolean {
  const flags = pattern.flags.replace(/[gy]/g, '');
  return new RegExp(`(?<![\\s\\S])(?:${pattern.source})(?![\\s\\S])`, flags).test(text);
}

function error(message: string, validity: FieldValidity): FieldIssue {
  return { severity: 'error', message, validity };
}

/** A text's length in code points, so a single emoji counts once. */
export function countCodePoints(text: string): number {
  return [...text].length;
}

/**
 * Checks a text against its rules and returns the first broken one as an error with its validity
 * state (`tooShort`, `tooLong` or `patternMismatch`), or `null`. Lengths count code points unless
 * the rules count otherwise.
 */
export function validateString(
  value: string,
  rules: StringRules,
  messages: StringRuleMessages,
): FieldIssue | null {
  const text = rules.trim ? value.trim() : value;
  if (text === '') return null;
  const length = (rules.getLength ?? countCodePoints)(text);
  if (rules.minLength !== undefined && length < rules.minLength) {
    return error(messages.tooShort(rules.minLength), 'tooShort');
  }
  if (rules.maxLength !== undefined && length > rules.maxLength) {
    return error(messages.tooLong(rules.maxLength), 'tooLong');
  }
  if (rules.pattern && !matchesWhole(rules.pattern, text)) {
    return error(messages.patternMismatch, 'patternMismatch');
  }
  return null;
}
