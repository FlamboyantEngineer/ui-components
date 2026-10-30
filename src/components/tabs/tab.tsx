'use client';

import {
  useContext,
  useId,
  useRef,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { SelectionIndicator, Tab as AriaTab } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { dataAttributes, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Key, NativeProps, SelectableState } from '../../core/props.js';
import { mergeProps } from '../../utils/merge-props.js';
import { normalizeCount } from '../../utils/count.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionItemKey } from '../../utils/to-collection-key.js';
import type { ElementRender } from '../../utils/render-element.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import {
  isTabDisabled,
  TabActionsContext,
  TabsSharedContext,
  type TabActions,
} from './tab-actions.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import { useTabMenuTarget } from './tab-menu.js';
import { joinIds, TabCount, TabRemoveMark } from './tab-parts.js';
import { useTabDrag, type TabDropPosition, type TabReorder } from './tab-reorder.js';

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
  render?: ElementRender<'div', SelectableState> | undefined;
  /** The tab's label. */
  children?: ReactNode;
  /** The tab's text in an overflow menu, a rename field and a drag, when its label is not plain text. */
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

/** The drag and drop of a movable tab: its element's props, ref and states. */
interface TabDrag {
  dragProps: object;
  ref: RefObject<HTMLElement | null>;
  isDragging: boolean;
  dropPosition: TabDropPosition | null;
}

interface TabItemProps extends TabProps {
  actions: TabActions;
  drag?: TabDrag | undefined;
}

type TabRender = NonNullable<TabProps['render']>;
type TabElementProps = JSX.IntrinsicElements['div'] | JSX.IntrinsicElements['a'];

/** Whether a tab refuses focus: on its own, through the list's `disabledKeys`, or with the list. */
function useIsTabDisabled(key: Key | undefined, isDisabled: boolean | undefined): boolean {
  const shared = useContext(TabsSharedContext);
  return isDisabled === true || (key !== undefined && isTabDisabled(shared, key));
}

/** Merges the props a list adds into the tab's element, handing the result to the caller's `render`. */
function renderWithProps(render: TabRender | undefined, extra: object): TabRender {
  return (props, state) => {
    const merged = mergeProps(props, extra);
    if (render) return render(merged, state);
    return 'href' in merged ? (
      <a {...(merged as NativeProps<'a'>)} />
    ) : (
      <div {...(merged as NativeProps<'div'>)} />
    );
  };
}

/** A tab's plain-text name: its `textValue`, or a label that is plain text. */
function readTabText(textValue: string | undefined, children: ReactNode): string | undefined {
  return textValue ?? (typeof children === 'string' ? children : undefined);
}

/** The building block draws a tab with `href` as an `<a>`; its props reach the caller's `render`. */
function toTabRender(render: TabRender | undefined) {
  return render
    ? (props: TabElementProps, state: SelectableState) =>
        render(props as JSX.IntrinsicElements['div'], state)
    : undefined;
}

/** The props a list's actions add to the element of the tab `key`. */
function useTabActionProps(
  actions: TabActions,
  {
    key,
    isDisabled,
    drag,
    onContextMenu,
  }: {
    key: Key | undefined;
    isDisabled: boolean;
    drag: TabDrag | undefined;
    onContextMenu: TabProps['onContextMenu'];
  },
) {
  const menuTarget = useTabMenuTarget(actions.menu, { tabKey: key, isDisabled, onContextMenu });
  const { rename, keyShortcuts } = actions;
  if (key === undefined) return { menuTarget, extra: null };
  const extra = mergeProps(
    drag ? { ...drag.dragProps, ref: drag.ref } : {},
    menuTarget ?? {},
    rename && !isDisabled ? { onDoubleClick: () => rename.start(key) } : {},
    keyShortcuts ? { 'aria-keyshortcuts': keyShortcuts } : {},
  );
  return { menuTarget, extra: Object.keys(extra).length > 0 ? extra : null };
}

function TabItem({
  actions,
  drag,
  children,
  textValue,
  icon,
  count,
  countMax = 99,
  countLabel,
  render,
  className,
  onContextMenu,
  ...rest
}: TabItemProps): ReactElement {
  const countId = useId();
  const key = rest.id;
  const isDisabled = useIsTabDisabled(key, rest.isDisabled);
  const { menuTarget, extra } = useTabActionProps(actions, {
    key,
    isDisabled,
    drag,
    onContextMenu,
  });
  const { rename, onRemove } = actions;
  const shown = normalizeCount(count) || null;
  const describedBy =
    shown === null ? rest['aria-describedby'] : joinIds(rest['aria-describedby'], countId);
  const name = readTabText(textValue, children);
  // React Aria reads `textValue` from a collection item's props for its overflow menu entry.
  const text = { textValue: name };

  return (
    <AriaTab
      {...rest}
      {...(text as object)}
      {...dataAttributes({
        dragging: drag?.isDragging,
        dropPosition: drag?.dropPosition,
        renaming: rename !== null && key !== undefined && rename.editingKey === key,
      })}
      onContextMenu={menuTarget ? undefined : onContextMenu}
      className={mergeClassNames(hooks.slotClass('tab'), className)}
      aria-describedby={describedBy}
      render={toTabRender(extra ? renderWithProps(render, extra) : render)}
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
      {onRemove && key !== undefined ? (
        <TabRemoveMark
          onRemove={() => {
            if (!isDisabled) onRemove(new Set<Key>([key]));
          }}
        />
      ) : null}
    </AriaTab>
  );
}

/** A tab of a reorderable list: it drags, and takes drops of the list's other tabs. */
function MovableTab({ reorder, ...props }: TabItemProps & { reorder: TabReorder; id: Key }) {
  const ref = useRef<HTMLElement | null>(null);
  const isRenaming = props.actions.rename?.editingKey === props.id;
  const isDisabled = useIsTabDisabled(props.id, props.isDisabled) || isRenaming;
  const textValue =
    readTabText(props.textValue, props.children) ?? String(fromCollectionKey(props.id));
  const drag = useTabDrag({ tabKey: props.id, textValue, isDisabled, ref, reorder });
  return <TabItem {...props} drag={{ ...drag, ref }} />;
}

/**
 * One tab. With `href` it renders a link that navigates through the provider's router
 * (`UiProvider` `navigate`) when selected. In a list that takes them it draws a close mark, renames
 * in place, drags and opens a menu of its actions.
 */
export function Tab({ id, ...props }: TabProps): ReactElement {
  const actions = useContext(TabActionsContext);
  const { reorder } = actions;
  // The list's actions, its panels and its selection all work on the collection key.
  const key = toCollectionItemKey(id);
  return reorder && key !== undefined ? (
    <MovableTab {...props} id={key} actions={actions} reorder={reorder} />
  ) : (
    <TabItem {...props} id={key} actions={actions} />
  );
}
