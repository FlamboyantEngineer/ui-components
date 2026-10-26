import type { JSX, ReactElement, ReactNode, Ref } from 'react';
import type { AriaLabellingProps, FocusEventProps, HoverEventProps, PressEventProps } from '../../core/events.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
/** Emphasis: `primary` takes the accent colour, `secondary` the surrounding text colour. */
export type LinkVariant = 'primary' | 'secondary';
/** When the stylesheet underlines the link. */
export type LinkUnderline = 'always' | 'hover' | 'none';
/** The states a link passes to `render` with its element's props. */
export interface LinkRenderState {
    /** The link has `aria-current`. */
    isCurrent: boolean;
    /** The pointer is over the link. */
    isHovered: boolean;
    /** The link is being pressed. */
    isPressed: boolean;
    /** The link has focus. */
    isFocused: boolean;
    /** The link has keyboard focus. */
    isFocusVisible: boolean;
    /** The link is disabled. */
    isDisabled: boolean;
}
export interface LinkProps extends BaseProps, PressEventProps, HoverEventProps, FocusEventProps, AriaLabellingProps, Pick<NativeProps<'a'>, 'target' | 'rel' | 'download' | 'aria-current'> {
    /** The `<a>`, or the `<span>` of a link without `href`. */
    ref?: Ref<HTMLAnchorElement> | undefined;
    /** The destination. Without it the link is a pressable `<span>`. */
    href?: string | undefined;
    /** Options handed to the provider's `navigate` with the `href`. */
    routerOptions?: unknown;
    /** Refuses interaction and drops the destination. */
    isDisabled?: boolean | undefined;
    /** The link text. */
    children?: ReactNode;
    /**
     * Replaces the provider's link renderer: receives the element's props, with an `href` when the
     * link navigates, and the link's state.
     */
    render?: ElementRender<'a', LinkRenderState> | undefined;
    /** Emphasis. Defaults to `primary`. */
    variant?: LinkVariant | undefined;
    /** The link stands on its own (a "View all" link, a list of links) rather than in running text. */
    isStandalone?: boolean | undefined;
    /** Underline policy. Defaults to `always` in running text and `hover` for a standalone link. */
    underline?: LinkUnderline | undefined;
    /** Opens the destination in a new tab: `target="_blank"` unless `target` is given. */
    isExternal?: boolean | undefined;
}
/** A link that navigates renders through the provider's link renderer; a disabled one is a span. */
export declare function renderLinkElement(props: JSX.IntrinsicElements['a']): ReactElement;
/**
 * A navigation link: it navigates through the provider's `navigate` and link
 * renderer, says when it opens a new tab, and without `href` is a pressable link.
 */
export declare function Link({ variant, isStandalone, underline, isExternal, target, rel, routerOptions, children, render, className, ...rest }: LinkProps): JSX.Element;
//# sourceMappingURL=link.d.ts.map