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
    /**
     * Counts a text's length for `minLength` and `maxLength`. Defaults to counting code points; pass
     * a grapheme counter so that a combined emoji counts once.
     */
    getLength?: ((text: string) => number) | undefined;
}
/** The provider strings the rules report with. */
export type StringRuleMessages = Pick<UiStrings, 'tooShort' | 'tooLong' | 'patternMismatch'>;
/** A text's length in code points, so a single emoji counts once. */
export declare function countCodePoints(text: string): number;
/**
 * Checks a text against its rules and returns the first broken one as an error with its validity
 * state (`tooShort`, `tooLong` or `patternMismatch`), or `null`. Lengths count code points unless
 * the rules count otherwise.
 */
export declare function validateString(value: string, rules: StringRules, messages: StringRuleMessages): FieldIssue | null;
//# sourceMappingURL=string-rules.d.ts.map