'use client';

import { PlusGlyph } from '../../core/glyphs.js';
import { createDropIndicator } from '../../utils/create-drop-indicator.js';
import { requireDefined } from '../../utils/require-defined.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { createKeyIndex } from '../../utils/create-key-index.js';
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  GridList,
  GridListItem,
  ListLayout,
  Rect,
  useDragAndDrop,
  Virtualizer,
} from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { boardHooks as hooks } from './board-hooks.js';
import type { BoardCellAddress } from './board-moves.js';
import type { BoardCardDrag } from './use-board-drag.js';
import type { BoardCardState } from './board.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { isElement } from '../../utils/is-element.js';
import { isMoveChord, type CollectionDropTarget } from '../../utils/use-reorder-drag-and-drop.js';

/** Scrolls the virtualized cell holding the card `key` toward it; other cells ignore the call. */
export type BoardCardReveal = (key: Key) => void;

/**
 * Takes a keydown the card `key` owns, its row's own or one from a widget in the card that left it
 * alone; returns whether the board claimed it.
 */
export type BoardCardKeyDown = (event: KeyboardEvent<HTMLElement>, key: Key) => boolean;

/** What every cell of a board draws its cards with. */
export interface BoardCellOptions<T> {
  /** Card moves by key, while the board takes card moves. */
  onCardKeyDown: BoardCardKeyDown | undefined;
  renderCard: (item: T, state: BoardCardState) => ReactNode;
  getTextValue: (item: T) => string;
  onAction: ((key: Key) => void) | undefined;
  onAddCard: ((cell: BoardCellAddress) => void) | undefined;
  /** The `aria-keyshortcuts` of a card while the board takes card moves. */
  keyShortcuts: string | undefined;
  virtualized: boolean;
  drag: BoardCardDrag | null;
  /** Where each virtualized cell registers its `BoardCardReveal` for focus after a move. */
  reveals: Set<BoardCardReveal>;
}

interface BoardCellProps<T> {
  address: BoardCellAddress;
  /** The cell's cards, in order. */
  items: readonly T[];
  isCollapsed: boolean;
  isOverLimit: boolean;
  /** The ids of the column title and, with lanes, the lane title, which name the cell. */
  labelledBy: string | undefined;
  options: BoardCellOptions<T>;
}

/** The estimated height of a card in a virtualized cell, in pixels; cards are measured. */
const estimatedCardHeight = 96;

type CardLayoutOptions = NonNullable<ConstructorParameters<typeof ListLayout>[0]> & {
  /** Lay out only the cards in view; otherwise every card renders. */
  isVirtualized: boolean;
};

/**
 * A cell's list layout, which renders only the cards in view while the board is virtualized and
 * every card otherwise. Every cell renders through the virtualizer either way, so that turning
 * virtualization on or off keeps the cards, their focus and their state mounted. It wraps one
 * layout instance, since library source extends no class (I1).
 */
function createCardLayout(): ListLayout<unknown, CardLayoutOptions> {
  const layout = new ListLayout<unknown, CardLayoutOptions>();
  let isVirtualized = true;
  const update = layout.update.bind(layout);
  layout.update = (context) => {
    isVirtualized = context.layoutOptions?.isVirtualized ?? true;
    update(context);
  };
  const shouldInvalidate = layout.shouldInvalidateLayoutOptions.bind(layout);
  layout.shouldInvalidateLayoutOptions = (next, previous) =>
    next.isVirtualized !== previous.isVirtualized || shouldInvalidate(next, previous);
  const getVisible = layout.getVisibleLayoutInfos.bind(layout);
  layout.getVisibleLayoutInfos = (rect) =>
    getVisible(isVirtualized ? rect : new Rect(0, 0, Infinity, Infinity));
  return layout;
}

type DragAndDropOptions = Parameters<typeof useDragAndDrop>[0];

const renderDropIndicator = createDropIndicator(hooks.slotClass('drop-indicator'));

/**
 * Scrolls a virtualized cell toward its card at `index`, which it does not render, so that the
 * virtualizer renders it: the card's place is estimated from the rendered card nearest to it (or the
 * cell's start), and each later call starts from a nearer, measured card.
 */
