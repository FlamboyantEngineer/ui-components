import { type ReactNode } from 'react';
import { type TranscriptItem } from './transcript-items.js';
import type { TranscriptNavigation } from './transcript-keyboard.js';
import { type TranscriptRuntime, type TranscriptSettings, type TranscriptUi } from './transcript-runtime.js';
/** The transcript's props that drive its behaviour. */
export type TranscriptOptions = Omit<TranscriptSettings, 'strings' | 'announcer' | 'setUi' | 'setRange' | 'requestRender'> & {
    children: ReactNode;
};
/** What the transcript renders and wires up. */
export interface TranscriptModel {
    runtime: TranscriptRuntime;
    items: TranscriptItem[];
    /** The indices of the children to mount, or `null` to mount them all. */
    mounted: number[] | null;
    ui: TranscriptUi;
    unreadCount: number;
    announcement: string;
    navigation: TranscriptNavigation;
    onScroll(): void;
    jumpToLatest(): void;
    jumpToUnread(): void;
}
/** The transcript's behaviour: everything but its markup. */
export declare function useTranscript({ children, ...options }: TranscriptOptions): TranscriptModel;
//# sourceMappingURL=use-transcript.d.ts.map