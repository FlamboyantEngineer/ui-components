import type { BaseProps } from '../../core/props.js';
import { type RelativeTimeProps } from '../relative-time/relative-time.js';
export interface ChatDateSeparatorProps extends BaseProps, Pick<RelativeTimeProps, 'getNow'> {
    /**
     * The day the messages after it were written: an ISO 8601 date (`YYYY-MM-DD`), or a date and
     * time, read as the reader's local day.
     */
    date: string;
}
/**
 * Marks the day the following messages were written: `Today`, `Yesterday`, or the full date in
 * the reader's locale. It has no role, so it may sit between the articles of a feed, and its words
 * move on at midnight like any `RelativeTime`.
 */
export declare function ChatDateSeparator({ date, getNow, className, ...rest }: ChatDateSeparatorProps): import("react").JSX.Element | null;
//# sourceMappingURL=chat-date-separator.d.ts.map