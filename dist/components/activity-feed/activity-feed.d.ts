import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, NativeProps } from '../../core/props.js';
import { type AvatarIdentity } from '../avatar/avatar.js';
import { type IconSource } from '../icon/icon.js';
import { type LoadMoreProps } from '../load-more/load-more.js';
import { type RelativeTimeProps } from '../relative-time/relative-time.js';
import { type HeadingLevel } from '../section-header/section-header.js';
/** One event: who did what to what, and when. */
export interface ActivityFeedItem {
    /** Identifies the entry. */
    id: Key;
    /** Who did it. */
    person?: AvatarIdentity | undefined;
    /** What they did: a verb phrase such as `commented on` or `changed the status of`. */
    action: ReactNode;
    /** What they did it to. */
    target?: ReactNode;
    /** When it happened: an ISO 8601 date or date and time. */
    time: string;
    /** More about the event under its summary: a comment, a `ChangeList`, attachments. */
    detail?: ReactNode;
    /** A glyph in the entry's marker instead of the person's avatar. */
    icon?: IconSource;
}
/** `day` groups entries under a heading per calendar day; `none` lists them without headings. */
export type ActivityFeedGrouping = 'day' | 'none';
export interface ActivityFeedProps extends BaseProps, AriaLabellingProps, Pick<NativeProps<'div'>, 'ref'>, Pick<RelativeTimeProps, 'fallbackAfterDays' | 'getNow'> {
    /** The events, in the order to show them (usually newest first). */
    items: readonly ActivityFeedItem[];
    /** How entries are grouped. Defaults to `day`. */
    groupBy?: ActivityFeedGrouping | undefined;
    /** The level of the day headings. Defaults to one below the enclosing section's, else 3. */
    headingLevel?: HeadingLevel | undefined;
    /** Controls above the feed that choose which events it shows, such as a `SegmentedChoice`. */
    filter?: ReactNode;
    /** Requests older events when the end of the feed comes into view. Omit when there are no more. */
    onLoadMore?: LoadMoreProps['onLoadMore'];
    /** Events are loading: the feed is busy and its load-more control pending. */
    isLoading?: boolean | undefined;
    /** Draws the feed while it has no entries and is not loading. */
    renderEmptyState?: (() => ReactNode) | undefined;
}
/**
 * A chronological feed of events (who did what to what, and when, with optional detail), grouped
 * under a heading per day, with a filter slot, loading of older events as the end comes into view,
 * and an empty state.
 */
export declare function ActivityFeed({ items, groupBy, headingLevel, filter, onLoadMore, isLoading, renderEmptyState, fallbackAfterDays, getNow, className, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-details': ariaDetails, ...rest }: ActivityFeedProps): import("react").JSX.Element;
//# sourceMappingURL=activity-feed.d.ts.map