import { type ReactNode } from 'react';
import type { Key } from '../../core/props.js';
export interface VisibleCollectionProps {
    /** The keys of the items to render; `null` renders every item. */
    keys: ReadonlySet<Key> | null;
    /** The library collection component whose items it filters (a tab list, a breadcrumb trail). */
    children: ReactNode;
}
/**
 * Renders only some top-level items of the collection component inside it (a tab list,
 * a breadcrumb trail) while keeping every item in its collection, so selection, panels and keyboard
 * navigation still know the hidden ones. Pair it with `useOverflowItems`: the same commit renders
 * the visible items, so the row measures what it shows.
 */
export declare function VisibleCollection({ keys, children }: VisibleCollectionProps): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
//# sourceMappingURL=visible-collection.d.ts.map