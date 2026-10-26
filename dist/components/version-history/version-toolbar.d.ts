import type { VersionHistoryFilter } from './version-model.js';
export interface VersionToolbarProps {
    /** The filters, or `null` to leave them out. */
    filter: VersionHistoryFilter | null;
    onFilterChange: (filter: VersionHistoryFilter) => void;
    /** The people the person filter offers. */
    people: readonly string[];
    /** Runs the comparison, or `null` to leave the compare action out. */
    onCompare: (() => void) | null;
    /** Whether two versions are selected, so the compare action can run. */
    canCompare: boolean;
}
/** The filters (named versions only, and by person) and the compare action, when shown. */
export declare function VersionToolbar({ filter, onFilterChange, people, onCompare, canCompare, }: VersionToolbarProps): import("react").JSX.Element;
//# sourceMappingURL=version-toolbar.d.ts.map