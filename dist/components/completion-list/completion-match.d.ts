/** A completion a text control or an editor offers. */
export interface Completion {
    /** The text shown and matched, and inserted unless `insertText` says otherwise. */
    label: string;
    /** A short explanation shown beside the label. */
    description?: string | undefined;
    /** What the completion is (`keyword`, `person`, `function`, …), published as `data-kind`. */
    kind?: string | undefined;
    /** Longer documentation shown beside the list while the completion is active. */
    documentation?: string | undefined;
    /** The text inserted in place of the label, such as a stored mention token. */
    insertText?: string | undefined;
}
/**
 * How well `label` matches `query`, ignoring case: 0 when it starts with it, 1 when a word in it
 * does, more for a scattered match whose characters start at a word; `null` for no match.
 */
export declare function scoreCompletion(label: string, query: string): number | null;
/**
 * The completions matching `query`, best first and otherwise in their order: labels that start
 * with it, then labels whose words hold its characters in order. A label equal to the query is
 * left out; an empty query keeps them all.
 */
export declare function matchCompletions(completions: readonly Completion[], query: string): Completion[];
//# sourceMappingURL=completion-match.d.ts.map