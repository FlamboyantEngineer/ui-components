import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, NativeProps, SortDirection, Tone } from '../../core/props.js';
import { type AttributionProps } from '../attribution/attribution.js';
import type { AvatarIdentity } from '../avatar/avatar.js';
/** A state in the history: its name in a toned badge. */
export interface StateTimelineState {
    /** Identifies the entry. */
    id: Key;
    /** The state's name. */
    label: ReactNode;
    /** The badge's tone. Defaults to `neutral`. */
    tone?: Tone | undefined;
}
/** A change into a state: who made it, when, and why. */
export interface StateTimelineEntry extends StateTimelineState {
    /** When the state was entered: an ISO 8601 date or date and time. */
    time?: string | null | undefined;
    /** Who moved it into the state. */
    person?: AvatarIdentity | undefined;
    /** A note left with the change. */
    comment?: ReactNode;
}
export interface StateTimelineProps extends BaseProps, AriaLabellingProps, Pick<NativeProps<'ol'>, 'ref'>, Pick<AttributionProps, 'showAvatar' | 'fallbackAfterDays' | 'getNow'> {
    /** The state changes, oldest first; the last one is the current state. */
    entries: readonly StateTimelineEntry[];
    /** States not reached yet, in the order they would come. */
    upcoming?: readonly StateTimelineState[] | undefined;
    /** `ascending` (the default) lists the oldest change first, `descending` the newest. */
    direction?: SortDirection | undefined;
}
/**
 * A vertical history of the states something went through: each change's state badge, who made it
 * and when, and an optional comment, with the current state marked and the states still to come.
 */
export declare function StateTimeline({ entries, upcoming, direction, showAvatar, fallbackAfterDays, getNow, className, ...rest }: StateTimelineProps): import("react").JSX.Element;
//# sourceMappingURL=state-timeline.d.ts.map