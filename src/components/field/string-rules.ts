import type { UiStrings } from '../../core/strings.js';
import type { FieldIssue } from './field-state.js';

/** Rules for a text value. An empty text passes them all; a required field reports it instead. */
export interface StringRules {
  minLength?: number | undefined;
  maxLength?: number | undefined;
  /** A format the whole text must match. */
  pattern?: RegExp | undefined;
  /** Check the text without its leading and trailing whitespace. */
  trim?: boolean | undefined;
}

/** The provider strings the rules report with. */
export type StringRuleMessages = Pick<UiStrings, 'tooShort' | 'tooLong' | 'patternMismatch'>;

function error(message: string): FieldIssue {
  return { severity: 'error', message };
}

/**
 * Checks a text against its rules and returns the first broken one as an error, or `null`. Lengths
 * count characters (code points), so an emoji counts once.
 */
export function validateString(
  value: string,
  rules: StringRules,
  messages: StringRuleMessages,
): FieldIssue | null {
  const text = rules.trim ? value.trim() : value;
  if (text === '') return null;
  const length = [...text].length;
  if (rules.minLength !== undefined && length < rules.minLength) {
    return error(messages.tooShort(rules.minLength));
  }
  if (rules.maxLength !== undefined && length > rules.maxLength) {
    return error(messages.tooLong(rules.maxLength));
  }
  if (
    rules.pattern &&
    !new RegExp(`^(?:${rules.pattern.source})$`, rules.pattern.flags).test(text)
  ) {
    return error(messages.patternMismatch);
  }
  return null;
}
