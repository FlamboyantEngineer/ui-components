import { type MouseEvent as ReactMouseEvent, type ReactNode, type RefCallback } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
/** What the whole card does when it is pressed: follow `href`, or run `onAction`. */
export interface CardActionOptions {
    /** Makes the card a link to this address; its title is the link. */
    href?: string | undefined;
    /** The link's target. `_blank` adds `rel="noopener noreferrer"` unless `rel` is given. */
    target?: string | undefined;
    /** The link's relationship to the current page. */
    rel?: string | undefined;
    /** Makes the card a press target; its title is the button. With `href`, runs when the link is followed. */
    onAction?: (() => void) | undefined;
}
export interface CardAction {
    /** Whether the card has an action. */
    isActionable: boolean;
    /** Receives the action element, whether the card drew it or a custom header slotted it. */
    actionRef: RefCallback<HTMLElement>;
    /** The card root's click handler that forwards stray clicks to the action. */
    onClick: (event: ReactMouseEvent<HTMLElement>) => void;
}
/** The action element the card registers, and the root click handler that forwards to it. */
export declare function useCardAction(options: CardActionOptions): CardAction;
/** What draws the card's action element. */
interface CardActionTitleProps extends AriaLabellingProps, Omit<BaseProps, 'id' | 'className'> {
    options: CardActionOptions;
    actionRef: RefCallback<HTMLElement>;
    className: string;
    children: ReactNode;
}
/**
 * The card's action element: a link through the provider's renderer, or a button. The card's title
 * draws it, and so does a `CardAction` in a custom header.
 */
export declare function CardActionTitle({ options, actionRef, className, children, ...rest }: CardActionTitleProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=card-action.d.ts.map