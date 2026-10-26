import { type ReactNode, type RefCallback } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type HeadingLevel } from '../section-header/section-header.js';
import { type CardActionOptions } from './card-action.js';
export interface CardTitleProps extends Omit<BaseProps, 'id'> {
    /** The title's content, which names the card. */
    children?: ReactNode;
}
export interface CardActionProps extends Omit<BaseProps, 'id'>, AriaLabellingProps {
    /** The action's content, usually the title text. */
    children?: ReactNode;
}
/** What a card hands the title and action parts of its custom header. */
export interface CardHeaderParts {
    title: {
        id: string;
        className: string;
        level: HeadingLevel;
        /** Tells the card that its custom header drew a title. */
        ref: RefCallback<HTMLElement>;
    };
    action: {
        options: CardActionOptions;
        isActionable: boolean;
        className: string;
        ref: RefCallback<HTMLElement>;
    };
}
/** The parts of the card whose custom header is being drawn; `null` outside one. */
export declare const CardHeaderContext: import("react").Context<CardHeaderParts | null>;
/**
 * The title of a card's custom header: a heading at the card's level with the card's title id and
 * hook class, which names the card. Outside a custom header it is a plain heading.
 */
export declare function CardTitle({ children, className, ...rest }: CardTitleProps): import("react").JSX.Element;
/**
 * The whole-card action in a card's custom header: the card's link (`href`) or button (`onAction`)
 * with the action hook class, which clicks anywhere on the card activate. Without a card action it
 * renders its children as they are.
 */
export declare function CardAction({ children, className, ...rest }: CardActionProps): import("react").JSX.Element;
//# sourceMappingURL=card-parts.d.ts.map