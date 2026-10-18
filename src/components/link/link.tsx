import type { JSX, ReactElement, Ref } from 'react';
import {
  Link as AriaLink,
  composeRenderProps,
  type LinkProps as AriaLinkProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, UiLink, useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

/** Emphasis: `primary` takes the accent colour, `secondary` the surrounding text colour. */
export type LinkVariant = 'primary' | 'secondary';

/** When the stylesheet underlines the link. */
export type LinkUnderline = 'always' | 'hover' | 'none';

export interface LinkProps extends Omit<AriaLinkProps, 'className' | 'style'>, BaseProps {
  /** The `<a>`, or the `<span>` of a link without `href`. */
  ref?: Ref<HTMLAnchorElement> | undefined;
  /** Emphasis. Defaults to `primary`. */
  variant?: LinkVariant | undefined;
  /** The link stands on its own (a "View all" link, a list of links) rather than in running text. */
  isStandalone?: boolean | undefined;
  /** Underline policy. Defaults to `always` in running text and `hover` for a standalone link. */
  underline?: LinkUnderline | undefined;
  /** Opens the destination in a new tab: `target="_blank"` unless `target` is given. */
  isExternal?: boolean | undefined;
}

type LinkElementProps = Parameters<NonNullable<AriaLinkProps['render']>>[0];

const hooks = createHooks('link', ['external-icon', 'new-tab-label']);

const safeRel = ['noopener', 'noreferrer'];

/** The caller's `rel` with the tokens that keep a new tab from reaching back to this page. */
function mergeSafeRel(rel: string | undefined): string {
  const tokens = (rel ?? '').split(/\s+/).filter(Boolean);
  return [...tokens, ...safeRel.filter((token) => !tokens.includes(token))].join(' ');
}

/** A link that navigates renders through the provider's link renderer; a disabled one is a span. */
function renderLinkElement(props: LinkElementProps): ReactElement {
  if ('href' in props && typeof props.href === 'string' && props['aria-disabled'] === undefined) {
    return <UiLink {...props} href={props.href} />;
  }
  const {
    href: _href,
    target: _target,
    rel: _rel,
    ...spanProps
  } = props as LinkElementProps & {
    href?: unknown;
    target?: unknown;
    rel?: unknown;
  };
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
      <Glyph name="external-link" className={hooks.slotClass('external-icon')} />
      <VisuallyHidden elementType="span" className={hooks.slotClass('new-tab-label')}>
        {strings.opensInNewTab}
      </VisuallyHidden>
    </>
  );
}

/**
 * A navigation link (React Aria `Link`): it navigates through the provider's `navigate` and link
 * renderer, says when it opens a new tab, and without `href` is a pressable link.
 */
export function Link({
  variant = 'primary',
  isStandalone = false,
  underline = isStandalone ? 'hover' : 'always',
  isExternal = false,
  target = isExternal ? '_blank' : undefined,
  rel,
  children,
  render = renderLinkElement,
  className,
  ...rest
}: LinkProps) {
  const opensNewTab = target === '_blank';
  return (
    <AriaLink
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { variant, standalone: isStandalone, underline },
      })}
      target={target}
      rel={opensNewTab ? mergeSafeRel(rel) : rel}
      render={render}
    >
      {composeRenderProps(children, (content) => (
        <>
          {content}
          {opensNewTab ? <NewTabParts /> : null}
        </>
      ))}
    </AriaLink>
  );
}
