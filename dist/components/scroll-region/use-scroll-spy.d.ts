import { type RefObject } from 'react';
export interface ScrollSpyOptions {
    /** The ids of the sections to follow, in document order. */
    ids: readonly string[];
    /** How far below the viewport's top a section's top must reach to become current, in pixels. */
    offset?: number | undefined;
}
/**
 * The current section of a scrolled viewport: the last of `ids` whose top has reached `offset` below
 * the viewport's top, the first before any has, and the last once the viewport is scrolled to its
 * end. Ids without an element are skipped.
 */
export declare function resolveScrollSpy(viewport: HTMLElement, { ids, offset }: ScrollSpyOptions): string | undefined;
/**
 * Follows which of the sections `ids` is current in a scrolling viewport, such as a `ScrollRegion`'s
 * (its `ref`), for a table of contents to mark. It updates as the viewport scrolls or resizes, and
 * when the ids change.
 */
export declare function useScrollSpy(viewport: RefObject<HTMLElement | null>, { ids, offset }: ScrollSpyOptions): string | undefined;
//# sourceMappingURL=use-scroll-spy.d.ts.map