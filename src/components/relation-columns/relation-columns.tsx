'use client';

// Walks relations upstream and downstream of an item in Miller columns: choosing an item in a
// column opens the column of its related items beyond it.

import { type KeyboardEvent, type ReactNode, type RefObject, useId, useRef, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { isElement } from '../../utils/is-element.js';
import { useFocusRecovery } from '../../utils/use-focus-recovery.js';
import { Breadcrumb } from '../breadcrumb/breadcrumb.js';
import { type RelationColumnContext, RelationColumnView } from './relation-column.js';
import { relationColumnsHooks as hooks } from './relation-columns-hooks.js';
import {
  chooseRelation,
  emptyRelationPath,
  listRelationTrail,
  type RelationColumnsPath,
  type RelationDirection,
  resolveRelationColumns,
} from './relation-columns-model.js';

export interface RelationColumnsProps<T extends { id: Key }>
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The item the walk starts from, shown in the middle column. */
  item: T;
  /** The items related to an item upstream or downstream of it. */
  getRelated: (item: T, direction: RelationDirection) => readonly T[];
  /** An item's text, for typeahead, the trail and column titles. */
  getTextValue: (item: T) => string;
  /** Draws an item's title in its row. Defaults to its text. */
  renderItem?: ((item: T) => ReactNode) | undefined;
  /** The chosen items on each side, nearest first, controlled. */
  path?: RelationColumnsPath | undefined;
  /** The chosen items at first, uncontrolled; they reset when `item` changes. */
  defaultPath?: RelationColumnsPath | undefined;
  /** Called with the path after each choice. */
  onPathChange?: ((path: RelationColumnsPath) => void) | undefined;
  /** Called with the key of an item the reader activates (Enter or a double click), such as to start the walk from it. */
  onAction?: ((key: Key) => void) | undefined;
}

const rowSelector = '[role="row"]';

/** The path, the caller's when controlled, otherwise one of its own that resets with the item. */
function useRelationPath(options: {
  itemKey: Key;
  path: RelationColumnsPath | undefined;
  defaultPath: RelationColumnsPath | undefined;
  onPathChange: ((path: RelationColumnsPath) => void) | undefined;
}): [RelationColumnsPath, (path: RelationColumnsPath) => void] {
  const { itemKey, path, defaultPath, onPathChange } = options;
  const [own, setOwn] = useState({ itemKey, path: defaultPath ?? emptyRelationPath });
  // A new item takes the path over at once, so returning to an earlier item starts empty too.
  // The reset is not a choice and calls no `onPathChange`.
  if (path === undefined && own.itemKey !== itemKey) setOwn({ itemKey, path: emptyRelationPath });
  const current = path ?? (own.itemKey === itemKey ? own.path : emptyRelationPath);
  const setPath = (next: RelationColumnsPath) => {
    if (path === undefined) setOwn({ itemKey, path: next });
    onPathChange?.(next);
  };
  return [current, setPath];
}

/**
 * ArrowLeft and ArrowRight on an item move focus to the column beside it (mirrored right to left),
 * onto its chosen item or its first one. They are taken before the grid list's own row handling.
 */
function moveBetweenColumns(event: KeyboardEvent<HTMLElement>, isRightToLeft: boolean) {
  const isArrow = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
  const row = isElement(event.target) ? event.target : null;
  if (!isArrow || !row?.matches(rowSelector) || event.altKey || event.ctrlKey || event.metaKey)
    return;
  const columns = [...event.currentTarget.querySelectorAll(`.${hooks.slotClass('column')}`)];
  const index = columns.findIndex((column) => column.contains(row));
  const step = (event.key === 'ArrowRight') !== isRightToLeft ? 1 : -1;
  const target = columns[index + step];
  event.preventDefault();
  event.stopPropagation();
  if (target) findColumnRow(target)?.focus();
}

/** The row of a column that takes focus: its chosen item, else its first one. */
function findColumnRow(column: Element): HTMLElement | undefined {
  const rows = [...column.querySelectorAll<HTMLElement>(rowSelector)];
  return rows.find((entry) => entry.getAttribute('aria-selected') === 'true') ?? rows[0];
}

