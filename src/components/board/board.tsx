'use client';

// A board of cards in columns, optionally repeated in lanes: each cell is a React Aria grid list,
// and cards move within and between cells by drag and drop or Alt+Arrow keys.

import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useCallback, useState, type ReactNode, type RefObject } from 'react';
import { useLocale } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import type { BoardCardKeyDown, BoardCardReveal } from './board-cell.js';
import { BoardColumnHeader } from './board-column-header.js';
import type { IconSource } from '../icon/icon.js';
import { boardHooks as hooks } from './board-hooks.js';
import { BoardCells, BoardLaneGroup } from './board-lane.js';
import {
  resolveBoardKeyboardMove,
  stepColumnMove,
  type BoardCellAddress,
  type BoardColumnMove,
  type BoardLayout,
  type BoardMove,
  type BoardMoveDirection,
} from './board-moves.js';
import { useBoardModel, type BoardModel } from './use-board-model.js';
import { useBoardCardDrag, useBoardColumnDrag } from './use-board-drag.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useLatest } from '../../utils/use-latest.js';

/** A column of the board. */
export interface BoardColumn {
  id: Key;
  /** The header text, which also names the column's cells. */
  title: string;
  /** The most cards the column should hold; more publish `data-over-limit`. */
  limit?: number | undefined;
  /** A decorative icon before the title: an icon component or a rendered element. */
  icon?: IconSource;
}

/** What a board tells `renderCard` about where a card is drawn. */
export interface BoardCardState {
  /** The card's column is collapsed, so the card is drawn as narrow as the column. */
  isColumnCollapsed: boolean;
}

/** A lane (swimlane) of the board: a row that repeats every column. */
export interface BoardLane {
  id: Key;
  /** The header text, which also names the lane. */
  title: string;
  /** A decorative icon before the title: an icon component or a rendered element. */
  icon?: IconSource;
}

export interface BoardProps<T extends { id: Key }>
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The columns, in order. */
  columns: readonly BoardColumn[];
  /** The lanes, in order. Without them the board is one row of columns. */
  lanes?: readonly BoardLane[] | undefined;
  /** The cards as data, in order within each cell. */
  items: readonly T[];
  /** The column a card belongs to. */
  getColumn: (item: T) => Key;
  /** The lane a card belongs to, on a board with lanes. */
  getLane?: ((item: T) => Key) | undefined;
  /** A card's text, for typeahead, its drag handle and what it carries when dragged. */
  getTextValue: (item: T) => string;
  /**
   * Draws a card's content, such as a `Card` body or a custom layout. A collapsed column keeps its
   * cards, drawn as narrow as the column: `isColumnCollapsed` lets the caller draw a shorter card.
   */
  renderCard: (item: T, state: BoardCardState) => ReactNode;
  /** Turns on card moves by drag and drop and Alt+Arrow keys, and reports each one. */
  onMove?: ((move: BoardMove) => void) | undefined;
  /**
   * What starts a card's pointer drag: anywhere on the card (`card`, the default), or only its drag
   * handle (`handle`), which leaves presses elsewhere in the card, such as in a field, to the card.
   */
  dragTrigger?: 'card' | 'handle' | undefined;
  /** Turns on column moves by drag and drop and Alt+Arrow keys, and reports each one. */
  onColumnMove?: ((move: BoardColumnMove) => void) | undefined;
  /** Called with the key of the card the reader activates. */
  onAction?: ((key: Key) => void) | undefined;
  /** Draws controls at the end of a column's header, such as a menu or a button, for each column. */
  renderColumnActions?: ((column: BoardColumn) => ReactNode) | undefined;
  /** Shows an add-card button in every cell and reports which cell it was pressed in. */
  onAddCard?: ((cell: BoardCellAddress) => void) | undefined;
  /** The collapsed columns, controlled. */
  collapsedColumns?: Iterable<Key> | undefined;
  /** The columns collapsed at first, uncontrolled. */
  defaultCollapsedColumns?: Iterable<Key> | undefined;
  /** Called with the collapsed columns after each change. */
  onCollapsedColumnsChange?: ((keys: Set<Key>) => void) | undefined;
  /** The collapsed lanes, controlled. */
  collapsedLanes?: Iterable<Key> | undefined;
  /** The lanes collapsed at first, uncontrolled. */
  defaultCollapsedLanes?: Iterable<Key> | undefined;
  /** Called with the collapsed lanes after each change. */
  onCollapsedLanesChange?: ((keys: Set<Key>) => void) | undefined;
  /** Remembers uncontrolled collapsed columns and lanes through the provider storage. */
  persistKey?: string | undefined;
  /** Renders only the cards in view in each cell; the stylesheet must bound the cells' height. */
  virtualized?: boolean | undefined;
}

