'use client';

// The context menus of a relation matrix: a cell's, which sets or removes its relation by kind,
// and a row or column header's, which moves, inserts beside or removes its item
// (specs/RELATION-MATRIX.md, UIC-RELATION-MATRIX-2.4 and 2.5).

import { type KeyboardEvent, type RefObject, useEffect, useRef, useState } from 'react';
import type { GlyphComponent } from '../../core/glyph-types.js';
import { CheckGlyph } from '../../core/glyphs.js';
import type { Key, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { useLocale } from '../../primitives/index.js';
import { isFocusLost } from '../../utils/composed-focus.js';
import { isElement, isHTMLElement } from '../../utils/is-element.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import {
  ContextMenu,
  useContextMenuTarget,
  useMenuController,
} from '../context-menu/context-menu.js';
import { Menu, type MenuEntry } from '../menu/menu.js';
import { type MenuActionIcons, resolveActionIcon } from '../menu/menu-action-icons.js';
import type { RelationMatrixIndex, RelationMatrixRelation } from './relation-matrix-model.js';
import { readPosition } from './use-matrix-navigation.js';

/** An item on one axis of the matrix. */
export interface RelationMatrixItem {
  id: Key;
  /** The header text. */
  label: string;
}

/** A kind of relation: how its mark reads and looks, and the tone the stylesheet draws it in. */
export interface RelationMatrixKind {
  id: string;
  /** Read in place of the mark, such as `Verifies`, and the kind's entry in the cell menu. */
  label: string;
  /** Published as the cell's `data-tone`. Defaults to `neutral`. */
  tone?: Tone | undefined;
  /** The mark's glyph, also drawn in the cell menu, such as a cross for a blocking kind. Defaults to `check`. */
  glyph?: GlyphComponent | undefined;
}

/** The cell an action happened on, with its relation: the one it holds, or the one it should hold. */
export interface RelationMatrixCell {
  row: Key;
  column: Key;
  relation: RelationMatrixRelation | null;
}

/** The header actions a matrix may offer: moving an item, inserting one beside it, removing it. */
export type RelationMatrixAxisOperation = 'move' | 'insert' | 'remove';

/** A header action on a row or column item, for its owner to apply. */
export interface RelationMatrixAxisAction {
  axis: 'row' | 'column';
  /** The item whose header the menu opened on. */
  item: Key;
  /**
   * Move the item one place earlier or later in its axis, insert a new item just before or after
   * it, or remove it.
   */
  action: 'move-before' | 'move-after' | 'insert-before' | 'insert-after' | 'remove';
}

/**
 * The built-in actions of the matrix's menus: a header's moves, inserts and removal, and a cell's
 * Remove relation. A cell's kinds take the kind's `glyph`.
 */
export type RelationMatrixMenuAction = RelationMatrixAxisAction['action'] | 'remove-relation';

/** Icons for the matrix's menu actions, by action; the actions have none by default. */
export type RelationMatrixMenuIcons = MenuActionIcons<RelationMatrixMenuAction>;

/** What a matrix menu opened on, by its items' keys. */
type MenuTarget = { type: 'cell'; row: Key; column: Key } | { type: 'row' | 'column'; item: Key };

interface MatrixMenuOptions {
  root: RefObject<HTMLDivElement | null>;
  rows: readonly RelationMatrixItem[];
  columns: readonly RelationMatrixItem[];
  index: RelationMatrixIndex;
  kinds: readonly RelationMatrixKind[] | undefined;
  onRelationChange: ((cell: RelationMatrixCell) => void) | undefined;
  onAxisAction: ((action: RelationMatrixAxisAction) => void) | undefined;
  axisActions: readonly RelationMatrixAxisOperation[];
  menuIcons: RelationMatrixMenuIcons | undefined;
}

/** A resolved menu: its name, entries and what each entry does. */
interface MenuModel {
  label: string;
  entries: MenuEntry[];
  onAction: (key: Key) => void;
}

function isKeyboardContextMenu(event: KeyboardEvent) {
  return event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
}

function separator(id: string): MenuEntry {
  return { type: 'separator', id };
}

/** The kinds a cell menu offers: the matrix's kinds, or one kindless `related` entry. */
function offeredKinds(kinds: readonly RelationMatrixKind[] | undefined, strings: UiStrings) {
  return kinds?.length ? kinds : [{ id: '', label: strings.related }];
}

