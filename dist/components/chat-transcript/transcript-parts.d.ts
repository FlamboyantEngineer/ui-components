import { type ReactNode } from 'react';
import type { TranscriptItem } from './transcript-items.js';
import type { WindowModel } from './transcript-window.js';
/**
 * The children to draw: every one, or with virtualization the mounted ones, with a spacer as tall
 * as each run of unmounted children between them.
 */
export declare function renderTranscriptItems(items: readonly TranscriptItem[], mounted: readonly number[] | null, model: WindowModel): ReactNode[];
/** The control shown while the reader is away from the bottom, counting what arrived meanwhile. */
export declare function TranscriptJumpButton({ unseenCount, onJump, }: {
    unseenCount: number;
    onJump: () => void;
}): import("react").JSX.Element;
/** The bar shown while the first unread message is above the view, with a control to jump to it. */
export declare function TranscriptUnreadBar({ count, onJump }: {
    count: number;
    onJump: () => void;
}): import("react").JSX.Element;
/**
 * The place above the messages while older ones remain, holding the indicator while they load. It
 * stays while older messages remain, so the indicator appearing never moves the messages.
 */
export declare function TranscriptHistory({ isLoading }: {
    isLoading: boolean;
}): import("react").JSX.Element;
//# sourceMappingURL=transcript-parts.d.ts.map