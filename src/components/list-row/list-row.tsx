'use client';

import type { MouseEvent, ReactNode, Ref } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, ControlSize, Tone } from '../../core/props.js';
import { UiLink } from '../../core/provider.js';
import { Button as AriaButton } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { mergeSafeRel } from '../../utils/merge-safe-rel.js';
import { ListRowContent, type ListRowContentProps } from './list-row-content.js';
import {
  RowRegistryContext,
  type RowTabStop,
  useListNavigation,
  useRowTabStop,
} from './use-list-navigation.js';

export type { ListRowContentProps, ListRowLeadingVariant } from './list-row-content.js';
export { ListRowContent } from './list-row-content.js';
export { ListView, ListViewItem } from './list-view.js';

/** Imperative access to a `List`. */
export interface ListHandle {
  /** Moves focus to the first enabled row. */
  focusFirst(): void;
}

export interface ListProps extends ContainerProps<'ul'>, BaseProps {
  /** The rows are being loaded or updated: publishes `aria-busy` and `data-pending`. */
  isPending?: boolean | undefined;
  /** Ask the stylesheet for dividers between rows. */
  divided?: boolean | undefined;
  /** Called on ArrowUp from the first row, e.g. to return focus to an associated search field. */
  onNavigatePastStart?: (() => void) | undefined;
  /** Receives `focusFirst()`, e.g. for a search field that hands focus to the results. */
  handleRef?: Ref<ListHandle> | undefined;
}

export type ListRowTone = Extract<Tone, 'neutral' | 'danger'>;

/** `default` is a plain row, `outline` a bordered one, `muted` a row on a muted fill. */
export type ListRowVariant = 'default' | 'outline' | 'muted';

/** Row padding and text size. */
export type ListRowSize = Extract<ControlSize, 'xs' | 'sm' | 'md'>;

export interface ListRowProps
  extends
    Omit<ContainerProps<'li'>, 'title' | 'children'>,
    BaseProps,
    Pick<ListRowContentProps, 'title' | 'meta' | 'icon' | 'leading' | 'leadingVariant'> {
  /** A line above the row's primary control and trailing controls, such as a category. */
  header?: ReactNode;
  /** A line below them, such as a status or a note. */
  footer?: ReactNode;
  /** Makes the row's primary control a link, rendered through the provider's link renderer. */
  href?: string | undefined;
  /** Link target. A target that opens a new browsing context (`_blank` or a window name) adds `noopener` and `noreferrer` to `rel`. */
  target?: string | undefined;
  /** The link's relationship to the current page. */
  rel?: string | undefined;
  /** Without `href`, makes the primary control a button. With `href`, runs when the link is followed. */
  onPress?: (() => void) | undefined;
  /** Runs on a middle-button click of a link row. */
  onAuxPress?: (() => void) | undefined;
  /** Controls after the primary control, such as an action button. They are never inside the link. */
  trailing?: ReactNode;
  /** The row is the current page or item: `aria-current` on its primary control. */
  isCurrent?: boolean | undefined;
  /** The row cannot be activated and is skipped by keyboard navigation. */
  isDisabled?: boolean | undefined;
  /** Semantic emphasis, such as an overdue or failed item. Defaults to `neutral`. */
  tone?: ListRowTone | undefined;
  /** Row chrome. Defaults to `default`. */
  variant?: ListRowVariant | undefined;
  /** Row padding and text size. Defaults to `md`. */
  size?: ListRowSize | undefined;
}

export type ListSeparatorProps = Omit<ContainerProps<'li'>, 'children'> & BaseProps;

/** What the row's primary control is. */
type ListRowKind = 'link' | 'action' | 'static';

type PrimaryOptions = Pick<
  ListRowProps,
  'href' | 'target' | 'rel' | 'onPress' | 'onAuxPress' | 'isCurrent' | 'isDisabled'
>;

const listHooks = createHooks('list', ['separator'], {
  root: 'item-group',
  separator: 'item-separator',
});
const rowHooks = createHooks('list-row', ['header', 'primary', 'trailing', 'footer'], {
  root: 'item',
  header: 'item-header',
  trailing: 'item-actions',
  footer: 'item-footer',
});

function resolveKind({ href, onPress }: PrimaryOptions): ListRowKind {
  if (href !== undefined) return 'link';
  return onPress ? 'action' : 'static';
}

