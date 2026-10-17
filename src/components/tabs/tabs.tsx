import {
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
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
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';

export type TabsSize = 'sm' | 'md' | 'lg';

type Orientation = 'horizontal' | 'vertical';

const hooks = createHooks('tabs', ['list', 'tab', 'indicator', 'icon', 'label', 'count', 'panel']);

export interface TabsProps extends Omit<
  AriaTabsProps,
  'className' | 'style' | 'render' | 'children'
> {
  /** Tab block size. Defaults to `md`. */
  size?: TabsSize | undefined;
  children?: ReactNode;
  className?: string | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

/** Switches between peer sections of one surface: a `TabList` of `Tab`s and their `TabPanel`s. */
export function Tabs({ size = 'md', className, children, ...rest }: TabsProps) {
  return (
    <AriaTabs {...rest} {...hooks.root({ className, props: rest, data: { size } })}>
      {children}
    </AriaTabs>
  );
}

export interface TabListProps<T> extends Omit<
  AriaTabListProps<T>,
  'className' | 'style' | 'render'
> {
  className?: string | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function overflows(list: HTMLElement, orientation: Orientation): boolean {
  return orientation === 'vertical'
    ? list.scrollHeight > list.clientHeight + 1
    : list.scrollWidth > list.clientWidth + 1;
}

/**
 * Scrolls an overflowing list so `tab` sits as close to its middle as the scroll range allows.
 * Right-to-left lists scroll with negative offsets.
 */
function centerTab(list: HTMLElement, tab: HTMLElement, orientation: Orientation) {
  if (!overflows(list, orientation)) return;
  const listBox = list.getBoundingClientRect();
  const tabBox = tab.getBoundingClientRect();
  const vertical = orientation === 'vertical';
  const range = vertical
    ? list.scrollHeight - list.clientHeight
    : list.scrollWidth - list.clientWidth;
  const position = vertical ? list.scrollTop : list.scrollLeft;
  const delta = vertical
    ? tabBox.top + tabBox.height / 2 - (listBox.top + list.clientTop + list.clientHeight / 2)
    : tabBox.left + tabBox.width / 2 - (listBox.left + list.clientLeft + list.clientWidth / 2);
  const rtl = !vertical && getComputedStyle(list).direction === 'rtl';
  const [min, max] = rtl ? [-range, 0] : [0, range];
  const target = Math.min(Math.max(position + delta, min), max);
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
  if (typeof list.scrollTo === 'function') {
    list.scrollTo(vertical ? { top: target, behavior } : { left: target, behavior });
  } else if (vertical) {
    list.scrollTop = target;
  } else {
    list.scrollLeft = target;
  }
}

function useOverflow(listRef: RefObject<HTMLDivElement | null>, orientation: Orientation) {
  const [overflowing, setOverflowing] = useState(false);
  const measure = useCallback(() => {
    const list = listRef.current;
    if (list) setOverflowing(overflows(list, orientation));
  }, [listRef, orientation]);

  // Tabs added, removed or relabelled re-render the list; measure after every commit.
  useLayoutEffect(measure);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef, measure]);

  return overflowing;
}

/** The row (or column) of tabs. Scrolls the selected tab toward its middle when it overflows. */
export function TabList<T extends object>({ className, ref, ...rest }: TabListProps<T>) {
  const state = useContext(TabListStateContext);
  const orientation: Orientation = useSlottedContext(TabsContext)?.orientation ?? 'horizontal';
  const listRef = useRef<HTMLDivElement | null>(null);
  const overflowing = useOverflow(listRef, orientation);
  const selectedKey = state?.selectedKey ?? null;

  const setList = useCallback(
    (element: HTMLDivElement | null) => {
      listRef.current = element;
      assignRef(ref, element);
    },
    [ref],
  );

  // Tabs mount after the collection is built, so check every commit and center once per selection.
  // Centering waits a frame: the first press into the list moves focus there, and React Aria then
  // restores the list's previous scroll position.
  const latestKey = useRef(selectedKey);
  const centeredKey = useRef<typeof selectedKey>(null);
  const frame = useRef<number | null>(null);
  useEffect(() => {
    latestKey.current = selectedKey;
    if (selectedKey === null || centeredKey.current === selectedKey || frame.current !== null)
      return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const list = listRef.current;
      const tab = list?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!list || !tab) return;
      centeredKey.current = latestKey.current;
      centerTab(list, tab, orientation);
    });
  });
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return (
    <AriaTabList {...rest} ref={setList} {...hooks.slot('list', { overflowing }, className)} />
  );
}

export interface TabProps extends Omit<
  AriaTabProps,
  'className' | 'style' | 'render' | 'children'
> {
  /** The tab's label. */
  children?: ReactNode;
  /** A decorative built-in glyph name or icon node before the label. */
  icon?: GlyphName | ReactNode;
  /** A count after the label. Zero, negative and non-finite values show nothing. */
  count?: number | null | undefined;
  /** Counts above this show as `<max>+`. Defaults to 99. */
  countMax?: number | undefined;
  /** The tab's accessible description while it shows a count. Defaults to the provider's `itemCount`. */
  countLabel?: string | undefined;
  className?: string | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

function isGlyphName(icon: unknown): icon is GlyphName {
  return typeof icon === 'string' && !isValidElement(icon);
}

function normalizeCount(count: number | null | undefined): number | null {
  if (typeof count !== 'number' || !Number.isFinite(count)) return null;
  const whole = Math.floor(count);
  return whole > 0 ? whole : null;
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
  const strings = useUiStrings();
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
      {icon ? (
        isGlyphName(icon) ? (
          <Icon glyph={icon} className={hooks.slotClass('icon')} />
        ) : (
          <Icon className={hooks.slotClass('icon')}>{icon}</Icon>
        )
      ) : null}
      <span
        {...hooks.slot('label', { label: typeof children === 'string' ? children : undefined })}
      >
        {children}
      </span>
      {shown !== null ? (
        <>
          {' '}
          <span {...hooks.slot('count')}>{shown > countMax ? `${countMax}+` : shown}</span>
          <span id={countId} hidden>
            {countLabel ?? strings.itemCount(shown)}
          </span>
        </>
      ) : null}
    </AriaTab>
  );
}

export interface TabPanelProps extends Omit<AriaTabPanelProps, 'className' | 'style' | 'render'> {
  className?: string | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

/** The content shown for the tab with the same `id`. */
export function TabPanel({ className, ...rest }: TabPanelProps) {
  return (
    <AriaTabPanel {...rest} className={mergeClassNames(hooks.slotClass('panel'), className)} />
  );
}
