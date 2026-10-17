import { useContext, useId, type ReactNode } from 'react';
import {
  SelectionIndicator,
  Tab as AriaTab,
  TabList as AriaTabList,
  TabListStateContext,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  TabsContext,
  useSlottedContext,
  type TabListProps as AriaTabListProps,
  type TabPanelProps as AriaTabPanelProps,
  type TabProps as AriaTabProps,
  type TabsProps as AriaTabsProps,
} from 'react-aria-components';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { useCenterSelectedTab, useListOverflow } from './tab-list-overflow.js';

export type TabsSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface TabsProps
  extends
    Omit<AriaTabsProps, 'className' | 'style' | 'render' | 'children'>,
    Pick<NativeProps<'div'>, 'ref'>,
    BaseProps {
  /** Tab block size. Defaults to `md`. */
  size?: TabsSize | undefined;
  /** The `TabList` and the `TabPanel`s. */
  children?: ReactNode;
}

export interface TabListProps<T>
  extends
    Omit<AriaTabListProps<T>, 'className' | 'style' | 'render'>,
    Pick<NativeProps<'div'>, 'ref'>,
    BaseProps {}

// A tab's and a panel's `id` is React Aria's collection key, which may also be a number.
export interface TabProps
  extends
    Omit<AriaTabProps, 'className' | 'style' | 'render' | 'children'>,
    Pick<NativeProps<'div'>, 'ref'>,
    Omit<BaseProps, 'id'> {
  /** The tab's label. */
  children?: ReactNode;
  /** A decorative icon before the label. */
  icon?: IconSource;
  /** A count after the label. Zero, negative and non-finite values show nothing. */
  count?: number | null | undefined;
  /** Counts above this show as `<max>+`. Defaults to 99. */
  countMax?: number | undefined;
  /** The tab's accessible description while it shows a count. Defaults to the provider's `itemCount`. */
  countLabel?: string | undefined;
}

export interface TabPanelProps
  extends
    Omit<AriaTabPanelProps, 'className' | 'style' | 'render'>,
    Pick<NativeProps<'div'>, 'ref'>,
    Omit<BaseProps, 'id'> {}

interface TabCountProps {
  id: string;
  count: number;
  countMax: number;
  countLabel: string | undefined;
}

const hooks = createHooks('tabs', ['list', 'tab', 'indicator', 'icon', 'label', 'count', 'panel']);

function normalizeCount(count: number | null | undefined): number | null {
  if (typeof count !== 'number' || !Number.isFinite(count)) return null;
  const whole = Math.floor(count);
  return whole > 0 ? whole : null;
}

/** A tab's shown count, and the hidden description that gives the full count. */
function TabCount({ id, count, countMax, countLabel }: TabCountProps) {
  const strings = useUiStrings();
  return (
    <>
      {' '}
      <span {...hooks.slot('count')}>{count > countMax ? `${countMax}+` : count}</span>
      <span id={id} hidden>
        {countLabel ?? strings.itemCount(count)}
      </span>
    </>
  );
}

/** Switches between peer sections of one surface: a `TabList` of `Tab`s and their `TabPanel`s. */
export function Tabs({ size = 'md', className, ...rest }: TabsProps) {
  return <AriaTabs {...rest} {...hooks.root({ className, props: rest, data: { size } })} />;
}

/** The row (or column) of tabs. Scrolls the selected tab toward its middle when it overflows. */
export function TabList<T extends object>({ className, ref, ...rest }: TabListProps<T>) {
  const selectedKey = useContext(TabListStateContext)?.selectedKey ?? null;
  const orientation = useSlottedContext(TabsContext)?.orientation ?? 'horizontal';
  const [listRef, setListRef] = useForwardedRef(ref);
  const overflowing = useListOverflow(listRef, orientation);
  useCenterSelectedTab(listRef, { orientation, selectedKey });
  return (
    <AriaTabList {...rest} ref={setListRef} {...hooks.slot('list', { overflowing }, className)} />
  );
}

/**
 * One tab. With `href` it renders a link that navigates through the provider's router
 * (`UiProvider` `navigate`) when selected.
 */
export function Tab({
  children,
  icon,
  count,
  countMax = 99,
  countLabel,
  className,
  ...rest
}: TabProps) {
  const countId = useId();
  const shown = normalizeCount(count);
  const describedBy =
    shown === null
      ? rest['aria-describedby']
      : [rest['aria-describedby'], countId].filter(Boolean).join(' ');

  return (
    <AriaTab
      {...rest}
      className={mergeClassNames(hooks.slotClass('tab'), className)}
      aria-describedby={describedBy}
    >
      <SelectionIndicator className={hooks.slotClass('indicator')} />
      {icon ? <Icon {...toIconProps(icon)} className={hooks.slotClass('icon')} /> : null}
      <span
        {...hooks.slot('label', { label: typeof children === 'string' ? children : undefined })}
      >
        {children}
      </span>
      {shown === null ? null : (
        <TabCount id={countId} count={shown} countMax={countMax} countLabel={countLabel} />
      )}
    </AriaTab>
  );
}

/** The content shown for the tab with the same `id`. */
export function TabPanel({ className, ...rest }: TabPanelProps) {
  return (
    <AriaTabPanel {...rest} className={mergeClassNames(hooks.slotClass('panel'), className)} />
  );
}
