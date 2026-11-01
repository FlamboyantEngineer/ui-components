'use client';

// Collections of rows the reader selects, reorders or scrolls through at length: React Aria's grid
// list in its stack layout, each row drawn with the list row's text.

import { createDropIndicator } from '../../utils/create-drop-indicator.js';
import { createContext, use, useMemo, type ReactElement, type ReactNode } from 'react';
import {
  Collection,
  GridList,
  GridListHeader,
  GridListItem,
  GridListLoadMoreItem,
  GridListSection,
  ListLayout,
  useDragAndDrop,
  Virtualizer,
} from '../../primitives/index.js';
import type { AriaLabellingProps, CollectionSelectionProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionSelectionProps } from '../../utils/collection-selection.js';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { toCollectionItemKey } from '../../utils/to-collection-key.js';
import { useCarriedFocus } from '../../utils/use-carried-focus.js';
import { useKeptCollectionAttributes } from '../../utils/use-kept-collection-attributes.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { useHeldSelection } from '../../utils/use-held-selection.js';
import {
  useReorderDragAndDrop,
  type CollectionDropTarget,
} from '../../utils/use-reorder-drag-and-drop.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { ListRowContent, type ListRowContentProps, type ListRowTone } from './list-row.js';
import { keepControlFocusReturn } from '../../utils/keep-control-focus-return.js';
import { renderTextKeyRow } from '../../utils/text-control-keys.js';

/** A reorder request: move `keys` before or after the row `targetKey`. */
export interface ListViewMove {
  /** The moved rows. */
  keys: Key[];
  /** The row the moved rows land beside. */
  targetKey: Key;
  /** Which side of the target they land on. */
  position: 'before' | 'after';
}

/** Opt-in row reordering by drag and drop. */
export interface ListViewReorderOptions {
  /** Reports one move. The list never reorders its rows itself: apply the move and re-render. */
  onMove: (move: ListViewMove) => void;
}

/** Rows as children, or a function drawing a row or section from each of `items`. */
export type ListViewChildren<T> = ReactNode | ((item: T) => ReactElement);

export interface ListViewProps<T extends object>
  extends BaseProps, AriaLabellingProps, CollectionSelectionProps {
  /** The rows or sections as data, drawn by the function in `children`. */
  items?: Iterable<T> | undefined;
  /** `ListViewItem`s and `ListViewSection`s, or a function drawing one from each of `items`. */
  children?: ListViewChildren<T>;
  /** Values that, when they change, redraw the rows drawn from `items`. */
  dependencies?: readonly unknown[] | undefined;
  /** Called with the key of the row the reader activates. */
  onAction?: ((key: Key) => void) | undefined;
  /** Ask the stylesheet for dividers between rows. */
  divided?: boolean | undefined;
  /** Ask the stylesheet to keep each section's header in view while its rows scroll under it. */
  stickyHeaders?: boolean | undefined;
  /** Turns on row reordering by drag and drop, by pointer or from a row's drag handle. */
  reorder?: ListViewReorderOptions | undefined;
  /** Renders only the rows in view; the stylesheet must bound the list's height. */
  virtualized?: boolean | undefined;
  /** Row height in pixels for a virtualized list. Defaults to 48. */
  rowHeight?: number | undefined;
  /** Asks for more rows when the end of the list scrolls into view. */
  onLoadMore?: (() => void) | undefined;
  /** More rows are loading: a loading row follows the rows. */
  isLoading?: boolean | undefined;
  /** Draws the list while it has no rows. */
  renderEmptyState?: (() => ReactNode) | undefined;
}

export interface ListViewItemProps
  extends Omit<BaseProps, 'id'>, Pick<ListRowContentProps, 'title' | 'meta' | 'icon' | 'leading'> {
  /** The row's key in the list. */
  id?: Key | undefined;
  /** The text typeahead matches. Defaults to a string `title`. */
  textValue?: string | undefined;
  /** Makes the row a link: pressing it or Enter follows the address. */
  href?: string | undefined;
  /** Controls after the row text, such as an action button; arrow keys reach them. */
  trailing?: ReactNode;
  /** Semantic emphasis, such as an overdue or failed item. Defaults to `neutral`. */
  tone?: ListRowTone | undefined;
}

