import { type ReactNode } from 'react';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { type HeadingLevel } from '../section-header/section-header.js';
import { type CardActionOptions } from './card-action.js';
/** `default`: content on the page. `panel`: a chrome region on a muted surface. */
export type CardVariant = 'default' | 'panel';
/** `default` keeps each part's own inset; the others give the card one interior padding. */
export type CardDensity = 'default' | 'comfortable' | 'compact' | 'tight';
export interface CardProps extends BaseProps, CardActionOptions, Pick<NativeProps<'section'>, 'hidden' | 'role' | 'aria-label' | 'aria-labelledby'> {
    /** Surface. Defaults to `default`. */
    variant?: CardVariant | undefined;
    /** Interior padding. Defaults to `default`. */
    density?: CardDensity | undefined;
    /** The heading. A titled card is a region named by its title. */
    title?: ReactNode;
    /** Supporting text under the title. */
    description?: ReactNode;
    /** Trailing controls or status in the header. */
    actions?: ReactNode;
    /** The title's heading level. Defaults to one below the enclosing section's, else 3. */
    headingLevel?: HeadingLevel | undefined;
    /**
     * Custom header content, in place of the title, description and actions. A `CardTitle` in it is
     * the card's title and names the card, and a `CardAction` is the card's action.
     */
    header?: ReactNode;
    /** Full-bleed media before the header, such as a cover image or a preview. */
    media?: ReactNode;
    /** The content is loading: the body shows a decorative skeleton and the card is busy. */
    isLoading?: boolean | undefined;
    /** The body. */
    children?: ReactNode;
    /** Closing content, such as a timestamp or secondary actions, in a `<footer>`. */
    footer?: ReactNode;
    /** The card is the current one, such as a selected record. */
    isSelected?: boolean | undefined;
    /** The card answers to a pointer (it sits inside a link or button); publishes `data-interactive`. */
    interactive?: boolean | undefined;
    /** Set into a surrounding frame rather than on the page. */
    flush?: boolean | undefined;
    /** The body is a canvas that grows to the card's height and owns its interior. */
    fill?: boolean | undefined;
    /** Take the full width of the container. */
    fullWidth?: boolean | undefined;
}
/**
 * A framed container for a self-contained group of content: optional media, an optional header, a
 * body and a footer. With `href` or `onAction` the whole card is a link or press target whose title
 * is the action, while the controls inside it keep their own behaviour.
 */
export declare function Card({ variant, density, title, description, actions, headingLevel, header, media, children, footer, isSelected, isLoading, interactive, flush, fill, fullWidth, href, target, rel, onAction, className, ...rest }: CardProps): import("react").JSX.Element;
//# sourceMappingURL=card.d.ts.map