/** What a keyboard move hands focus back to once it renders. */
type FocusRequest = (kind: 'card' | 'column', key: Key) => void;

const cardShortcuts = 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight';

function toDirection(key: string, isRightToLeft: boolean): BoardMoveDirection | null {
  if (key === 'ArrowUp') return 'up';
  if (key === 'ArrowDown') return 'down';
  if (key === 'ArrowLeft') return isRightToLeft ? 'next' : 'previous';
  if (key === 'ArrowRight') return isRightToLeft ? 'previous' : 'next';
  return null;
}

/**
 * Gives focus back to a moved card or column handle once the move renders. A card a virtualized
 * cell does not render is scrolled toward until it renders and takes focus.
 */
function useMoveFocus(
  root: RefObject<HTMLDivElement | null>,
  reveals: ReadonlySet<BoardCardReveal>,
): FocusRequest {
  const request = useFocusRequest();
  return (kind, key) => {
    const escaped = CSS.escape(toKeyIdentity(key));
    const selector =
      kind === 'card'
        ? `.${hooks.slotClass('card')}[data-key-identity="${escaped}"]`
        : `.${hooks.slotClass('column')}[data-key-identity="${escaped}"] .${hooks.slotClass('column-handle')}`;
    request(() => {
      const element = root.current?.querySelector<HTMLElement>(selector);
      if (!element && kind === 'card') for (const reveal of reveals) reveal(key);
      return element;
    });
  };
}

/**
 * Alt+Arrow keys on a card: the move they make, reported, with focus kept on the card. The card's
 * row hands over only the keydowns it owns, with the card's own key, so a nested board's card or a
 * widget in the card never moves another board's card. Returns whether the keydown was claimed.
 */
function useCardKeys(options: {
  layout: BoardLayout;
  onMove: ((move: BoardMove) => void) | undefined;
  focus: FocusRequest;
}): BoardCardKeyDown | undefined {
  const { direction: textDirection } = useLocale();
  const latest = useLatest({ ...options, isRightToLeft: textDirection === 'rtl' });
  // One handler for the board's life, so that the cells' rows do not redraw when it would change.
  const onCardKeyDown = useCallback<BoardCardKeyDown>(
    (event, key) => {
      const { layout, onMove, focus, isRightToLeft } = latest.current;
      const direction = toDirection(event.key, isRightToLeft);
      if (!onMove || !direction || !isMoveChord(event)) return false;
      const move = resolveBoardKeyboardMove(layout, { key, direction });
      if (move === undefined) return false;
      event.preventDefault();
      event.stopPropagation();
      if (move) {
        focus('card', move.key);
        onMove(move);
      }
      return true;
    },
    [latest],
  );
  return options.onMove ? onCardKeyDown : undefined;
}

