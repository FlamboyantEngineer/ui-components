export interface TabCountProps {
    id: string;
    count: number;
    countMax: number;
    countLabel: string | undefined;
}
/** A tab's shown count, and the hidden description that gives the full count. */
export declare function TabCount({ id, count, countMax, countLabel }: TabCountProps): import("react").JSX.Element;
/**
 * The close mark of a removable tab. It takes pointer presses only, without selecting the tab;
 * keyboard users press Delete on the focused tab, which the tab announces in `aria-keyshortcuts`.
 */
export declare function TabRemoveMark({ onRemove }: {
    onRemove: () => void;
}): import("react").JSX.Element;
/** Joins element ids for an ARIA reference list. */
export declare function joinIds(...ids: Array<string | undefined>): string;
//# sourceMappingURL=tab-parts.d.ts.map