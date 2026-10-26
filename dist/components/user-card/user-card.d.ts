import { type ReactNode } from 'react';
import type { OpenStateProps, PressEventProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type AvatarIdentity } from '../avatar/avatar.js';
import { type HoverCardTriggerProps } from '../hover-card/hover-card.js';
import type { IconSource } from '../icon/icon.js';
import { type UserIdentityProps } from '../user-identity/user-identity.js';
/** One labelled fact about the person, such as a team or a local time. */
export interface UserCardDetail {
    /** What the fact is, such as `Team`. */
    label: ReactNode;
    /** The fact itself. */
    value: ReactNode;
}
/** A command the card offers, such as sending a message or opening a profile. */
export interface UserCardAction {
    /** Reported to `onAction`. */
    id: string;
    /** The button's text. */
    label: string;
    /** A glyph name or icon node drawn before the label. */
    icon?: IconSource | undefined;
}
export interface UserCardProps extends AvatarIdentity, Pick<UserIdentityProps, 'description' | 'colorCount'>, BaseProps {
    /** Names the card instead of the display name. */
    'aria-label'?: string | undefined;
    /** What the person is doing, as any word the host stylesheet knows (`active`, `away`, …). */
    status?: string | undefined;
    /** Human-readable status, shown in the status row. */
    statusLabel?: string | undefined;
    /** Labelled facts about the person, shown as description rows. */
    details?: readonly UserCardDetail[] | undefined;
    /** Commands the card offers, shown as buttons. */
    actions?: readonly UserCardAction[] | undefined;
    /** Called with an action's `id` when it is pressed. Inside a card trigger, the card closes first. */
    onAction?: ((id: string) => void) | undefined;
    /** The profile is loading: the status, details and actions give way to a decorative skeleton. */
    isLoading?: boolean | undefined;
}
/** `press` opens the card on a click, Enter or Space; `hover` on hover, keyboard focus or long press. */
export type UserCardTriggerType = 'press' | 'hover';
export interface UserCardTriggerProps extends OpenStateProps, Pick<HoverCardTriggerProps, 'delay' | 'closeDelay'>, PressEventProps, BaseProps {
    /** Opens nothing and refuses presses. */
    isDisabled?: boolean | undefined;
    /** The card to open, usually a `UserCard`. */
    card: ReactNode;
    /** What the trigger shows: an avatar, a name or a user identity row. */
    children: ReactNode;
    /**
     * `press` (the default) opens the card on a click, Enter or Space. `hover` opens it `delay`
     * milliseconds after hover or keyboard focus, or on a long press, without moving focus, and closes
     * it `closeDelay` milliseconds after the pointer and focus leave; pressing then runs `onPress` only.
     */
    trigger?: UserCardTriggerType | undefined;
}
/**
 * The identity card of a person or group: avatar, name, a secondary line, an optional status row,
 * detail rows and actions. A dialog named by the person, usually opened by a `UserCardTrigger`.
 */
export declare function UserCard(props: UserCardProps): import("react").JSX.Element;
/**
 * Makes its content (an avatar, a name, a user identity row) a button that opens `card` in a
 * popover on the `dropdown` layer, on press or, with `trigger="hover"`, in a `HoverCard` on hover and
 * keyboard focus. Escape and the card's actions close it, returning focus to the trigger.
 */
export declare function UserCardTrigger({ card, children, trigger, isOpen, defaultOpen, onOpenChange, delay, closeDelay, className, ...rest }: UserCardTriggerProps): import("react").JSX.Element;
//# sourceMappingURL=user-card.d.ts.map