/**
 * A cell's menu: one check item per kind, checked for the cell's own (choosing it again removes
 * the relation), then Remove relation, unavailable on an empty cell.
 */
function cellMenu(
  target: { row: RelationMatrixItem; column: RelationMatrixItem },
  options: MatrixMenuOptions,
  strings: UiStrings,
): MenuModel {
  const { row, column } = { row: target.row.id, column: target.column.id };
  const relation = options.index.get(row, column) ?? null;
  const kinds = offeredKinds(options.kinds, strings);
  const kindOf = (relation: RelationMatrixRelation | null) => relation?.kind ?? '';
  const entries: MenuEntry[] = kinds.map((kind) => ({
    id: `kind:${kind.id}`,
    label: kind.label,
    icon: ('glyph' in kind ? kind.glyph : undefined) ?? CheckGlyph,
    isSelected: relation !== null && kindOf(relation) === kind.id,
  }));
  entries.push(separator('cell-separator'), {
    id: 'remove',
    label: strings.removeRelation,
    icon: resolveActionIcon(options.menuIcons, 'remove-relation'),
    isDisabled: !relation,
  });
  const onAction = (key: Key) => {
    const kind = String(key).slice('kind:'.length);
    const isSame = relation !== null && kindOf(relation) === kind;
    const next: RelationMatrixRelation | null =
      key === 'remove' || isSame ? null : { row, column, ...(kind ? { kind } : {}) };
    options.onRelationChange?.({ row, column, relation: next });
  };
  return {
    label: strings.relationCellActions(target.row.label, target.column.label),
    entries,
    onAction,
  };
}

/** The visible sides of an axis: up and down for rows, left and right (mirrored) for columns. */
function axisSides(axis: 'row' | 'column', isRtl: boolean) {
  if (axis === 'row')
    return { before: 'up', after: 'down', above: 'above', below: 'below' } as const;
  return isRtl
    ? ({ before: 'right', after: 'left', above: 'right', below: 'left' } as const)
    : ({ before: 'left', after: 'right', above: 'left', below: 'right' } as const);
}

/**
 * A header's menu: Move one place each way (unavailable at the ends), Insert on each side and
 * Remove, as far as `axisActions` offers them, listed in the reading order of their sides.
 */
function axisMenu(
  target: { axis: 'row' | 'column'; item: RelationMatrixItem; at: number; count: number },
  options: MatrixMenuOptions,
  { strings, isRtl }: { strings: UiStrings; isRtl: boolean },
): MenuModel {
  const sides = axisSides(target.axis, isRtl);
  const mirrored = target.axis === 'column' && isRtl;
  const pair = (entries: MenuEntry[]) => (mirrored ? entries.reverse() : entries);
  const item = (
    id: RelationMatrixAxisAction['action'],
    label: string,
    isDisabled = false,
  ): MenuEntry => ({ id, label, icon: resolveActionIcon(options.menuIcons, id), isDisabled });
  const groups: MenuEntry[][] = [];
  if (options.axisActions.includes('move')) {
    groups.push(
      pair([
        item('move-before', strings.moveItem(sides.before), target.at === 0),
        item('move-after', strings.moveItem(sides.after), target.at === target.count - 1),
      ]),
    );
  }
  if (options.axisActions.includes('insert')) {
    groups.push(
      pair([
        item('insert-before', strings.insertRelationItem(sides.above)),
        item('insert-after', strings.insertRelationItem(sides.below)),
      ]),
    );
  }
  if (options.axisActions.includes('remove')) {
    groups.push([item('remove', strings.removeItem(target.item.label))]);
  }
  const entries = groups.flatMap((group, at) =>
    at === 0 ? group : [separator(`separator-${at}`), ...group],
  );
  const onAction = (key: Key) =>
    options.onAxisAction?.({
      axis: target.axis,
      item: target.item.id,
      action: key as RelationMatrixAxisAction['action'],
    });
  return { label: strings.relationItemActions(target.item.label), entries, onAction };
}

