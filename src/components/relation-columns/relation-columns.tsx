// Walks relations upstream and downstream of an item in Miller columns: choosing an item in a
// column opens the column of its related items beyond it.

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useLocale } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Breadcrumb } from '../breadcrumb/breadcrumb.js';
import { RelationColumnView, type RelationColumnContext } from './relation-column.js';
import { relationColumnsHooks as hooks } from './relation-columns-hooks.js';
import {
  chooseRelation,
  emptyRelationPath,
  listRelationTrail,
  resolveRelationColumns,
  type RelationColumnsPath,
  type RelationDirection,
} from './relation-columns-model.js';

export interface RelationColumnsProps<T extends { id: Key }> extends BaseProps, AriaLabellingProps {
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
  const row = event.target instanceof Element ? event.target : null;
  if (!isArrow || !row?.matches(rowSelector) || event.altKey || event.ctrlKey || event.metaKey)
    return;
  const columns = [...event.currentTarget.querySelectorAll(`.${hooks.slotClass('column')}`)];
  const index = columns.findIndex((column) => column.contains(row));
  const step = (event.key === 'ArrowRight') !== isRightToLeft ? 1 : -1;
  const target = columns[index + step];
  const rows = target ? [...target.querySelectorAll<HTMLElement>(rowSelector)] : [];
  const next = rows.find((entry) => entry.getAttribute('aria-selected') === 'true') ?? rows[0];
  event.preventDefault();
  event.stopPropagation();
  next?.focus();
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
  const [current, setPath] = useRelationPath({ itemKey: item.id, path, defaultPath, onPathChange });
  const columns = resolveRelationColumns({ item, path: current, getRelated });
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
        aria-labelledby={`${pathLabelId} ${rootId}`}
        className={hooks.slotClass('path')}
        items={trail.map((step, index) => ({ id: index, label: getTextValue(step.item) }))}
        onAction={onTrailAction}
      />
      <div
        {...hooks.slot('columns')}
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