export interface ListViewSectionProps<T extends object> extends Omit<BaseProps, 'id'> {
  /** The section's key in the list. */
  id?: Key | undefined;
  /** The section's header row, which also names the section. */
  title: string;
  /** The section's rows as data, drawn by the function in `children`. */
  items?: Iterable<T> | undefined;
  /** `ListViewItem`s, or a function drawing one from each of `items`. */
  children?: ListViewChildren<T>;
  /** Values that, when they change, redraw the rows drawn from `items`. */
  dependencies?: readonly unknown[] | undefined;
}

const viewHooks = createHooks('list-view', ['drop-indicator', 'loader']);
const itemHooks = createHooks('list-view-item', ['drag-handle', 'checkbox', 'trailing']);
const sectionHooks = createHooks('list-view-section', ['header']);

/** Whether the list reorders now: its drag and drop hooks stay mounted, disabled, when it does not. */
const ReorderingContext = createContext(false);

const defaultRowHeight = 48;

const renderDropIndicator = createDropIndicator(viewHooks.slotClass('drop-indicator'));

function getKeyText(key: Key): string {
  return String(fromCollectionKey(key));
}

/** The move a drop makes, of the dragged rows not disabled now, or null. */
function resolveListMove(
  target: CollectionDropTarget,
  keys: ReadonlySet<Key>,
  disabled: ReadonlySet<Key>,
): ListViewMove | null {
  if (target.type !== 'item' || target.dropPosition === 'on' || keys.has(target.key)) return null;
  const moved = [...keys].map(fromCollectionKey).filter((key) => !disabled.has(key));
  if (moved.length === 0) return null;
  return { keys: moved, targetKey: fromCollectionKey(target.key), position: target.dropPosition };
}

/** The building block's drag and drop hooks for the list's reorder options. */
function useListDragAndDrop(
  reorder: ListViewReorderOptions | undefined,
  disabled: ReadonlySet<Key>,
) {
  const options = useReorderDragAndDrop<ListViewMove>({
    resolveMove: (target, keys) => resolveListMove(target, keys, disabled),
    onMove: (move) => reorder?.onMove(move),
    getTextValue: getKeyText,
    renderDropIndicator,
  });
  // React Aria keeps the hooks a list mounts with, so they stay and are disabled without reorder.
  const { dragAndDropHooks } = useDragAndDrop({ ...options, isDisabled: !reorder });
  return dragAndDropHooks;
}

/** The rows: children, or the rows drawn from `items`, and the loading row when loading more. */
function ListViewRows<T extends object>(
  props: Pick<ListViewProps<T>, 'items' | 'children' | 'dependencies' | 'onLoadMore' | 'isLoading'>,
) {
  const strings = useUiStrings();
  const { items, children, dependencies, onLoadMore, isLoading = false } = props;
  return (
    <>
      <Collection items={items} dependencies={dependencies}>
        {keyCollectionChildren(children)}
      </Collection>
      {onLoadMore ? (
        <GridListLoadMoreItem
          className={viewHooks.slotClass('loader')}
          isLoading={isLoading}
          onLoadMore={onLoadMore}
        >
          <EmptyState variant="loading" size="sm" description={strings.loading} />
        </GridListLoadMoreItem>
      ) : null}
    </>
  );
}

/**
 * A list of rows on React Aria's grid list: single or multiple selection with checkboxes, actions,
 * links, typeahead, sections, reordering by drag and drop, virtualization, loading more and an
 * empty state. For a plain list of links and buttons, use `List`.
 */
