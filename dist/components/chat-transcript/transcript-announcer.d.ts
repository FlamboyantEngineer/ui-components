import type { UiStrings } from '../../core/strings.js';
/** A message to announce: its author's name (`null` for a notice) and its text. */
export interface MessageAnnouncement {
    author: string | null;
    text: string;
}
/** The transcript's announcer: what its live region reads, and how to queue more. */
export interface TranscriptAnnouncer {
    text: string;
    /** Queues a new message; several within a second are announced as a count. */
    message(announcement: MessageAnnouncement): void;
    /** Queues a status, such as older messages loading. */
    notice(text: string): void;
}
/** Announcements are spaced at least this far apart, in milliseconds. */
export declare const ANNOUNCE_INTERVAL = 1000;
/**
 * Queues announcements and reads them out through one polite live region at most once a
 * second: the first right away, then what arrived meanwhile as one announcement.
 */
export declare function useTranscriptAnnouncer(strings: UiStrings): TranscriptAnnouncer;
/** The visually hidden live region the announcer reads through. */
export declare function TranscriptAnnouncerRegion({ text }: {
    text: string;
}): import("react").JSX.Element;
//# sourceMappingURL=transcript-announcer.d.ts.map