/** The menu of `target` while its items are still on the matrix, else `null`. */
function resolveMenu(
  target: MenuTarget | null,
  options: MatrixMenuOptions,
  context: { strings: UiStrings; isRtl: boolean },
): MenuModel | null {
  if (!target) return null;
  const { rows, columns } = options;
  if (target.type === 'cell') {
    const row = rows.find((item) => item.id === target.row);
    const column = columns.find((item) => item.id === target.column);
    return row && column ? cellMenu({ row, column }, options, context.strings) : null;
  }
  const items = target.type === 'row' ? rows : columns;
  const at = items.findIndex((item) => item.id === target.item);
  const item = items[at];
  if (!item) return null;
  return axisMenu({ axis: target.type, item, at, count: items.length }, options, context);
}

/** What a request from `node` inside the grid opens a menu on, if a menu is offered there. */
function findTarget(node: EventTarget, options: MatrixMenuOptions): MenuTarget | null {
  const position = readPosition(node);
  if (!position) return null;
  const row = options.rows[position.row];
  const column = options.columns[position.column];
  const hasAxisMenu = Boolean(options.onAxisAction) && options.axisActions.length > 0;
  if (row && column) {
    return options.onRelationChange ? { type: 'cell', row: row.id, column: column.id } : null;
  }
  if (!hasAxisMenu) return null;
  if (row && position.column === -1) return { type: 'row', item: row.id };
  if (column && position.row === -1) return { type: 'column', item: column.id };
  return null;
}

/** The grid cell holding `node`. */
function cellOf(node: EventTarget): HTMLElement | null {
  const cell = isElement(node) ? node.closest('[aria-colindex]') : null;
  return isHTMLElement(cell) ? cell : null;
}

/**
 * Gives focus back to the grid's focused cell once a closing menu has returned it, if focus then
 * fell to the body, as it does when the header the menu returns it to was removed.
 */
function refocusGrid(grid: HTMLElement | null) {
  if (!grid) return;
  const view = getOwnerWindow(grid);
  view.requestAnimationFrame(() =>
    view.requestAnimationFrame(() => {
      if (isFocusLost(grid)) grid.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    }),
  );
}

/**
 * The matrix's context menus on its grid: a secondary click or long touch on a cell or header, or
 * the Context Menu key or Shift+F10 on the focused one, opens that cell's or header's menu. The
 * menu acts on its items by key, and closes if they leave the matrix while it is open.
 */
export function useMatrixMenu(
  options: MatrixMenuOptions,
  grid: {
    ownRef: (node: HTMLDivElement | null) => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  },
) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const controller = useMenuController();
  const targetRef = useRef<HTMLElement | null>(null);
  const [target, setTarget] = useState<MenuTarget | null>(null);
  const model = resolveMenu(target, options, { strings, isRtl: direction === 'rtl' });
  const isGone = target !== null && model === null;
  useEffect(() => {
    if (isGone) controller.close();
  }, [isGone, controller]);
  const isDisabled =
    !options.onRelationChange && !(options.onAxisAction && options.axisActions.length > 0);
  const targetProps = useContextMenuTarget({
    controller,
    isDisabled,
    accepts: (node) => findTarget(node, options) !== null,
    own: {
      ref: grid.ownRef as (node: HTMLElement | null) => void,
      onContextMenu: (event) => {
        const next = findTarget(event.target, options);
        if (!next) return;
        setTarget(next);
        // The cell takes focus, so the menu gives it back there.
        cellOf(event.target)?.focus({ preventScroll: true });
      },
      onPointerDownCapture: (event) => {
        if (event.pointerType !== 'touch') return;
        const next = findTarget(event.target, options);
        if (next) setTarget(next);
      },
      onKeyDown: (event) => {
        grid.onKeyDown(event);
        if (isDisabled || event.defaultPrevented || !isKeyboardContextMenu(event)) return;
        const next = findTarget(event.target, options);
        const cell = cellOf(event.target);
        if (!next || !cell) return;
        // Opened against the focused cell rather than below the whole grid.
        event.preventDefault();
        setTarget(next);
        controller.open(cell);
      },
    },
    targetRef,
  });
  const onAction = (key: Key) => {
    model?.onAction(key);
    if (key === 'remove' && target?.type !== 'cell') refocusGrid(targetRef.current);
  };
  const menu =
    isDisabled || !model ? null : (
      <ContextMenu controller={controller} triggerRef={targetRef} aria-label={model.label}>
        <Menu items={model.entries} onAction={onAction} />
      </ContextMenu>
    );
  return { targetProps, menu };
}
