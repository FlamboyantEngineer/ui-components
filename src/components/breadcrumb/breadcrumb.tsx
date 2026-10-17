import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  Link as AriaLink,
  useLocale,
  type BreadcrumbsProps as AriaBreadcrumbsProps,
  type Key,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import { UiLink } from '../../core/provider.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';

export type BreadcrumbSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

export interface BreadcrumbItem {
  /** Passed to `onAction`. Defaults to the item's index. */
  id?: Key | undefined;
  /** The crumb's text. */
  label: ReactNode;
  /** Where the crumb leads. The last crumb is the current page and never navigates. */
  href?: string | undefined;
}

// The root is a `nav` around React Aria's list, so only the props React Aria handles on the list
// itself are taken from it; the others belong to the `nav`.
export interface BreadcrumbProps
  extends
    Pick<
      AriaBreadcrumbsProps<BreadcrumbItem>,
      'isDisabled' | 'onAction' | 'aria-label' | 'aria-labelledby'
    >,
    Pick<NativeProps<'nav'>, 'ref' | 'hidden'>,
    BaseProps {
  /** The trail, from the outermost container to the current page (the last item). */
  items: readonly BreadcrumbItem[];
  /** Type scale. Defaults to `md`. */
  size?: BreadcrumbSize | undefined;
  /** Decorative icon between crumbs. Defaults to a chevron pointing along the reading direction. */
  separator?: IconSource;
}

type LinkRenderProps = Parameters<NonNullable<AriaLinkProps['render']>>[0];

interface FocusPosition {
  index: number;
  count: number;
  rtl: boolean;
}

interface CrumbProps {
  item: BreadcrumbItem;
  index: number;
  isLast: boolean;
  separator: IconSource;
}

const hooks = createHooks('breadcrumb', ['list', 'item', 'link', 'separator']);

/** Crumbs that navigate render through the provider's link renderer; the others stay spans. */
function renderCrumbLink(props: LinkRenderProps): ReactElement {
  if ('href' in props && typeof props.href === 'string' && props['aria-disabled'] === undefined) {
    return <UiLink {...props} href={props.href} />;
  }
  const { href: _href, ...spanProps } = props as LinkRenderProps & { href?: unknown };
  return <span {...(spanProps as Omit<LinkRenderProps, 'href'>)} />;
}

/** The index of the crumb a navigation key moves focus to, or `undefined` for other keys. */
function resolveFocusTarget(key: string, { index, count, rtl }: FocusPosition) {
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
  const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
  if (key === forward) return Math.min(count - 1, index + 1);
  if (key === backward) return Math.max(0, index - 1);
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return undefined;
}

/** Arrow keys, Home and End move focus between the crumbs other than the current one. */
function moveFocus(event: KeyboardEvent<HTMLElement>, rtl: boolean) {
  const crumbs = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(`.${hooks.slotClass('link')}`),
  ).filter((crumb) => !crumb.hasAttribute('data-current') && !crumb.hasAttribute('data-disabled'));
  const index = crumbs.indexOf(event.target as HTMLElement);
  if (index === -1) return;
  const next = resolveFocusTarget(event.key, { index, count: crumbs.length, rtl });
  if (next === undefined) return;
  event.preventDefault();
  crumbs[next]?.focus();
}

function Crumb({ item, index, isLast, separator }: CrumbProps) {
  return (
    <AriaBreadcrumb id={item.id ?? index} className={hooks.slotClass('item')}>
      <AriaLink
        className={hooks.slotClass('link')}
        href={isLast ? undefined : item.href}
        render={renderCrumbLink}
      >
        {item.label}
      </AriaLink>
      {isLast ? null : (
        <Icon {...toIconProps(separator)} size="sm" className={hooks.slotClass('separator')} />
      )}
    </AriaBreadcrumb>
  );
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
  className,
  ...rest
}: BreadcrumbProps) {
  const rtl = useLocale().direction === 'rtl';
  const navProps = { ...rest, ...hooks.root({ className, props: rest, data: { size } }) };
  const glyph = separator ?? (rtl ? 'chevron-left' : 'chevron-right');

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
          {...navProps}
          aria-label={label}
          aria-labelledby={labelledBy}
          onKeyDown={(event) => moveFocus(event, rtl)}
        >
          <ol {...listProps} ref={listRef} />
        </nav>
      )}
    >
      {items.map((item, index) => (
        <Crumb
          key={String(item.id ?? index)}
          item={item}
          index={index}
          isLast={index === items.length - 1}
          separator={glyph}
        />
      ))}
    </AriaBreadcrumbs>
  );
}
