import type { ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
/** The assistant is `thinking` (or acting), or `writing` its answer. */
export type ChatStatusLineActivity = 'thinking' | 'writing';
export interface ChatStatusLineProps extends BaseProps {
    /** What the assistant is doing now, such as "Searching trains…". Defaults to "Thinking…". */
    text?: string | undefined;
    /** A decorative icon in place of the busy indicator. */
    icon?: ReactNode;
    /** `writing` shows the indicator alone, without text or announcement. Defaults to `thinking`. */
    activity?: ChatStatusLineActivity | undefined;
    /** The assistant is working; without it the line is gone. Defaults to `true`. */
    isRunning?: boolean | undefined;
}
/**
 * One line saying what an assistant is doing while it works ("Thinking…" unless told otherwise),
 * with a decorative busy indicator or the caller's icon; while it writes, the indicator alone. Its
 * text is announced politely as it changes, at most once every two seconds; the visible text stays
 * out of the accessibility tree so the reader hears it once. The line is gone once the work ends.
 */
export declare function ChatStatusLine({ text, icon, activity, isRunning, className, ...rest }: ChatStatusLineProps): import("react").JSX.Element | null;
//# sourceMappingURL=chat-status-line.d.ts.map