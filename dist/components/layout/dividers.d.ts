import { type ReactNode } from 'react';
import type { LayoutElement } from './layout.js';
/** The element of a divider that is valid between the children of `parent`. */
export declare function resolveDividerElement(parent: LayoutElement): 'li' | 'span' | 'div';
/**
 * The rendered children of a layout primitive with a decorative divider, hidden from assistive
 * technology, between each pair. Children that are `null`, `undefined`, booleans or empty strings
 * get no divider; components are not rendered to find out whether they draw anything.
 */
export declare function interleaveDividers(children: ReactNode, { parent, className }: {
    parent: LayoutElement;
    className: string;
}): ReactNode[];
//# sourceMappingURL=dividers.d.ts.map