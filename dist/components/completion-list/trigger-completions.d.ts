import type { Completion } from './completion-match.js';
import type { CompletionSource } from './use-completions.js';
/** A character that opens completions for the query typed after it. */
export interface CompletionTrigger {
    /** The character that starts a query, such as `@` or `#`. */
    character: string;
    /** The completions for the query typed after the character, at once or later. */
    getCompletions: (query: string) => readonly Completion[] | Promise<readonly Completion[]>;
    /** Lets the query hold spaces, as a person's full name does. */
    allowsSpaces?: boolean | undefined;
}
/**
 * A completion source for trigger characters: typing `@` (at the start or after white space) asks
 * that trigger's `getCompletions` for the query after it, and a chosen completion replaces the
 * trigger and its query with its `insertText` (or label). The answers show as given.
 */
export declare function createTriggerCompletions(triggers: readonly CompletionTrigger[]): CompletionSource;
//# sourceMappingURL=trigger-completions.d.ts.map