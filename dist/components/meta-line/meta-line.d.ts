import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
/** A value the text form of a metadata line accepts. Blank strings, booleans and nullish values are skipped. */
export type MetaLineTextItem = string | number | boolean | null | undefined;
export interface MetaLineProps extends BaseProps {
    /** The entries, in order. Empty entries are skipped without leaving a separator. */
    items: readonly ReactNode[];
}
/** The text form of a metadata line, for tooltips, descriptions and other string-only places. */
export declare function formatMetaLine(items: readonly MetaLineTextItem[]): string;
/** One inline line of metadata entries separated by a decorative middot. */
export declare function MetaLine({ items, className, ...rest }: MetaLineProps): import("react").JSX.Element | null;
//# sourceMappingURL=meta-line.d.ts.map