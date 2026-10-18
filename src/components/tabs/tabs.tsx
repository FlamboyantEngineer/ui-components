import {
  useContext,
  useId,
  type JSX,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  SelectionIndicator,
  Tab as AriaTab,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
} from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Key, NativeProps, Orientation, Size } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import type { ElementRender } from '../../utils/render-element.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import { TabRemoveContext } from './tab-list.js';

export type TabsSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** `automatic` selects a tab when focus reaches it; `manual` waits for Space or Enter. */
export type TabsKeyboardActivation = 'automatic' | 'manual';

/** The state `Tabs` passes to `render` with its root's props. */
export interface TabsRenderState {
  orientation: Orientation;
}

/** The states a `Tab` passes to `render` with its element's props. */
export interface TabRenderState {
  isSelected: boolean;
  isHovered: boolean;
  isPressed: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
}

/** The states a `TabPanel` passes to `render` with its element's props. */
export interface TabPanelRenderState {
  isFocused: boolean;
  isFocusVisible: boolean;
  /** A force-mounted panel whose tab is not selected. */
  isInert: boolean;
  isEntering: boolean;
  isExiting: boolean;
}

export interface TabsProps extends BaseProps {
  /** The root element. */
  ref?: Ref<HTMLDivElement> | undefined;
  /** The selected tab's `id` (controlled). */
  selectedKey?: Key | undefined;
  /** The initially selected tab's `id` when uncontrolled. Defaults to the first enabled tab. */
  defaultSelectedKey?: Key | undefined;
  /** Receives the `id` of the tab the reader selects. */
  onSelectionChange?: ((key: Key) => void) | undefined;
  /** The `id`s of tabs that cannot be selected or focused. */
  disabledKeys?: Iterable<Key> | undefined;
  /** Disables every tab. */
  isDisabled?: boolean | undefined;
  /** Lays the tabs out in a row or a column. Defaults to `horizontal`. */
  orientation?: Orientation | undefined;
  /** Whether focus alone selects a tab. Defaults to `automatic`. */
  keyboardActivation?: TabsKeyboardActivation | undefined;
  /** Tab block size. Defaults to `md`. */
  size?: TabsSize | undefined;
  /** The `TabList` and the `TabPanel`s. */
  children?: ReactNode;
  /** Replaces the root `<div>` with the caller's own, given its props and state. */
  render?: ElementRender<'div', TabsRenderState> | undefined;
}

export interface TabProps extends Omit<BaseProps, 'id'>, AriaLabellingProps {
  /** Pairs the tab with the `TabPanel` of the same `id`. */
  id?: Key | undefined;
  /** The tab's element. */
  ref?: Ref<HTMLDivElement> | undefined;
  /** Refuses selection and focus. */
  isDisabled?: boolean | undefined;
  /** Makes the tab a link that navigates when selected. */
  href?: string | undefined;
  /** Called when the tab is right-clicked or the context menu key is pressed on it. */
  onContextMenu?: NativeProps<'div'>['onContextMenu'];
  /**
   * Replaces the tab's element with the caller's own, given its props and state. A tab with `href`
   * receives an anchor's props and the replacement renders an `<a>`.
   */
  render?: ElementRender<'div', TabRenderState> | undefined;
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

export interface TabPanelProps extends Omit<BaseProps, 'id'> {
  /** Pairs the panel with the `Tab` of the same `id`. */
  id?: Key | undefined;
  /** The panel element. */
  ref?: Ref<HTMLDivElement> | undefined;
  /** Keeps the panel mounted, inert and hidden, while its tab is not selected. */
  shouldForceMount?: boolean | undefined;
  /** The panel's content. */
  children?: ReactNode;
  /** Replaces the panel's `<div>` with the caller's own, given its props and state. */
  render?: ElementRender<'div', TabPanelRenderState> | undefined;
}

interface TabCountProps {
  id: string;
  count: number;
  countMax: number;
  countLabel: string | undefined;
}

type TabRender = NonNullable<TabProps['render']>;
type TabElementProps = JSX.IntrinsicElements['div'] | JSX.IntrinsicElements['a'];

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
    return 'href' in merged ? (
      <a {...(merged as NativeProps<'a'>)} />
    ) : (
      <div {...(merged as NativeProps<'div'>)} />
    );
  };
}

/** The building block draws a tab with `href` as an `<a>`; its props reach the caller's `render`. */
function toTabRender(render: TabRender | undefined) {
  return render
    ? (props: TabElementProps, state: TabRenderState) =>
        render(props as JSX.IntrinsicElements['div'], state)
    : undefined;
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
      render={toTabRender(removable ? renderRemovable(render) : render)}
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
export type { TabListOverflow, TabListProps, TabListRenderState } from './tab-list.js';
