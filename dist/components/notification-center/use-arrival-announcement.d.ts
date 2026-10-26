import type { Key } from '../../core/props.js';
interface ArrivalEntry {
    id: Key;
    title: string;
    time: string;
    isRead?: boolean | undefined;
}
/** Set by a notification centre that announces arrivals itself, so the list inside stays quiet. */
export declare const ArrivalAnnouncerContext: import("react").Context<boolean>;
/**
 * The announcement of the unread entries that appeared since the last render and are newer than
 * every entry shown before: one by its title, several by their count. Entries present at first,
 * the first page of a list that started empty, older pages loaded later and entries already read
 * are never announced.
 */
export declare function useArrivalAnnouncement(items: readonly ArrivalEntry[]): string;
export {};
//# sourceMappingURL=use-arrival-announcement.d.ts.map