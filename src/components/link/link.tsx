'use client';

import type { JSX, ReactElement, ReactNode, Ref } from 'react';
import type {
  AriaLabellingProps,
  FocusEventProps,
  HoverEventProps,
  PressEventProps,
} from '../../core/events.js';
import { ExternalLinkGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, InteractionState, NativeProps, RefProps } from '../../core/props.js';
import { Glyph, UiLink, useUiStrings } from '../../core/provider.js';
import { Link as AriaLink } from '../../primitives/index.js';
import { mergeSafeRel } from '../../utils/merge-safe-rel.js';
import type { ElementRender } from '../../utils/render-element.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

/** Emphasis: `primary` takes the accent colour, `secondary` the surrounding text colour. */
export type LinkVariant = 'primary' | 'secondary';

/** When the stylesheet underlines the link. */
export type LinkUnderline = 'always' | 'hover' | 'none';

/** The states a link passes to `render` with its element's props. */
export interface LinkRenderState extends InteractionState {
  /** The link has `aria-current`. */
  isCurrent: boolean;
}

export interface LinkProps
  extends
    BaseProps,
    // React Aria's link reports no press-up: a press always starts on the link it ends on.
    Omit<PressEventProps, 'onPressUp'>,
    HoverEventProps,
    FocusEventProps,
    AriaLabellingProps,
    Pick<NativeProps<'a'>, 'target' | 'rel' | 'download' | 'title' | 'aria-current'>,
    // A disabled link, or one without `href`, renders a `<span>` and hands that to the ref.
    RefProps<HTMLAnchorElement | HTMLSpanElement> {
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

type LinkElementProps = JSX.IntrinsicElements['a'] | JSX.IntrinsicElements['span'];

const hooks = createHooks('link', ['external-icon', 'new-tab-label']);

/**
 * The element's props with the caller's description kept first. A trigger around the link, such as
 * a hover card's, replaces `aria-describedby` with its own while it opens or offers a long press.
 */
function withOwnDescription<P extends LinkElementProps>(props: P, own: string | undefined): P {
  if (!own) return props;
  const ids = new Set([...own.split(/\s+/), ...(props['aria-describedby'] ?? '').split(/\s+/)]);
  ids.delete('');
  return { ...props, 'aria-describedby': [...ids].join(' ') };
}

/**
 * A link that navigates renders through the provider's link renderer; a disabled one, or one
 * without an `href` (such as the current crumb of a breadcrumb), is a span.
 */
export function renderLinkElement(
  props: JSX.IntrinsicElements['a'] | JSX.IntrinsicElements['span'],
): ReactElement {
  if ('href' in props && typeof props.href === 'string' && props['aria-disabled'] === undefined) {
    return <UiLink {...(props as JSX.IntrinsicElements['a'])} href={props.href} />;
  }
  const {
    href: _href,
    target: _target,
    rel: _rel,
    ...spanProps
  } = props as JSX.IntrinsicElements['a'];
  return <span {...(spanProps as JSX.IntrinsicElements['span'])} />;
}

/**
 * The glyph and the visually hidden text of a link that opens in a new tab. The space before the
 * glyph also separates the content from the hidden text in the accessible name.
 */
function NewTabParts() {
  const strings = useUiStrings();
  return (
    <>
      {' '}
      <Glyph icon={ExternalLinkGlyph} className={hooks.slotClass('external-icon')} />
      <VisuallyHidden as="span" className={hooks.slotClass('new-tab-label')}>
        {strings.opensInNewTab}
      </VisuallyHidden>
    </>
  );
}

/**
 * A navigation link: it navigates through the provider's `navigate` and link
 * renderer, says when it opens a new tab, and without `href` is a pressable link.
 */
export function Link({
  variant = 'primary',
  isStandalone = false,
  underline = isStandalone ? 'hover' : 'always',
  isExternal = false,
  target = isExternal ? '_blank' : undefined,
  rel,
  title,
  routerOptions,
  children,
  render = renderLinkElement,
  className,
  ref,
  ...rest
}: LinkProps) {
  // A link without a destination, or a disabled one, is a span that opens nothing.
  const opensNewTab = target === '_blank' && rest.href !== undefined && !rest.isDisabled;
  return (
    <AriaLink
      {...rest}
      // The building block types its ref as the anchor, though it hands it the span it draws too.
      ref={ref as Ref<HTMLAnchorElement> | undefined}
      routerOptions={routerOptions as never}
      {...hooks.root({
        className,
        props: rest,
        data: { variant, standalone: isStandalone, underline },
      })}
      target={target}
      rel={opensNewTab ? mergeSafeRel(target, rel) : rel}
      // The building block draws a `<span>` without `href`; its props fit an anchor's. It drops
      // `title`, so the title joins the props here.
      render={(props: LinkElementProps, state) =>
        render(
          withOwnDescription(
            title === undefined ? props : { ...props, title },
            rest['aria-describedby'],
          ) as JSX.IntrinsicElements['a'],
          state,
        )
      }
    >
      {children}
      {opensNewTab ? <NewTabParts /> : null}
    </AriaLink>
  );
}
