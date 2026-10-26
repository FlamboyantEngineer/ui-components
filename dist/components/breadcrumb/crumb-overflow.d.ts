import { type ReactNode, type RefCallback } from 'react';
import type { Key } from '../../core/props.js';
import type { MenuEntry } from '../menu/menu.js';
/** What the overflow logic reads of a crumb. */
export interface CrumbEntry {
    id?: Key | undefined;
    label: ReactNode;
    textValue?: string | undefined;
    href?: string | undefined;
}
export interface CrumbOverflow {
    /** The key of the overflow crumb, which sits after the first crumb while crumbs are hidden. */
    overflowKey: string;
    /** The keys to render, or `null` to render every crumb with no overflow crumb. */
    visibleKeys: ReadonlySet<Key> | null;
    /** The hidden crumbs' positions in the trail. */
    hiddenIndices: readonly number[];
    containerRef: RefCallback<HTMLElement>;
    indicatorRef: RefCallback<HTMLElement>;
}
interface OverflowCrumbProps {
    id: string;
    menuRef: RefCallback<HTMLElement>;
    items: readonly MenuEntry[];
    onAction: ((key: Key) => void) | undefined;
    isDisabled: boolean | undefined;
    separator: ReactNode;
}
/** A crumb's key: its `id`, or its index. */
export declare function toCrumbKey(item: CrumbEntry, index: number): Key;
/** A crumb's text for a menu: `textValue`, a plain-text label, or its key. */
export declare function toCrumbText(item: CrumbEntry, index: number): string;
/**
 * Which crumbs a trail collapsing into a menu keeps: the first and the current crumb, then as many
 * as fit from the current end. The others leave the trail but stay in its collection.
 */
export declare function useCrumbOverflow(items: readonly CrumbEntry[], isMenu: boolean): CrumbOverflow;
/** The crumb that stands for the hidden ones: a "more" menu of them, then a separator. */
export declare function OverflowCrumb(props: OverflowCrumbProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=crumb-overflow.d.ts.map