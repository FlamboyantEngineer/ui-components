import type { CodeSearchModel } from './use-code-search.js';
export interface CodeSearchPanelProps {
    model: CodeSearchModel;
    /** A read-only or disabled editor finds but does not replace. */
    canReplace: boolean;
}
/**
 * The find and replace row of a code editor, a Find Bar: the find box and its match count, previous
 * and next match, and in an editable editor the replacement with Replace and Replace all. Escape or
 * Close closes the row.
 */
export declare function CodeSearchPanel({ model, canReplace }: CodeSearchPanelProps): import("react").JSX.Element;
//# sourceMappingURL=code-search.d.ts.map