function scrollTowardCard(grid: HTMLElement, cards: { keys: readonly Key[]; index: number }) {
  const { keys, index } = cards;
  const indexes = new Map(keys.map((key, at) => [toKeyIdentity(key), at]));
  const origin = grid.getBoundingClientRect().top - grid.scrollTop;
  let anchor = { index: 0, top: 0 };
  for (const row of grid.querySelectorAll(`.${hooks.slotClass('card')}`)) {
    const at = indexes.get(row.getAttribute('data-key-identity') ?? '');
    if (at === undefined || Math.abs(at - index) >= Math.abs(anchor.index - index)) continue;
    anchor = { index: at, top: row.getBoundingClientRect().top - origin };
  }
  const top = anchor.top + (index - anchor.index) * estimatedCardHeight;
  grid.scrollTop = Math.max(0, top - grid.clientHeight / 2);
}

/**
 * Registers a virtualized cell's `BoardCardReveal`, so that a card moved into the cell by keyboard
 * renders and takes focus wherever the cell is scrolled.
 */
function useCardReveal<T extends { id: Key }>(
  reveals: Set<BoardCardReveal> | null,
  items: readonly T[],
) {
  const grid = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!reveals) return;
    const reveal: BoardCardReveal = (key) => {
      const keys = items.map((item) => item.id);
      const index = keys.indexOf(key);
      if (index >= 0 && grid.current) scrollTowardCard(grid.current, { keys, index });
    };
    reveals.add(reveal);
    return () => {
      reveals.delete(reveal);
    };
  }, [reveals, items]);
  return grid;
}

/**
 * A cell's grid list drag and drop hooks: its cards drag with the board's media type, and it takes
 * drops of the board's cards wherever `resolveDrop` lets them land. React Aria keeps the hooks a
 * list mounts with, so they stay, disabled, while the board has no `drag`.
 */
function useCellDragAndDrop(
  drag: BoardCardDrag | null,
  { column, lane }: BoardCellAddress,
  keys: ReadonlyMap<string, Key>,
) {
  const options = useMemo<DragAndDropOptions>(() => {
    const address = { column, lane };
    const decodeTarget = (target: CollectionDropTarget): CollectionDropTarget | null => {
      if (target.type === 'root') return target;
      const key = keys.get(String(target.key));
      return key === undefined ? null : { ...target, key };
    };
    return {
      getItems: (dragged) =>
        drag
          ? [...dragged].map((key) => ({
              [drag.dragType]: String(key),
              'text/plain': drag.getTextValue(requireDefined(keys.get(String(key)))),
            }))
          : [],
      getAllowedDropOperations: () => ['move'],
      acceptedDragTypes: drag ? [drag.dragType] : [],
      onDragStart: ({ keys: dragged }) =>
        drag?.setDragging(keys.get(String([...dragged][0])) ?? null),
      onDragEnd: () => drag?.setDragging(null),
      getDropOperation: (target) => {
        const decoded = decodeTarget(target);
        return decoded && drag?.resolveDrop(address, decoded) ? 'move' : 'cancel';
      },
      onDrop: ({ target }) => {
        const decoded = decodeTarget(target);
        if (decoded) drag?.drop(address, decoded);
      },
      renderDropIndicator,
      isDisabled: drag === null,
    };
  }, [drag, column, lane, keys]);
  return useDragAndDrop(options).dragAndDropHooks;
}

/** Text widgets a host draws in a card, which keep the arrow keys for their caret. */
const textWidgets = '[role="textbox"], [role="combobox"]';

/** The keys a text control in a card leaves to the grid: moving focus out and closing. */
const passedKeys = new Set(['Tab', 'Escape']);

/** Whether a keydown's target is in a nested collection's row, such as a board drawn in the card. */
function isNestedKey(event: KeyboardEvent<HTMLElement>): boolean {
  const { target, currentTarget } = event;
  return !isElement(target) || target.closest('[role="row"]') !== currentTarget;
}

/**
 * Whether a keydown belongs to a text control inside the card: its caret keys, move chords and
 * characters, which the row's navigation, the board's moves and the grid's typeahead leave to it.
 */
function isTextKey(event: KeyboardEvent<HTMLElement>): boolean {
  return !passedKeys.has(event.key) && isEditableTarget(event.target, textWidgets);
}

/**
 * Draws a card's row. React Aria's row capture, which moves focus between the card's controls, does
 * not take a text control's key, a key from a nested collection's row, or (while the board takes
 * card moves) a move chord. A text control's key stops at the row, so neither the board nor the
 * grid's navigation and typeahead take it, and its default editing goes ahead; Tab and Escape pass. A move chord reaches the board on
 * the way back up, after a widget in the card has had it and left it alone (not `preventDefault`).
 */
