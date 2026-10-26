import { type ReactNode, type RefObject } from 'react';
import type { AriaLabellingProps, ExpansionProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type FormatOutlineNumberOptions } from '../../utils/outline-number.js';
import { type OutlineHeading } from './outline-tree.js';
export type { OutlineHeading } from './outline-tree.js';
export interface OutlineProps extends BaseProps, AriaLabellingProps, ExpansionProps {
    /** The document's headings in document order. */
    headings: readonly OutlineHeading[];
    /** The id of the current heading (controlled); `null` marks none. Overrides scroll tracking. */
    currentId?: string | null | undefined;
    /** The scrolling viewport that holds the headings; the outline marks the heading read there. */
    viewportRef?: RefObject<HTMLElement | null> | undefined;
    /** How far below the viewport's top a heading must reach to become current, in pixels. */
    trackingOffset?: number | undefined;
    /** Called with a heading's id when the reader follows its entry, before it scrolls into view. */
    onNavigate?: ((id: string) => void) | undefined;
    /** Entries at this heading level or deeper start collapsed. Defaults to none. */
    collapseBelowLevel?: number | undefined;
    /** Numbers the entries by their place in the outline (1, 1.1, 1.2). */
    isNumbered?: boolean | undefined;
    /** How numbers are written, for `formatOutlineNumber`. */
    numberOptions?: FormatOutlineNumberOptions | undefined;
    /** Headings are loading: publishes `aria-busy`, and an empty outline shows a loading notice. */
    isPending?: boolean | undefined;
    /** The notice an empty outline shows when it is not loading. Without it the outline shows nothing. */
    emptyMessage?: ReactNode;
}
/**
 * A document outline: a navigation landmark with the document's headings as nested links. It marks
 * the heading being read, follows the scroll of a viewport, scrolls to a heading when its entry is
 * followed, collapses and expands sections, and can number its entries.
 */
export declare function Outline(props: OutlineProps): import("react").JSX.Element;
//# sourceMappingURL=outline.d.ts.map