export function ListView<T extends object>({
  items,
  children,
  dependencies,
  divided = false,
  stickyHeaders = false,
  reorder,
  virtualized = false,
  rowHeight = defaultRowHeight,
  onLoadMore,
  isLoading,
  renderEmptyState,
  selectedKeys,
  defaultSelectedKeys,
  disabledKeys,
  onSelectionChange,
  onAction,
  className,
  ...rest
}: ListViewProps<T>) {
  // Read once per new iterable, which may be one-shot, and shared by the selection and drops.
  const disabled = useMemo(() => new Set(disabledKeys ?? []), [disabledKeys]);
  const dragAndDropHooks = useListDragAndDrop(reorder, disabled);
  const selection = useHeldSelection({ selectedKeys, defaultSelectedKeys, onSelectionChange });
  const carriedRef = useCarriedFocus<HTMLDivElement>(String(virtualized));
  const keptRef = useKeptCollectionAttributes<HTMLDivElement>(rest);
  const listRef = useMergedRefs(carriedRef, keptRef);
  const emptyState = useMemo(
    () => renderEmptyState && (() => renderEmptyState()),
    [renderEmptyState],
  );
  const list = (
    <GridList
      {...rest}
      {...toCollectionSelectionProps({ ...selection, disabledKeys: disabled })}
      ref={listRef}
      onAction={onAction && ((key) => onAction(fromCollectionKey(key)))}
      dragAndDropHooks={dragAndDropHooks}
      renderEmptyState={emptyState}
      {...viewHooks.root({
        className,
        props: rest,
        data: { divided, stickyHeaders, reordering: reorder !== undefined },
      })}
    >
      <ListViewRows {...{ items, children, dependencies, onLoadMore, isLoading }} />
    </GridList>
  );
  const layoutOptions = { rowHeight, headingHeight: rowHeight, loaderHeight: rowHeight };
  return (
    <ReorderingContext value={reorder !== undefined}>
      {virtualized ? (
        <Virtualizer layout={ListLayout} layoutOptions={layoutOptions}>
          {list}
        </Virtualizer>
      ) : (
        list
      )}
    </ReorderingContext>
  );
}

/**
 * One row of a `ListView`: a drag handle while the list reorders, a selection checkbox while it
 * selects with toggles, the row text (`ListRowContent`) and trailing controls.
 */
export function ListViewItem({
  id,
  title,
  meta,
  icon,
  leading,
  trailing,
  tone = 'neutral',
  textValue,
  className,
  ...rest
}: ListViewItemProps) {
  const isReordering = use(ReorderingContext);
  return (
    <GridListItem
      {...rest}
      id={toCollectionItemKey(id)}
      textValue={textValue ?? (typeof title === 'string' ? title : undefined)}
      {...itemHooks.root({ className, props: rest, data: { tone } })}
      render={renderTextKeyRow}
    >
      {({ selectionMode, selectionBehavior, allowsDragging }) => (
        <>
          {allowsDragging && isReordering ? (
            <DragHandle className={itemHooks.slotClass('drag-handle')} />
          ) : null}
          {selectionMode !== 'none' && selectionBehavior === 'toggle' ? (
            <Checkbox size="sm" slot="selection" className={itemHooks.slotClass('checkbox')} />
          ) : null}
          <ListRowContent title={title} meta={meta} icon={icon} leading={leading} />
          {isEmptyNode(trailing) ? null : (
            <div ref={keepControlFocusReturn} {...itemHooks.slot('trailing')}>
              {trailing}
            </div>
          )}
        </>
      )}
    </GridListItem>
  );
}

/** A titled run of rows in a `ListView` (React Aria `GridListSection` with a header row). */
export function ListViewSection<T extends object>({
  id,
  title,
  items,
  dependencies,
  children,
  className,
  ...rest
}: ListViewSectionProps<T>) {
  return (
    <GridListSection
      {...rest}
      id={toCollectionItemKey(id)}
      {...sectionHooks.root({ className, props: rest })}
    >
      <GridListHeader className={sectionHooks.slotClass('header')}>{title}</GridListHeader>
      <Collection items={items} dependencies={dependencies}>
        {keyCollectionChildren(children)}
      </Collection>
    </GridListSection>
  );
}
