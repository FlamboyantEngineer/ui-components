// A board of cards in columns, optionally repeated in lanes: each cell is a React Aria grid list,
// and cards move within and between cells by drag and drop or Alt+Arrow keys.

import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createKeyIndex } from '../../utils/create-key-index.js';
import { useMemo, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { useLocale } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { BoardColumnHeader } from './board-column-header.js';
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

/** A column of the board. */
export interface BoardColumn {
  id: Key;
  /** The header text, which also names the column's cells. */
  title: string;
  /** The most cards the column should hold; more publish `data-over-limit`. */
  limit?: number | undefined;
}

/** A lane (swimlane) of the board: a row that repeats every column. */
export interface BoardLane {
  id: Key;
  /** The header text, which also names the lane. */
  title: string;
}

export interface BoardProps<T extends { id: Key }> extends BaseProps, AriaLabellingProps {
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
  /** Draws a card's content, such as a `Card` body or a custom layout. */
  renderCard: (item: T) => ReactNode;
  /** Turns on card moves by drag and drop and Alt+Arrow keys, and reports each one. */
  onMove?: ((move: BoardMove) => void) | undefined;
  /** Turns on column moves by drag and drop and Alt+Arrow keys, and reports each one. */
  onColumnMove?: ((move: BoardColumnMove) => void) | undefined;
  /** Called with the key of the card the reader activates. */
  onAction?: ((key: Key) => void) | undefined;
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
const editableSelector = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

function toDirection(key: string, isRightToLeft: boolean): BoardMoveDirection | null {
  if (key === 'ArrowUp') return 'up';
  if (key === 'ArrowDown') return 'down';
  if (key === 'ArrowLeft') return isRightToLeft ? 'next' : 'previous';
  if (key === 'ArrowRight') return isRightToLeft ? 'previous' : 'next';
  return null;
}

/** The card a keydown came from: the key of the card row around its target. */
function findCardKey(target: EventTarget, identities: ReadonlyMap<string, Key>): Key | undefined {
  if (!(target instanceof Element) || target.closest(editableSelector)) return undefined;
  const identity = target.closest(`.${hooks.slotClass('card')}`)?.getAttribute('data-key');
  return identity === null || identity === undefined ? undefined : identities.get(identity);
}

/** Gives focus back to a moved card or column handle once the move renders. */
function useMoveFocus(root: RefObject<HTMLDivElement | null>): FocusRequest {
  const request = useFocusRequest();
  return (kind, key) => {
    const escaped = CSS.escape(toKeyIdentity(key));
    const selector =
      kind === 'card'
        ? `.${hooks.slotClass('card')}[data-key-identity="${escaped}"]`
        : `.${hooks.slotClass('column')}[data-key-identity="${escaped}"] .${hooks.slotClass('column-handle')}`;
    request(() => root.current?.querySelector<HTMLElement>(selector));
  };
}

/** Alt+Arrow keys on a card: the move they make, reported, with focus kept on the card. */
function useCardKeys(options: {
  layout: BoardLayout;
  onMove: ((move: BoardMove) => void) | undefined;
  focus: FocusRequest;
}) {
  const { direction: textDirection } = useLocale();
  const { layout, onMove, focus } = options;
  const identities = useMemo(
    () => (onMove ? createKeyIndex(layout.addresses.keys()) : new Map()),
    [layout, onMove],
  );
  return (event: KeyboardEvent<HTMLElement>) => {
    const direction = toDirection(event.key, textDirection === 'rtl');
    if (!onMove || !direction || !isMoveChord(event)) return;
    const key = findCardKey(event.target, identities);
    const move =
      key === undefined ? undefined : resolveBoardKeyboardMove(layout, { key, direction });
    if (move === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    if (!move) return;
    focus('card', move.key);
    onMove(move);
  };
}

/** The column headers, with keyboard column moves that keep focus on the moved column's handle. */
function BoardColumnHeaders<T>({
  model,
  onColumnMove,
  focus,
}: {
  model: BoardModel<T>;
  onColumnMove: ((move: BoardColumnMove) => void) | undefined;
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
          titleId={model.columnTitleId(index)}
          count={model.countColumn(column.id)}
          limit={column.limit}
          isCollapsed={model.collapsedColumns.keys.has(column.id)}
          onCollapsedChange={(isCollapsed) =>
            model.collapsedColumns.setCollapsed(column.id, isCollapsed)
          }
          drag={drag}
          onStep={onStep}
        />
      ))}
    </div>
  );
}

/**
 * A board: columns of cards with a header each (title, count against an optional limit, collapse
 * toggle), optionally repeated in collapsible lanes. Cards are the caller's content in a React Aria
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
  onColumnMove,
  onAction,
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
  ...rest
}: BoardProps<T>) {
  const root = useRef<HTMLDivElement>(null);
  const focus = useMoveFocus(root);
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
  const onKeyDownCapture = useCardKeys({ layout, onMove, focus });
  const keyShortcuts = onMove ? cardShortcuts : undefined;
  const options = {
    renderCard,
    getTextValue,
    onAction,
    onAddCard,
    keyShortcuts,
    virtualized,
    drag,
  };
  return (
    <div
      ref={root}
      role="group"
      {...rest}
      {...hooks.root({ className, props: rest, data: { virtualized } })}
      onKeyDownCapture={onKeyDownCapture}
    >
      <BoardColumnHeaders model={model} onColumnMove={onColumnMove} focus={focus} />
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