function createCardRow(
  key: Key,
  {
    keyShortcuts,
    onCardKeyDown,
  }: Pick<BoardCellOptions<unknown>, 'keyShortcuts' | 'onCardKeyDown'>,
) {
  return (domProps: ComponentProps<'div'>) => (
    <div
      {...domProps}
      aria-keyshortcuts={keyShortcuts}
      onKeyDownCapture={(event) => {
        if (isTextKey(event) || isNestedKey(event)) return;
        if (onCardKeyDown && isMoveChord(event) && event.key.startsWith('Arrow')) return;
        domProps.onKeyDownCapture?.(event);
      }}
      onKeyDown={(event) => {
        if (isTextKey(event)) {
          event.stopPropagation();
          return;
        }
        const isOwn = !event.defaultPrevented && !isNestedKey(event);
        if (isOwn && onCardKeyDown?.(event, key)) return;
        domProps.onKeyDown?.(event);
      }}
    />
  );
}

/**
 * The cell's cards: a grid list of the caller's card content, virtualized on request. A collapsed
 * column's cell keeps its cards and draws no empty state.
 */
function BoardCards<T extends { id: Key }>({
  address,
  items,
  isCollapsed,
  labelledBy,
  options,
}: BoardCellProps<T>) {
  const strings = useUiStrings();
  const { renderCard, getTextValue, onAction, keyShortcuts, virtualized, drag } = options;
  const keys = useMemo(() => createKeyIndex(items.map((item) => item.id)), [items]);
  const dragAndDropHooks = useCellDragAndDrop(drag, address, keys);
  const grid = useCardReveal(virtualized ? options.reveals : null, items);
  const [layout] = useState(createCardLayout);
  const renderEmptyState = useCallback(
    () => (
      <EmptyState size="sm" description={strings.noCards} className={hooks.slotClass('empty')} />
    ),
    [strings.noCards],
  );
  const cardState = { isColumnCollapsed: isCollapsed };
  const list = (
    <GridList
      ref={grid}
      aria-labelledby={labelledBy}
      items={items}
      dependencies={[renderCard, getTextValue, keyShortcuts, options.onCardKeyDown, isCollapsed]}
      onAction={
        onAction &&
        ((key) => {
          const original = keys.get(String(key));
          if (original !== undefined) onAction(original);
        })
      }
      dragAndDropHooks={dragAndDropHooks}
      renderEmptyState={isCollapsed ? undefined : renderEmptyState}
      {...hooks.slot('cards', { virtualized, reordering: drag !== null })}
    >
      {(item) => (
        <GridListItem
          id={toCollectionKey(item.id)}
          textValue={getTextValue(item)}
          {...hooks.slot('card', { keyIdentity: toKeyIdentity(item.id) })}
          render={createCardRow(item.id, options)}
        >
          {({ allowsDragging }) => (
            <>
              {allowsDragging && drag ? (
                <DragHandle className={hooks.slotClass('card-handle')} />
              ) : null}
              <div {...hooks.slot('card-content')}>{renderCard(item, cardState)}</div>
            </>
          )}
        </GridListItem>
      )}
    </GridList>
  );
  return (
    <Virtualizer
      layout={layout}
      layoutOptions={{ estimatedRowSize: estimatedCardHeight, isVirtualized: virtualized }}
      shouldObserveItemSize
    >
      {list}
    </Virtualizer>
  );
}

/**
 * One column of one lane: its cards, then the add-card button when the board takes new cards. A
 * collapsed column's cell keeps its cards mounted, drawn narrower, without the add-card button.
 */
export function BoardCell<T extends { id: Key }>(props: BoardCellProps<T>) {
  const strings = useUiStrings();
  const { address, isCollapsed, isOverLimit, labelledBy, options } = props;
  const { onAddCard } = options;
  const data = { collapsed: isCollapsed, overLimit: isOverLimit };
  return (
    <div {...hooks.slot('cell', data)}>
      <BoardCards {...props} />
      {onAddCard && !isCollapsed ? (
        <Button
          variant="ghost"
          size="sm"
          startIcon={PlusGlyph}
          aria-describedby={labelledBy}
          className={hooks.slotClass('add')}
          onPress={() => onAddCard(address)}
        >
          {strings.addCard}
        </Button>
      ) : null}
    </div>
  );
}
