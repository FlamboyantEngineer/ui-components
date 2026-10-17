import {
  useContext,
  useId,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  SelectionIndicator,
  Tab as AriaTab,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  type Key,
  type TabPanelProps as AriaTabPanelProps,
  type TabProps as AriaTabProps,
  type TabsProps as AriaTabsProps,
} from 'react-aria-components';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import { TabRemoveContext } from './tab-list.js';

export type TabsSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface TabsProps
  extends
    Omit<AriaTabsProps, 'className' | 'style' | 'children'>,
    Pick<NativeProps<'div'>, 'ref'>,
    BaseProps {
  /** Tab block size. Defaults to `md`. */
  size?: TabsSize | undefined;
  /** The `TabList` and the `TabPanel`s. */
  children?: ReactNode;
}

// A tab's and a panel's `id` is React Aria's collection key, which may also be a number.
export interface TabProps
  extends
    Omit<AriaTabProps, 'className' | 'style' | 'children'>,
    Pick<NativeProps<'div'>, 'ref'>,
    Omit<BaseProps, 'id'> {
  /** The tab's label. */
  children?: ReactNode;
  /** The tab's text in an overflow menu, when its label is not plain text. */
  textValue?: string | undefined;
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
    Omit<AriaTabPanelProps, 'className' | 'style'>,
    Pick<NativeProps<'div'>, 'ref'>,
    Omit<BaseProps, 'id'> {}

interface TabCountProps {
  id: string;
  count: number;
  countMax: number;
  countLabel: string | undefined;
}

type TabRender = NonNullable<AriaTabProps['render']>;

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

/**
 * The close mark of a removable tab. It takes pointer presses only, without selecting the tab;
 * keyboard users press Delete on the focused tab, which the tab announces in `aria-keyshortcuts`.
 */
function TabRemoveMark({ onRemove }: { onRemove: () => void }) {
  const stop = (event: PointerEvent | MouseEvent) => event.stopPropagation();
  return (
    <span
      {...hooks.slot('remove')}
      aria-hidden="true"
      onPointerDown={stop}
      onPointerUp={stop}
      onMouseDown={(event) => {
        // Closing a tab neither selects nor focuses it.
        event.preventDefault();
        stop(event);
      }}
      onClick={(event) => {
        stop(event);
        onRemove();
      }}
    >
      <Glyph name="close" />
    </span>
  );
}

/** Adds `aria-keyshortcuts` to a removable tab, handing the result to the caller's `render`. */
function renderRemovable(render: TabRender | undefined): TabRender {
  return (props, state) => {
    const merged = { ...props, 'aria-keyshortcuts': 'Delete' };
    if (render) return render(merged, state);
    return 'href' in merged ? <a {...merged} /> : <div {...(merged as NativeProps<'div'>)} />;
  };
}

/** Switches between peer sections of one surface: a `TabList` of `Tab`s and their `TabPanel`s. */
export function Tabs({ size = 'md', className, ...rest }: TabsProps) {
  return <AriaTabs {...rest} {...hooks.root({ className, props: rest, data: { size } })} />;
}

/**
 * One tab. With `href` it renders a link that navigates through the provider's router
 * (`UiProvider` `navigate`) when selected. In a list with `onRemove` it draws a close mark.
 */
export function Tab({
  children,
  textValue,
  icon,
  count,
  countMax = 99,
  countLabel,
  render,
  className,
  ...rest
}: TabProps): ReactElement {
  const countId = useId();
  const onRemove = useContext(TabRemoveContext);
  const shown = normalizeCount(count);
  const describedBy =
    shown === null
      ? rest['aria-describedby']
      : [rest['aria-describedby'], countId].filter(Boolean).join(' ');
  const removable = onRemove !== undefined && rest.id !== undefined;
  // React Aria reads `textValue` from a collection item's props for its overflow menu entry.
  const text = { textValue: textValue ?? (typeof children === 'string' ? children : undefined) };

  return (
    <AriaTab
      {...rest}
      {...(text as object)}
      className={mergeClassNames(hooks.slotClass('tab'), className)}
      aria-describedby={describedBy}
      render={removable ? renderRemovable(render) : render}
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
      {removable ? (
        <TabRemoveMark onRemove={() => onRemove(new Set<Key>([rest.id as Key]))} />
      ) : null}
    </AriaTab>
  );
}

/** The content shown for the tab with the same `id`. */
export function TabPanel({ className, ...rest }: TabPanelProps) {
  return (
    <AriaTabPanel {...rest} className={mergeClassNames(hooks.slotClass('panel'), className)} />
  );
}

export { TabList } from './tab-list.js';
export type { TabListOverflow, TabListProps } from './tab-list.js';
