// Collections of rows the reader selects, reorders or scrolls through at length: React Aria's grid
// list in its stack layout, each row drawn with the list row's text.

import { useMemo, type ReactNode } from 'react';
import {
  Collection,
  DropIndicator,
  GridList,
  GridListHeader,
  GridListItem,
  GridListSection,
  type DragAndDropHooks,
  type DropTarget,
  type GridListItemProps as AriaGridListItemProps,
  type GridListProps as AriaGridListProps,
  type GridListSectionProps as AriaGridListSectionProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { ListRowContent, type ListRowContentProps, type ListRowTone } from './list-row.js';

export interface ListViewProps<T extends object>
  extends Omit<AriaGridListProps<T>, 'className' | 'style' | 'layout'>, BaseProps {
  /** Ask the stylesheet for dividers between rows. */
  divided?: boolean | undefined;
  /** Ask the stylesheet to keep each section's header in view while its rows scroll under it. */
  stickyHeaders?: boolean | undefined;
}

/** The item's `id` is its React Aria collection key. */
export interface ListViewItemProps<T extends object = object>
  extends
    Omit<AriaGridListItemProps<T>, 'className' | 'style' | 'children'>,
    Omit<BaseProps, 'id'>,
    Pick<ListRowContentProps, 'title' | 'meta' | 'icon' | 'leading'> {
  /** Controls after the row text, such as an action button; arrow keys reach them. */
  trailing?: ReactNode;
  /** Semantic emphasis, such as an overdue or failed item. Defaults to `neutral`. */
  tone?: ListRowTone | undefined;
}

/** The section's `id` is its React Aria collection key. */
export interface ListViewSectionProps<T extends object>
  extends Omit<AriaGridListSectionProps<T>, 'className' | 'style'>, Omit<BaseProps, 'id'> {
  /** The section's header row, which also names the section. */
  title: string;
}

const viewHooks = createHooks('list-view', ['drop-indicator']);
const itemHooks = createHooks('list-view-item', ['drag-handle', 'checkbox', 'trailing']);
const sectionHooks = createHooks('list-view-section', ['header']);

function renderDropIndicator(target: DropTarget) {
  return (
    <DropIndicator
      target={target}
      className={viewHooks.slotClass('drop-indicator')}
      render={(props) => (
        <div {...props} data-position={target.type === 'item' ? target.dropPosition : undefined} />
      )}
    />
  );
}

/** The caller's drag and drop hooks, drawing the list's own drop indicator unless they draw one. */
function useHookedDragAndDrop<T>(hooks: DragAndDropHooks<T> | undefined) {
  return useMemo(
    () => (hooks && !hooks.renderDropIndicator ? { ...hooks, renderDropIndicator } : hooks),
    [hooks],
  );
}

/**
 * A list of rows on React Aria's grid list: single or multiple selection with checkboxes, actions,
 * links, typeahead, sections, drag and drop, empty states and collection children (`Virtualizer`
 * with `ListLayout`, `GridListLoadMoreItem`) are React Aria's. For a plain list of links and
 * buttons, use `List`.
 */
export function ListView<T extends object>({
  divided = false,
  stickyHeaders = false,
  dragAndDropHooks,
  className,
  ...rest
}: ListViewProps<T>) {
  const hooks = useHookedDragAndDrop(dragAndDropHooks);
  return (
    <GridList
      {...rest}
      dragAndDropHooks={hooks}
      {...viewHooks.root({ className, props: rest, data: { divided, stickyHeaders } })}
    />
  );
}

/**
 * One row of a `ListView`: a drag handle while the list reorders, a selection checkbox while it
 * selects with toggles, the row text (`ListRowContent`) and trailing controls.
 */
export function ListViewItem<T extends object = object>({
  title,
  meta,
  icon,
  leading,
  trailing,
  tone = 'neutral',
  textValue,
  className,
  ...rest
}: ListViewItemProps<T>) {
  return (
    <GridListItem
      {...rest}
      textValue={textValue ?? (typeof title === 'string' ? title : undefined)}
      {...itemHooks.root({ className, props: rest, data: { tone } })}
    >
      {({ selectionMode, selectionBehavior, allowsDragging }) => (
        <>
          {allowsDragging ? <DragHandle className={itemHooks.slotClass('drag-handle')} /> : null}
          {selectionMode !== 'none' && selectionBehavior === 'toggle' ? (
            <Checkbox slot="selection" className={itemHooks.slotClass('checkbox')} />
          ) : null}
          <ListRowContent title={title} meta={meta} icon={icon} leading={leading} />
          {isEmptyNode(trailing) ? null : <div {...itemHooks.slot('trailing')}>{trailing}</div>}
        </>
      )}
    </GridListItem>
  );
}

/** A titled run of rows in a `ListView` (React Aria `GridListSection` with a header row). */
export function ListViewSection<T extends object>({
  title,
  items,
  dependencies,
  children,
  className,
  ...rest
}: ListViewSectionProps<T>) {
  return (
    <GridListSection {...rest} {...sectionHooks.root({ className, props: rest })}>
      <GridListHeader className={sectionHooks.slotClass('header')}>{title}</GridListHeader>
      <Collection items={items} dependencies={dependencies}>
        {children}
      </Collection>
    </GridListSection>
  );
}
