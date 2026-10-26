import { type TranscriptRuntime, type TranscriptSettings } from './transcript-runtime.js';
/** How long the newest message in view must stay the newest before `onRead` hears of it. */
export declare const READ_DELAY = 500;
/** How long scrolling must pause after Page Up or Page Down before focus follows. */
export declare const PAGE_SETTLE_DELAY = 150;
/** Notes a message the reader has seen; `onRead` hears of the newest once it settles. */
export declare function noteSeen(runtime: TranscriptRuntime, settings: TranscriptSettings, key: string): void;
/** Brings everything that depends on the scroll position up to date. */
export declare function syncWithScroll(runtime: TranscriptRuntime, settings: TranscriptSettings): void;
/** After Page Up or Page Down scrolled the view natively, focuses the message now at the top. */
export declare function focusAfterPaging(runtime: TranscriptRuntime): void;
//# sourceMappingURL=transcript-sync.d.ts.map