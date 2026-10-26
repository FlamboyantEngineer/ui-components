import { type RevealAlignment } from './transcript-geometry.js';
/** Where the view is held: at the bottom, on the anchored message, or where the reader left it. */
export type TranscriptHold = 'bottom' | 'anchor' | 'free';
/** The first message in view and how far below the viewport's top it sits. */
export interface ScrollSnapshot {
    key: string;
    offset: number;
}
/** The elements the keeper measures, read when it needs them. */
export interface ScrollKeeperSources {
    viewport(): HTMLElement | null;
    spacer(): HTMLElement | null;
    element(key: string): HTMLElement | null;
    /** The mounted messages, oldest first. */
    mounted(): {
        keys: readonly string[];
        elements: readonly HTMLElement[];
    };
}
/** Keeps the transcript's scroll position where the reader expects it as content changes. */
export interface ScrollKeeper {
    hold(): TranscriptHold;
    anchorKey(): string | null;
    /** The first message in view, as last read. */
    snapshot(): ScrollSnapshot | null;
    /** Re-applies the hold after the content or the viewport changed. */
    settle(): void;
    /** Reads the hold back from the scroll position after the reader or the keeper scrolled. */
    classify(): void;
    /** Holds the view at the bottom, following new content. */
    holdBottom(): void;
    /** Anchors a message at the top of the view while what follows it fills in below. */
    anchor(key: string | null): void;
    /** Scrolls an element into view and holds the view where that leaves it. */
    reveal(element: Element, align: RevealAlignment): void;
    /** Starts over at the bottom, for another conversation. */
    reset(): void;
}
/**
 * Creates the keeper. Held at the bottom it follows new content; anchored, it keeps the anchored
 * message at the top, sizing the spacer after the messages so the scroll range reaches that far;
 * left free, it keeps the first message in view where it was, so content added or resized above
 * (older history, a message that grew) never moves what the reader is looking at.
 */
export declare function createScrollKeeper(sources: ScrollKeeperSources): ScrollKeeper;
//# sourceMappingURL=transcript-scroll.d.ts.map