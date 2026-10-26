import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type AvatarIdentity } from '../avatar/avatar.js';
import { type RelativeTimeProps } from '../relative-time/relative-time.js';
import { type UserCardTriggerType } from '../user-card/user-card.js';
export interface AttributionProps extends BaseProps, Pick<RelativeTimeProps, 'fallbackAfterDays' | 'getNow'> {
    /** When it happened: an ISO 8601 date or date and time. */
    time: string | null | undefined;
    /** Who did it. */
    person?: AvatarIdentity | undefined;
    /**
     * The sentence, with `{time}` and `{person}` tokens (`Edited {time} by {person}`). Defaults to the
     * provider's `attribution` string with a person and to `{time}` alone without one.
     */
    template?: string | undefined;
    /** Draws the person's avatar before their name. */
    showAvatar?: boolean | undefined;
    /** A card about the person, usually a `UserCard`, that their name opens. */
    card?: ReactNode;
    /** How `card` opens: on press (the default), or on hover and keyboard focus after a delay. */
    cardTrigger?: UserCardTriggerType | undefined;
}
/**
 * Who did something and when, as one sentence (`Edited 5 minutes ago by Maria Santos`): literal text
 * from a template, a live `RelativeTime` and the person's name, which can open their card.
 */
export declare function Attribution({ time, person, template, showAvatar, card, cardTrigger, fallbackAfterDays, getNow, className, ...rest }: AttributionProps): import("react").JSX.Element;
//# sourceMappingURL=attribution.d.ts.map