/**
 * Keeps focus in the columns when the column holding it closes, as a shorter path from the host
 * closes it: focus moves to the deepest column left on the same side, else the item's column.
 */
function useColumnFocusRecovery(columnsRef: RefObject<HTMLDivElement | null>) {
  useFocusRecovery(columnsRef, (lost) => {
    const closed = lost.closest(`.${hooks.slotClass('column')}`);
    const side = closed?.getAttribute('data-direction');
    const depth = Number(closed?.getAttribute('data-depth'));
    const columns = [
      ...(columnsRef.current?.querySelectorAll(`.${hooks.slotClass('column')}`) ?? []),
    ];
    const depthOf = (column: Element) => Number(column.getAttribute('data-depth'));
    const deepest = columns
      .filter((column) => column.getAttribute('data-direction') === side && depthOf(column) < depth)
      .sort((first, second) => depthOf(second) - depthOf(first))[0];
    const item = columns.find((column) => column.getAttribute('data-direction') === 'item');
    const target = deepest ?? item;
    return target ? findColumnRow(target) : null;
  });
}

/**
 * Relation columns: the item in the middle, the items upstream of it in the column before and those
 * downstream in the column after. Choosing an item in a side column opens the column of its own
 * related items further along that side, Miller-column style; each column counts its items and each
 * item the items further along. A breadcrumb trail shows the chosen path, and the arrow keys move
 * between the items of a column and between columns.
 */
export function RelationColumns<T extends { id: Key }>({
  item,
  getRelated,
  getTextValue,
  renderItem,
  path,
  defaultPath,
  onPathChange,
  onAction,
  className,
  ...rest
}: RelationColumnsProps<T>) {
  const strings = useUiStrings();
  const { direction: textDirection } = useLocale();
  const baseId = useId();
  const rootId = rest.id ?? `${baseId}-root`;
  const pathLabelId = `${baseId}-path`;
  // A name reference is not followed through the referenced element's own `aria-labelledby`, so the
  // caller's ids are named directly, and the root only when it carries its name in `aria-label`.
  const rootName = rest['aria-labelledby'] ?? (rest['aria-label'] ? rootId : undefined);
  const trailLabelledBy = rootName ? `${pathLabelId} ${rootName}` : pathLabelId;
  const [current, setPath] = useRelationPath({ itemKey: item.id, path, defaultPath, onPathChange });
  const columns = resolveRelationColumns({ item, path: current, getRelated });
  const columnsRef = useRef<HTMLDivElement>(null);
  useColumnFocusRecovery(columnsRef);
  const trail = listRelationTrail(columns);
  const context: RelationColumnContext<T> = {
    ...{ getRelated, getTextValue, renderItem, onAction },
    onSelect: (column, key) => {
      if (column.direction === 'item') return;
      setPath(chooseRelation(current, { direction: column.direction, depth: column.depth, key }));
    },
  };
  const onTrailAction = (key: Key) => {
    const step = trail[Number(key)];
    if (!step) return;
    const { direction, depth } = step.column;
    setPath(
      direction === 'item'
        ? emptyRelationPath
        : chooseRelation(current, { direction, depth, key: step.item.id }),
    );
  };
  return (
    <div role="group" {...rest} id={rootId} {...hooks.root({ className, props: rest })}>
      {/* Names the trail by its own name and the walk's, so several walks keep distinct landmarks. */}
      <span id={pathLabelId} hidden>
        {strings.relationPath}
      </span>
      <Breadcrumb
        aria-labelledby={trailLabelledBy}
        className={hooks.slotClass('path')}
        items={trail.map((step, index) => ({ id: index, label: getTextValue(step.item) }))}
        onAction={onTrailAction}
      />
      <div
        {...hooks.slot('columns')}
        ref={columnsRef}
        onKeyDownCapture={(event) => moveBetweenColumns(event, textDirection === 'rtl')}
      >
        {columns.map((column) => (
          <RelationColumnView
            key={`${column.direction}-${column.depth}`}
            column={column}
            context={context}
          />
        ))}
      </div>
    </div>
  );
}
