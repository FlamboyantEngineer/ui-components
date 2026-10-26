import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { UiStrings } from '../../core/strings.js';
import type { TranscriptAnnouncer } from './transcript-announcer.js';
import type { RevealAlignment } from './transcript-geometry.js';
import { type TranscriptRegistry } from './transcript-registry.js';
import { type ScrollKeeper } from './transcript-scroll.js';
import { type TabbablesManager } from './transcript-tabbables.js';
import { type WindowModel, type WindowRange } from './transcript-window.js';
/** `follow` keeps the latest message in view; `anchor` keeps the reader's sent message at the top. */
export type ChatTranscriptScrollMode = 'follow' | 'anchor';
/** What the transcript draws around its messages. */
export interface TranscriptUi {
    /** The reader scrolled away from the bottom. */
    isAway: boolean;
    /** Messages that arrived out of view since the reader scrolled away. */
    unseenCount: number;
    /** The first unread message is above the view. */
    isUnreadAbove: boolean;
}
/** The transcript's latest props and the React setters its runtime calls. */
export interface TranscriptSettings {
    scrollMode: ChatTranscriptScrollMode;
    virtualized: boolean;
    hasOlder: boolean;
    isLoadingOlder: boolean;
    onLoadOlder?: (() => void) | undefined;
    highlightedMessageId?: string | undefined;
    firstUnreadId?: string | undefined;
    onRead?: ((lastSeenId: string) => void) | undefined;
    onEscape?: (() => void) | undefined;
    strings: UiStrings;
    announcer: TranscriptAnnouncer;
    setUi: Dispatch<SetStateAction<TranscriptUi>>;
    setRange: Dispatch<SetStateAction<WindowRange | null>>;
    /** Renders again, for a focus target that has to mount first. */
    requestRender: () => void;
}
/** The transcript's long-lived state, outside React: elements, scroll keeping and bookkeeping. */
/** A message to bring into view; `focus: false` leaves focus where it is. */
export interface RevealTarget {
    key: string;
    align: RevealAlignment;
    focus?: boolean | undefined;
}
export interface TranscriptRuntime {
    registry: TranscriptRegistry;
    keeper: ScrollKeeper;
    windowModel: WindowModel;
    tabbables: TabbablesManager;
    viewport: RefObject<HTMLDivElement | null>;
    feed: RefObject<HTMLDivElement | null>;
    spacer: RefObject<HTMLDivElement | null>;
    /** The children's keys at the last commit; `null` before the first. */
    keys: string[] | null;
    indexOf: ReadonlyMap<string, number>;
    /** The keys of the children mounted at the last commit, in order. */
    mountedItems: readonly string[];
    /** The mounted messages, oldest first. */
    mounted: {
        keys: string[];
        elements: HTMLElement[];
    };
    /** Children mounted at least once, so a child that never registered is known not to be a message. */
    seen: Set<string>;
    activeKey: string | null;
    pendingFocus: RevealTarget | null;
    /** Arrivals out of view since the reader scrolled away. */
    unseen: Set<string>;
    /** Arrivals still streaming, announced once they complete. */
    streaming: Set<string>;
    olderRequested: boolean;
    wasLoadingOlder: boolean;
    handledHighlight: string | null;
    readKey: string | null;
    reportedKey: string | null;
    timers: Map<'read' | 'page', ReturnType<typeof setTimeout>>;
    isPaging: boolean;
}
/** Creates the runtime once per transcript. */
export declare function createTranscriptRuntime(): TranscriptRuntime;
/** Whether a child is a message: it registered as one, or it never mounted to say otherwise. */
export declare function isTranscriptMessage(runtime: TranscriptRuntime, key: string): boolean;
/** Every message's key, oldest first. */
export declare function listMessageKeys(runtime: TranscriptRuntime): string[];
/** The newest message's key. */
export declare function findLastMessageKey(runtime: TranscriptRuntime): string | null;
/** Re-reads which messages are mounted, after a commit. */
export declare function refreshMounted(runtime: TranscriptRuntime): void;
/** The child key of a message id the host names, if any. */
export declare function resolveMessageKey(runtime: TranscriptRuntime, id: string | undefined): string | undefined;
/** Publishes the tab stop, positions and highlight each message reads. */
export declare function publishView(runtime: TranscriptRuntime, settings: TranscriptSettings): void;
/** The text a message announces without a summary: its content's text, whitespace collapsed. */
export declare function readMessageText(element: HTMLElement | null): string;
/** Starts over for another conversation. */
export declare function resetConversation(runtime: TranscriptRuntime): void;
//# sourceMappingURL=transcript-runtime.d.ts.map