/** The column headers, with keyboard column moves that keep focus on the moved column's handle. */
function BoardColumnHeaders<T>({
  model,
  onColumnMove,
  renderColumnActions,
  focus,
}: {
  model: BoardModel<T>;
  onColumnMove: ((move: BoardColumnMove) => void) | undefined;
  renderColumnActions: ((column: BoardColumn) => ReactNode) | undefined;
  focus: FocusRequest;
}) {
  const drag = useBoardColumnDrag({ columns: model.columnKeys, onMove: onColumnMove });
  const onStep = (key: Key, step: -1 | 1) => {
    const move = stepColumnMove(model.columnKeys, key, step);
    if (!move) return;
    focus('column', key);
    onColumnMove?.(move);
  };
  return (
    <div {...hooks.slot('columns')}>
      {model.columns.map((column, index) => (
        <BoardColumnHeader
          key={toKeyIdentity(column.id)}
          columnKey={column.id}
          title={column.title}
          icon={column.icon}
          titleId={model.columnTitleId(index)}
          count={model.countColumn(column.id)}
          limit={column.limit}
          isOverLimit={model.isOverLimit(column)}
          isCollapsed={model.collapsedColumns.keys.has(column.id)}
          onCollapsedChange={(isCollapsed) =>
            model.collapsedColumns.setCollapsed(column.id, isCollapsed)
          }
          drag={drag}
          onStep={onStep}
          actions={renderColumnActions?.(column)}
        />
      ))}
    </div>
  );
}

/**
 * A board: columns of cards with a header each (title, count against an optional limit, collapse
 * toggle, optional caller actions), optionally repeated in collapsible lanes. Cards are the caller's content in a React Aria
 * grid list per cell; with `onMove` they move within and between cells by pointer or keyboard drag
 * and drop and Alt+Arrow keys, and with `onColumnMove` columns reorder. The board never moves cards
 * or columns itself: the owner applies each reported move.
 */
export function Board<T extends { id: Key }>({
  columns,
  lanes,
  items,
  getColumn,
  getLane,
  getTextValue,
  renderCard,
  onMove,
  dragTrigger = 'card',
  onColumnMove,
  onAction,
  renderColumnActions,
  onAddCard,
  collapsedColumns,
  defaultCollapsedColumns,
  onCollapsedColumnsChange,
  collapsedLanes,
  defaultCollapsedLanes,
  onCollapsedLanesChange,
  persistKey,
  virtualized = false,
  className,
  ref,
  ...rest
}: BoardProps<T>) {
  const [root, setRoot] = useForwardedRef(ref);
  const [reveals] = useState(() => new Set<BoardCardReveal>());
  const focus = useMoveFocus(root, reveals);
  const model = useBoardModel({
    ...{ columns, lanes, items, getColumn, getLane, persistKey },
    ...{ collapsedColumns, defaultCollapsedColumns, onCollapsedColumnsChange },
    ...{ collapsedLanes, defaultCollapsedLanes, onCollapsedLanesChange },
  });
  const { itemsByKey, layout } = model;
  const drag = useBoardCardDrag({
    layout,
    onMove,
    getTextValue: (key) => {
      const item = itemsByKey.get(key);
      return item ? getTextValue(item) : String(key);
    },
  });
  const onCardKeyDown = useCardKeys({ layout, onMove, focus });
  const keyShortcuts = onMove ? cardShortcuts : undefined;
  const options = {
    ...{ onCardKeyDown, renderCard, getTextValue, onAction, onAddCard, keyShortcuts },
    ...{ virtualized, drag, isHandleDrag: dragTrigger === 'handle', reveals },
  };
  return (
    <div
      ref={setRoot}
      role="group"
      {...rest}
      {...hooks.root({ className, props: rest, data: { virtualized } })}
    >
      <BoardColumnHeaders {...{ model, onColumnMove, renderColumnActions, focus }} />
      {lanes ? (
        lanes.map((lane, index) => (
          <BoardLaneGroup
            key={toKeyIdentity(lane.id)}
            model={model}
            lane={lane}
            index={index}
            options={options}
          />
        ))
      ) : (
        <BoardCells model={model} lane={null} options={options} />
      )}
    </div>
  );
}
