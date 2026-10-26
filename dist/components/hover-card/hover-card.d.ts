import type { ReactNode } from 'react';
import type { OpenStateProps, OverlayPositionProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
/** A focusable trigger and the `HoverCard` it opens on hover and focus. */
export interface HoverCardTriggerProps extends OpenStateProps {
    /** The trigger (a `Link`, `Button` or other focusable), then its `HoverCard`. */
    children: ReactNode;
    /** Milliseconds the pointer or focus rests on the trigger before the card opens. Defaults to 600. */
    delay?: number | undefined;
    /** Milliseconds after the pointer and focus leave before the card closes. Defaults to 200. */
    closeDelay?: number | undefined;
    /** Opens nothing. */
    isDisabled?: boolean | undefined;
}
export interface HoverCardProps extends BaseProps, OverlayPositionProps {
    /** Shows an arrow pointing at the trigger. */
    showArrow?: boolean | undefined;
    /** Names the card. */
    'aria-label'?: string | undefined;
    /** Names the card by another element. */
    'aria-labelledby'?: string | undefined;
    /** The card's content, which may be interactive. */
    children: ReactNode;
}
/**
 * Opens the `HoverCard` among its children `delay` milliseconds after the pointer rests on the
 * trigger (a React Aria focusable such as a `Link` or `Button`) or keyboard focus reaches it, or on a
 * long press, and closes it `closeDelay` milliseconds after both leave the trigger and the card.
 */
export declare function HoverCardTrigger({ children, ...trigger }: HoverCardTriggerProps): import("react").JSX.Element;
/**
 * A card of extra content about its trigger, shown on hover and focus without taking focus. It
 * shares the popover's positioning and arrow; Tab from the trigger moves into it and Escape closes it.
 */
export declare function HoverCard({ showArrow, className, children, ...rest }: HoverCardProps): import("react").JSX.Element;
//# sourceMappingURL=hover-card.d.ts.map