/** The row's primary control: a link, a React Aria button or a focusable read-only body. */
function ListRowPrimary(props: {
  kind: ListRowKind;
  options: PrimaryOptions;
  tabStop: RowTabStop;
  children: ReactNode;
}) {
  const { kind, tabStop, children } = props;
  const { isActive, setPrimary } = tabStop;
  const { href, target, rel, onPress, onAuxPress, isCurrent, isDisabled } = props.options;
  const className = rowHooks.slotClass('primary');
  const tabIndex = isDisabled ? undefined : isActive ? 0 : -1;
  if (kind === 'link' && href !== undefined && !isDisabled) {
    return (
      <UiLink
        ref={setPrimary}
        href={href}
        target={target}
        rel={mergeSafeRel(target, rel)}
        className={className}
        tabIndex={tabIndex}
        aria-current={isCurrent ? 'page' : undefined}
        onClick={() => onPress?.()}
        onAuxClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (event.button === 1) onAuxPress?.();
        }}
      >
        {children}
      </UiLink>
    );
  }
  if (kind === 'action') {
    return (
      <AriaButton
        ref={setPrimary}
        className={className}
        isDisabled={isDisabled}
        excludeFromTabOrder={!isActive}
        onPress={onPress}
        {...(isCurrent ? { 'aria-current': true } : {})}
      >
        {children}
      </AriaButton>
    );
  }
  return (
    <div
      ref={setPrimary}
      className={className}
      tabIndex={tabIndex}
      aria-current={isCurrent || undefined}
    >
      {children}
    </div>
  );
}

/**
 * A native list of rows with one tab stop: ArrowUp, ArrowDown, Home and End move focus between the
 * rows' primary controls, skipping disabled rows. Links, buttons and trailing controls keep their
 * ordinary roles.
 */
export function List({
  isPending = false,
  divided = false,
  onNavigatePastStart,
  handleRef,
  className,
  ref,
  onKeyDown,
  onBlurCapture,
  children,
  ...rest
}: ListProps) {
  const primaryClass = rowHooks.slotClass('primary');
  const navigation = useListNavigation({ primaryClass, onNavigatePastStart, handleRef, ref });
  const { registry, setRef } = navigation;
  const { onKeyDown: navigateByKey, onBlurCapture: leaveRow } = navigation;
  return (
    <RowRegistryContext value={registry}>
      <ul
        {...rest}
        {...listHooks.root({ className, props: rest, data: { divided, pending: isPending } })}
        ref={setRef}
        aria-busy={isPending || undefined}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          navigateByKey(event);
        }}
        onBlurCapture={(event) => {
          onBlurCapture?.(event);
          leaveRow(event);
        }}
      >
        {children}
      </ul>
    </RowRegistryContext>
  );
}

/**
 * One row of a `List`: a primary control (a link, a button or a focusable read-only body) holding
 * the row text, followed by optional trailing controls as siblings. A link row renders exactly one
 * link and nothing interactive inside it.
 */
export function ListRow({
  title,
  meta,
  icon,
  leading,
  leadingVariant,
  header,
  footer,
  href,
  target,
  rel,
  onPress,
  onAuxPress,
  trailing,
  isCurrent = false,
  isDisabled = false,
  tone = 'neutral',
  variant = 'default',
  size = 'md',
  className,
  onFocusCapture,
  ...rest
}: ListRowProps) {
  const options = { href, target, rel, onPress, onAuxPress, isCurrent, isDisabled };
  const kind = resolveKind(options);
  const tabStop = useRowTabStop(isDisabled, kind);
  const data = { kind, tone, variant, size, current: isCurrent, disabled: isDisabled };
  return (
    <li
      {...rest}
      {...rowHooks.root({ className, props: rest, data })}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        tabStop.activate();
      }}
    >
      {isEmptyNode(header) ? null : <div {...rowHooks.slot('header')}>{header}</div>}
      <ListRowPrimary kind={kind} options={options} tabStop={tabStop}>
        <ListRowContent {...{ title, meta, icon, leading, leadingVariant }} />
      </ListRowPrimary>
      {isEmptyNode(trailing) ? null : <div {...rowHooks.slot('trailing')}>{trailing}</div>}
      {isEmptyNode(footer) ? null : <div {...rowHooks.slot('footer')}>{footer}</div>}
    </li>
  );
}

/**
 * A decorative rule between rows of a `List` (shadcn/ui's item separator): an empty list item
 * hidden from assistive technology, which the row keys skip.
 */
export function ListSeparator({ className, ...rest }: ListSeparatorProps) {
  return <li {...rest} {...listHooks.slot('separator', undefined, className)} aria-hidden="true" />;
}
