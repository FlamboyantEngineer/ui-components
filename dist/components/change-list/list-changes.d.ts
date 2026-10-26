/** A list item and whether the other side of the change has it. */
export interface ListItemChange {
    value: string;
    /** `added` or `removed` when only one side has the item; `unchanged` when both do. */
    change: 'added' | 'removed' | 'unchanged';
}
/** Both sides of a list change, each item marked. */
export interface ListChanges {
    /** The old items in their order: `removed` or `unchanged`. */
    before: ListItemChange[];
    /** The new items in their order: `added` or `unchanged`. */
    after: ListItemChange[];
}
/** What happened to a property: it got a value, lost it, or its value changed. */
export type ChangeKind = 'added' | 'removed' | 'changed';
/** Whether a value is unset: nullish, an empty text or an empty list. */
export declare function isBlankValue(value: string | readonly string[] | null | undefined): boolean;
/** The kind of a change from its two values. */
export declare function resolveChangeKind(before: string | readonly string[] | null | undefined, after: string | readonly string[] | null | undefined): ChangeKind;
/**
 * Compares two lists of texts: old items the new list lacks are `removed`, new items the old list
 * lacks are `added`, and the rest `unchanged`. Each side keeps its order; repeated items match one
 * for one.
 */
export declare function compareLists(before: readonly string[], after: readonly string[]): ListChanges;
//# sourceMappingURL=list-changes.d.ts.map