import {
  isValidElement,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  Link as AriaLink,
  useLocale,
  type Key,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { UiLink } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';

export type BreadcrumbSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BreadcrumbItem {
  /** Passed to `onAction`. Defaults to the item's index. */
  id?: Key | undefined;
  label: ReactNode;
  /** Where the crumb leads. The last crumb is the current page and never navigates. */
  href?: string | undefined;
}

export interface BreadcrumbProps {
  /** The trail, from the outermost container to the current page (the last item). */
  items: readonly BreadcrumbItem[];
  /** Type scale. Defaults to `md`. */
  size?: BreadcrumbSize | undefined;
  /** Decorative glyph name or node between crumbs. Defaults to a chevron pointing along the reading direction. */
  separator?: GlyphName | ReactNode;
  /** Disables every crumb. */
  isDisabled?: boolean | undefined;
  /** Called with a crumb's `id` when it is activated, for crumbs that route in place. */
  onAction?: ((id: Key) => void) | undefined;
  /** Names the navigation landmark. Defaults to React Aria's localized "Breadcrumbs". */
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  id?: string | undefined;
  hidden?: boolean | undefined;
  className?: string | undefined;
  ref?: Ref<HTMLElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('breadcrumb', ['list', 'item', 'link', 'separator']);

function isGlyphName(icon: unknown): icon is GlyphName {
  return typeof icon === 'string' && !isValidElement(icon);
}

type LinkRenderProps = Parameters<NonNullable<AriaLinkProps['render']>>[0];

/** Crumbs that navigate render through the provider's link renderer; the others stay spans. */
function renderCrumbLink(props: LinkRenderProps): ReactElement {
  if ('href' in props && typeof props.href === 'string' && props['aria-disabled'] === undefined) {
    return <UiLink {...props} href={props.href} />;
  }
  const { href: _href, ...spanProps } = props as LinkRenderProps & { href?: unknown };
  return <span {...(spanProps as Omit<LinkRenderProps, 'href'>)} />;
}

/** Arrow keys, Home and End move focus between the crumbs other than the current one. */
function moveFocus(event: KeyboardEvent<HTMLElement>, direction: 'ltr' | 'rtl') {
  const crumbs = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(`.${hooks.slotClass('link')}`),
  ).filter((crumb) => !crumb.hasAttribute('data-current') && !crumb.hasAttribute('data-disabled'));
  const index = crumbs.indexOf(event.target as HTMLElement);
  if (index === -1) return;
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  let next: number;
  if (event.key === forward) next = Math.min(crumbs.length - 1, index + 1);
  else if (event.key === backward) next = Math.max(0, index - 1);
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = crumbs.length - 1;
  else return;
  event.preventDefault();
  crumbs[next]?.focus();
}

/** A location trail: crumbs from the outermost container to the current page. */
export function Breadcrumb({
  items,
  size = 'md',
  separator,
  isDisabled,
  onAction,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  id,
  hidden,
  className,
  ref,
  ...rest
}: BreadcrumbProps) {
  const { direction } = useLocale();
  const navHooks = hooks.root({ className, props: rest, data: { size } });
  const glyph = separator ?? (direction === 'rtl' ? 'chevron-left' : 'chevron-right');

  return (
    <AriaBreadcrumbs
      className={hooks.slotClass('list')}
      isDisabled={isDisabled}
      onAction={onAction}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      render={({
        ref: listRef,
        'aria-label': label,
        'aria-labelledby': labelledBy,
        id: _listId,
        ...listProps
      }) => (
        <nav
          {...navHooks}
          ref={ref}
          id={id}
          hidden={hidden}
          aria-label={label}
          aria-labelledby={labelledBy}
          onKeyDown={(event) => moveFocus(event, direction)}
        >
          <ol {...listProps} ref={listRef} />
        </nav>
      )}
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <AriaBreadcrumb
            key={String(item.id ?? index)}
            id={item.id ?? index}
            className={hooks.slotClass('item')}
          >
            <AriaLink
              className={hooks.slotClass('link')}
              href={last ? undefined : item.href}
              render={renderCrumbLink}
            >
              {item.label}
            </AriaLink>
            {last ? null : isGlyphName(glyph) ? (
              <Icon glyph={glyph} size="sm" className={hooks.slotClass('separator')} />
            ) : (
              <Icon size="sm" className={hooks.slotClass('separator')}>
                {glyph}
              </Icon>
            )}
          </AriaBreadcrumb>
        );
      })}
    </AriaBreadcrumbs>
  );
}
