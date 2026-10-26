import { type RefObject } from 'react';
import type { Key } from '../core/props.js';
/** A container to keep aligned: the element, or a ref whose element is stable. */
export type SyncedScrollTarget = HTMLElement | RefObject<HTMLElement | null> | null | undefined;
/** A point of a container's content that has a match in the other containers. */
export interface ScrollAnchor {
    /** Identifies the anchor across containers. */
    key: Key;
    /** Its distance from the top of the container's content, in pixels. */
    offset: number;
}
export interface SyncedScrollOptions {
    /**
     * Reads a container's anchors in reading order. With it, containers align matched anchors;
     * without it, they align the same fraction of their scroll range.
     */
    readonly getAnchors?: ((container: HTMLElement) => readonly ScrollAnchor[]) | undefined;
    /** False stops aligning. Defaults to true. */
    readonly enabled?: boolean | undefined;
}
/**
 * Maps a scroll offset of one container onto another through the anchors both have: between two
 * matched anchors the offset moves in proportion, before the first and after the last it keeps its
 * distance from that anchor. Without a matched anchor the offset is returned unchanged.
 */
export declare function mapScrollOffset(offset: number, from: readonly ScrollAnchor[], to: readonly ScrollAnchor[]): number;
/**
 * Keeps the vertical scroll position of two or more containers aligned: scrolling one scrolls the
 * others, by the same fraction of their range or through matched anchors (`getAnchors`). Positions
 * the hook sets itself do not echo back. Targets are read after every commit.
 */
export declare function useSyncedScroll(targets: readonly SyncedScrollTarget[], options?: SyncedScrollOptions): void;
//# sourceMappingURL=use-synced-scroll.d.ts.map