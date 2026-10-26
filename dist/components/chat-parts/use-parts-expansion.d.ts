/** The reader's open (`true`) and closed (`false`) choices, by part id or group key. */
export type ExpandedParts = Readonly<Record<string, boolean>>;
export interface PartsExpansionOptions {
    expandedParts: ExpandedParts | undefined;
    onExpandedPartsChange: ((expandedParts: Record<string, boolean>) => void) | undefined;
}
export interface PartsExpansion {
    expanded: ExpandedParts;
    /** Records the reader's choice for one part or group. */
    setExpanded: (key: string, isExpanded: boolean) => void;
    /** Opens these parts or groups, as if the reader had opened each. */
    expand: (keys: readonly string[]) => void;
}
/** Something in a message that calls for the reader, such as a tool call that waits or failed. */
export interface PartsReveal {
    /** Names it, so it reveals once, when it arrives, and not on every render. */
    id: string;
    /** The keys of the group and part that show it, opened where the reader closed them. */
    keys: readonly string[];
    /** It also reveals when present as the parts mount, rather than only when it arrives later. */
    isRevealedOnMount: boolean;
}
/** The reader's choices: the caller's when `expandedParts` is given, else kept here. */
export declare function usePartsExpansion({ expandedParts, onExpandedPartsChange, }: PartsExpansionOptions): PartsExpansion;
/**
 * Opens the groups and parts the reader closed when something in them newly calls for the reader,
 * so it never hides in a collapsed group. They then stay open, as if the reader had opened them, so
 * they do not collapse once the run moves on or under the reader's focus once they decide; closing
 * them again holds until something else arrives. The reveals of one render open in one update, so
 * none overwrites another, and through `expand`, so a controlled record receives them.
 */
export declare function usePartsReveal(reveals: readonly PartsReveal[], expansion: PartsExpansion): void;
//# sourceMappingURL=use-parts-expansion.d.ts.map