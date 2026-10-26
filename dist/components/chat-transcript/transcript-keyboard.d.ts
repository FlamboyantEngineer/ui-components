import type { FocusEvent, KeyboardEvent } from 'react';
import type { RevealAlignment } from './transcript-geometry.js';
import type { TranscriptRegistry } from './transcript-registry.js';
import { type TabbablesManager } from './transcript-tabbables.js';
/** What the keyboard model needs from the transcript. */
export interface TranscriptNavigation {
    registry: TranscriptRegistry;
    tabbables: TabbablesManager;
    /** Every message's key, oldest first, mounted or not. */
    messageKeys(): readonly string[];
    /** Moves focus to a message, mounting it first when needed, and brings it into view. */
    focusMessage(key: string, align: RevealAlignment): void;
    /** The focused message's key, or `null` once focus leaves the feed. */
    onActiveChange(key: string | null): void;
    /** Native Page Up or Page Down scrolling began from a message. */
    onPage(): void;
    /** A second Escape, from a message, leaves the transcript. */
    onEscape?: (() => void) | undefined;
}
/**
 * The feed's key handler: on a message, arrows, Home and End move between messages, Enter moves
 * into it and Escape leaves the transcript; inside a message, Escape returns to the message.
 * Keys from content portalled out of the feed, such as an open menu, are left alone.
 */
export declare function handleTranscriptKeyDown(event: KeyboardEvent<HTMLElement>, nav: TranscriptNavigation): void;
/**
 * Tab and Shift+Tab inside an entered message cycle through its controls. This runs before the
 * controls' own handlers, so a composite inside (a toolbar) counts as its one tab stop.
 */
export declare function handleTranscriptTab(event: KeyboardEvent<HTMLElement>, nav: TranscriptNavigation): void;
/** Focus on a message makes it the tab stop; focus on a control inside also enters it. */
export declare function handleTranscriptFocus(event: FocusEvent<HTMLElement>, nav: TranscriptNavigation): void;
/** Focus leaving the feed takes the entered message's controls out of the tab order again. */
export declare function handleTranscriptBlur(event: FocusEvent<HTMLElement>, nav: TranscriptNavigation): void;
//# sourceMappingURL=transcript-keyboard.d.ts.map