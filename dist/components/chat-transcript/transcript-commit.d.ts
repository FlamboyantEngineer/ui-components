import { type RevealTarget, type TranscriptRuntime, type TranscriptSettings } from './transcript-runtime.js';
/** Announces a message that arrived, or that finished streaming. */
export declare function announceMessage(runtime: TranscriptRuntime, settings: TranscriptSettings, key: string): void;
/**
 * Handles what arrived: the reader's own message brings the view to it (anchored at the top in
 * anchor mode, else following the bottom); messages from others are announced, a streaming one
 * once it completes.
 */
export declare function applyArrivals(runtime: TranscriptRuntime, settings: TranscriptSettings, arrivals: readonly string[]): void;
/** Counts the messages from others that arrived below the view. */
export declare function countUnseen(runtime: TranscriptRuntime, arrivals: readonly string[]): void;
/** Announces loading older messages, and how many arrived once they do. */
export declare function noteOlder(runtime: TranscriptRuntime, settings: TranscriptSettings, older: readonly string[]): void;
/**
 * Brings a message into view and focuses it. A message the virtualized window left unmounted
 * mounts first, then comes into view after that commit.
 */
export declare function focusMessage(runtime: TranscriptRuntime, settings: TranscriptSettings, target: RevealTarget): void;
/**
 * Scrolls to a newly highlighted message once it is among the children, and focuses it unless the
 * reader is typing in a field outside the transcript, such as a find box.
 */
export declare function applyHighlight(runtime: TranscriptRuntime, settings: TranscriptSettings): void;
//# sourceMappingURL=transcript-commit.d.ts.map