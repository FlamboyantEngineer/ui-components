'use client';

import type { MouseEvent, ReactNode, Ref } from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, Tone } from '../../core/props.js';
import { UiLink } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { IconLabel } from '../icon-label/icon-label.js';
import type { IconSource } from '../icon/icon.js';
import {
  RowRegistryContext,
  useListNavigation,
  useRowTabStop,
  type RowTabStop,
} from './use-list-navigation.js';
import { mergeSafeRel } from '../../utils/merge-safe-rel.js';

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

export interface ListRowContentProps
  extends Omit<ContainerProps<'span'>, 'title' | 'children'>, BaseProps {
  /** The row's main text. */
  title: ReactNode;
  /** Secondary text below the title, such as a `MetaLine`. */
  meta?: ReactNode;
  /** An imported icon component or rendered element beside the title and meta, drawn through `IconLabel`. */
  icon?: IconSource;
  /** Decorative leading media (an avatar, a thumbnail). Ignored when `icon` is set. */
  leading?: ReactNode;
}

export type ListRowTone = Extract<Tone, 'neutral' | 'danger'>;

export interface ListRowProps
  extends
    Omit<ContainerProps<'li'>, 'title' | 'children'>,
    BaseProps,
    Pick<ListRowContentProps, 'title' | 'meta' | 'icon' | 'leading'> {
  /** Makes the row's primary control a link, rendered through the provider's link renderer. */
  href?: string | undefined;
  /** Link target. `_blank` adds `noopener` and `noreferrer` to `rel`. */
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
}

/** What the row's primary control is. */
type ListRowKind = 'link' | 'action' | 'static';

type PrimaryOptions = Pick<
  ListRowProps,
  'href' | 'target' | 'rel' | 'onPress' | 'onAuxPress' | 'isCurrent' | 'isDisabled'
>;

const listHooks = createHooks('list');
const rowHooks = createHooks('list-row', ['primary', 'trailing']);
const contentHooks = createHooks('list-row-content', ['leading', 'text', 'title', 'meta']);

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
  const { href, target, rel, onPress, onAuxPress, isCurrent, isDisabled } = props.options;
  const className = rowHooks.slotClass('primary');
  const tabIndex = isDisabled ? undefined : tabStop.isActive ? 0 : -1;
  if (kind === 'link' && href !== undefined && !isDisabled) {
    return (
      <UiLink
        ref={tabStop.setPrimary}
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
        ref={tabStop.setPrimary}
        className={className}
        isDisabled={isDisabled}
        excludeFromTabOrder={!tabStop.isActive}
        onPress={onPress}
        {...(isCurrent ? { 'aria-current': true } : {})}
      >
        {children}
      </AriaButton>
    );
  }
  return (
    <div
      ref={tabStop.setPrimary}
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
  return (
    <RowRegistryContext value={navigation.registry}>
      <ul
        {...rest}
        {...listHooks.root({ className, props: rest, data: { divided, pending: isPending } })}
        ref={navigation.setRef}
        aria-busy={isPending || undefined}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          navigation.onKeyDown(event);
        }}
        onBlurCapture={(event) => {
          onBlurCapture?.(event);
          navigation.onBlurCapture(event);
        }}
      >
        {children}
      </ul>
    </RowRegistryContext>
  );
}

/**
 * The text of a row without any control: leading media or icon, title and meta. `ListRow` draws it
 * inside its primary control; use it alone inside an element that is itself the link or button.
 */
export function ListRowContent({
  title,
  meta,
  icon,
  leading,
  className,
  ...rest
}: ListRowContentProps) {
  const text = (
    <span {...contentHooks.slot('text')}>
      <span {...contentHooks.slot('title')}>{title}</span>
      {isEmptyNode(meta) ? null : <span {...contentHooks.slot('meta')}>{meta}</span>}
    </span>
  );
  const media = isEmptyNode(leading) ? null : (
    <span {...contentHooks.slot('leading')} aria-hidden="true">
      {leading}
    </span>
  );
  return (
    <span {...rest} {...contentHooks.root({ className, props: rest })}>
      {!icon ? (
        <>
          {media}
          {text}
        </>
      ) : (
        <IconLabel icon={icon} label={text} grow />
      )}
    </span>
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
  href,
  target,
  rel,
  onPress,
  onAuxPress,
  trailing,
  isCurrent = false,
  isDisabled = false,
  tone = 'neutral',
  className,
  onFocusCapture,
  ...rest
}: ListRowProps) {
  const options = { href, target, rel, onPress, onAuxPress, isCurrent, isDisabled };
  const kind = resolveKind(options);
  const tabStop = useRowTabStop(isDisabled, kind);
  const data = { kind, tone, current: isCurrent, disabled: isDisabled };
  return (
    <li
      {...rest}
      {...rowHooks.root({ className, props: rest, data })}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        tabStop.activate();
      }}
    >
      <ListRowPrimary kind={kind} options={options} tabStop={tabStop}>
        <ListRowContent title={title} meta={meta} icon={icon} leading={leading} />
      </ListRowPrimary>
      {isEmptyNode(trailing) ? null : <div {...rowHooks.slot('trailing')}>{trailing}</div>}
    </li>
  );
}
