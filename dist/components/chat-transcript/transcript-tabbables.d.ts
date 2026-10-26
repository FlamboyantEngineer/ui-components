import type { TranscriptRegistry } from './transcript-registry.js';
/** A message's element and key. */
export interface TranscriptOwner {
    key: string;
    element: HTMLElement;
}
/** Keeps the controls inside messages out of the tab order, except in the message entered. */
export interface TabbablesManager {
    /** The message whose controls are in the tab order. */
    entered(): string | null;
    /** Puts one message's controls in the tab order and takes the previous one's out. */
    enter(key: string | null): void;
    /** Takes every mounted message's controls out of the tab order, then keeps up with changes. */
    observe(feed: HTMLElement): () => void;
}
/** The message an element sits in (or is), searching up to the feed. */
export declare function findOwner(node: Element | null, feed: Element, registry: TranscriptRegistry): TranscriptOwner | null;
/** The controls inside a message that Tab reaches, in document order. */
export declare function listTabbable(root: Element): HTMLElement[];
/**
 * Creates the manager. Each control it takes out of the tab order keeps its own `tabindex`, which
 * comes back when the reader enters the message; a control that renders or changes its `tabindex`
 * later is taken out again, so the transcript stays one tab stop.
 */
export declare function createTabbablesManager(registry: TranscriptRegistry): TabbablesManager;
//# sourceMappingURL=transcript-tabbables.d.ts.map