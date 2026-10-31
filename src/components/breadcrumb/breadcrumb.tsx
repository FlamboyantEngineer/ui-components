'use client';

import { ChevronDownGlyph, ChevronLeftGlyph, ChevronRightGlyph } from '../../core/glyphs.js';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  Link as AriaLink,
  useLocale,
  type LinkProps as AriaLinkProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, NativeProps, Size } from '../../core/props.js';
import { UiLink, useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Icon, type IconSource } from '../icon/icon.js';
import { toIconProps } from '../icon/icon.js';
import type { MenuEntry } from '../menu/menu.js';
import { VisibleCollection } from '../overflow-list/overflow-list.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
import {
  OverflowCrumb,
  toCrumbKey,
  toCrumbText,
  useCrumbOverflow,
  type CrumbOverflow,
} from './crumb-overflow.js';

export type BreadcrumbSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

/** `truncate` lets labels ellipsize; `menu` collapses middle crumbs into a menu after the first. */
export type BreadcrumbOverflow = 'truncate' | 'menu';

export interface BreadcrumbItem {
  /** Passed to `onAction`. Defaults to the item's index. */
  id?: Key | undefined;
  /** The crumb's text. */
  label: ReactNode;
  /** The crumb's text in menus, when its label is not plain text. */
  textValue?: string | undefined;
  /** Where the crumb leads. The last crumb is the current page and never navigates. */
  href?: string | undefined;
  /** Places beside this crumb (its siblings), offered in a menu from a button after it. */
  menu?: readonly MenuEntry[] | undefined;
}

export interface BreadcrumbProps extends BaseProps, Pick<NativeProps<'nav'>, 'ref' | 'hidden'> {
  /** Names the trail's landmark. */
  'aria-label'?: string | undefined;
  /** Names the trail's landmark by another element. */
  'aria-labelledby'?: string | undefined;
  /** Disables every crumb and menu. */
  isDisabled?: boolean | undefined;
  /** Receives the `id` (or index) of a crumb the reader activates, or one chosen from a menu. */
  onAction?: ((key: Key) => void) | undefined;
  /** The trail, from the outermost container to the current page (the last item). */
  items: readonly BreadcrumbItem[];
  /** Type scale. Defaults to `md`. */
  size?: BreadcrumbSize | undefined;
  /** Decorative icon between crumbs. Defaults to a chevron pointing along the reading direction. */
  separator?: IconSource;
  /**
   * What a trail that runs out of room does: `truncate` (the default) lets labels ellipsize, `menu`
   * keeps the first and current crumbs and as many others as fit, and lists the rest in a menu.
   */
  overflow?: BreadcrumbOverflow | undefined;
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
  isDisabled: boolean | undefined;
  onAction: BreadcrumbProps['onAction'];
}

interface CrumbMenuProps {
  item: BreadcrumbItem;
  index: number;
  isDisabled: boolean | undefined;
  onAction: BreadcrumbProps['onAction'];
}

const hooks = createHooks('breadcrumb', ['list', 'item', 'link', 'label', 'menu', 'separator']);

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

/** The button after a crumb that opens the menu of the places beside it. */
function CrumbMenu({ item, index, isDisabled, onAction }: CrumbMenuProps) {
  const strings = useUiStrings();
  return (
    <DropdownMenu
      iconOnly
      size="xs"
      variant="ghost"
      icon={ChevronDownGlyph}
      isDisabled={isDisabled}
      className={hooks.slotClass('menu')}
      label={strings.placesBeside(toCrumbText(item, index))}
      items={item.menu}
      onAction={(key) => onAction?.(key)}
    />
  );
}

function Separator({ glyph }: { glyph: IconSource }) {
  return <Icon {...toIconProps(glyph)} size="sm" className={hooks.slotClass('separator')} />;
}

function Crumb({ item, index, isLast, separator, isDisabled, onAction }: CrumbProps) {
  return (
    <AriaBreadcrumb id={toCrumbKey(item, index)} className={hooks.slotClass('item')}>
      <AriaLink
        className={hooks.slotClass('link')}
        href={isLast ? undefined : item.href}
        render={renderCrumbLink}
      >
        <TruncationTooltip className={hooks.slotClass('label')}>{item.label}</TruncationTooltip>
      </AriaLink>
      {item.menu?.length ? (
        <CrumbMenu item={item} index={index} isDisabled={isDisabled} onAction={onAction} />
      ) : null}
      {isLast ? null : <Separator glyph={separator} />}
    </AriaBreadcrumb>
  );
}

/** The crumbs, with the overflow crumb after the first while the trail collapses into a menu. */
function renderCrumbs(
  {
    items,
    glyph,
    onAction,
    isDisabled,
  }: { items: readonly BreadcrumbItem[]; glyph: IconSource } & Pick<
    BreadcrumbProps,
    'onAction' | 'isDisabled'
  >,
  overflow: CrumbOverflow,
): ReactNode[] {
  const crumbs: ReactElement[] = items.map((item, index) => (
    <Crumb
      key={toKeyIdentity(toCrumbKey(item, index))}
      item={item}
      index={index}
      isLast={index === items.length - 1}
      separator={glyph}
      isDisabled={isDisabled}
      onAction={onAction}
    />
  ));
  if (overflow.visibleKeys === null) return crumbs;
  // The current crumb never navigates, so it never joins the menu of hidden crumbs.
  const entries = overflow.hiddenIndices.flatMap((index) => {
    if (index === items.length - 1) return [];
    const item = items[index] as BreadcrumbItem;
    return [{ id: toCrumbKey(item, index), label: toCrumbText(item, index), href: item.href }];
  });
  crumbs.splice(
    1,
    0,
    <OverflowCrumb
      key={overflow.overflowKey}
      id={overflow.overflowKey}
      menuRef={overflow.indicatorRef}
      items={entries}
      onAction={onAction}
      isDisabled={isDisabled}
      separator={<Separator glyph={glyph} />}
    />,
  );
  return crumbs;
}

/** A location trail: crumbs from the outermost container to the current page. */
export function Breadcrumb({
  items,
  size = 'md',
  separator,
  overflow = 'truncate',
  isDisabled,
  onAction,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  ...rest
}: BreadcrumbProps) {
  const rtl = useLocale().direction === 'rtl';
  const collapse = useCrumbOverflow(items, overflow === 'menu');
  const navProps = {
    ...rest,
    ...hooks.root({
      className,
      props: rest,
      data: { size, overflow, collapsed: collapse.isCollapsed },
    }),
  };
  const glyph = separator ?? (rtl ? ChevronLeftGlyph : ChevronRightGlyph);
  const containerRef = collapse.containerRef;

  return (
    <VisibleCollection keys={collapse.visibleKeys}>
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
            <ol {...listProps} ref={mergeRefs(listRef, containerRef)} />
          </nav>
        )}
      >
        {renderCrumbs({ items, glyph, onAction, isDisabled }, collapse)}
      </AriaBreadcrumbs>
    </VisibleCollection>
  );
}
