import type { UiStrings } from '../../core/strings.js';
import type { FieldIssue } from '../field/field.js';
/** What a field accepts as a new tag. */
export interface TagRules {
    /** The characters that end a tag, besides a pasted line break. */
    delimiters: readonly string[];
    /** The most tags the field holds, or none. */
    maxValues: number | undefined;
    /** Accepts a tag equal to one the field already holds. */
    allowsDuplicates: boolean;
    /** The caller's check: a message refuses the tag. */
    validateTag: ((tag: string) => string | null | undefined) | undefined;
    strings: UiStrings;
}
/** The outcome of entering text: the tags it adds and what stays in the input. */
export interface TagEntry {
    added: string[];
    /** The text left in the input: the refused tags, then what follows the last delimiter. */
    inputValue: string;
    /** The first tag the field refused, or `null` when it refused none. */
    rejected: string | null;
}
/** Splits text at each delimiter and line break. */
export declare function splitTagText(text: string, delimiters: readonly string[]): string[];
/** Whether the text holds a delimiter or a line break. */
export declare function hasTagDelimiter(text: string, delimiters: readonly string[]): boolean;
export declare function checkTag(tag: string, value: readonly string[], rules: TagRules): FieldIssue | null;
/**
 * Turns entered text into tags, trimmed, skipping empty ones. With `keepLast` the text after the
 * last delimiter stays in the input, as it is still being typed. Refused tags stay in the input
 * too, ahead of it and joined by the first delimiter, so the reader can correct them.
 */
export declare function resolveTagEntry(text: string, options: {
    keepLast: boolean;
    value: readonly string[];
    rules: TagRules;
}): TagEntry;
//# sourceMappingURL=tag-entry.d.ts.map