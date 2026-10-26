import { type ReactNode } from 'react';
/** One child of the transcript: a message, or a part between messages such as a separator. */
export interface TranscriptItem {
    /** The child's `id`, else its React key, else its position: how the transcript finds it. */
    key: string;
    node: ReactNode;
}
/** What changed in the children since the last commit. */
export interface TranscriptChange {
    /** Nothing survived (or nothing was there before the first commit): a fresh conversation. */
    isReset: boolean;
    /** Keys added after the first surviving one: what arrived. */
    arrivals: string[];
    /** Keys added before every surviving one: older history. */
    older: string[];
}
/** The transcript's children, flattened, each with a key unique among them. */
export declare function collectTranscriptItems(children: ReactNode): TranscriptItem[];
/** Sorts the keys that are new since `previous` into arrivals and older history. */
export declare function diffTranscriptKeys(previous: readonly string[] | null, next: readonly string[]): TranscriptChange;
//# sourceMappingURL=transcript-items.d.ts.map