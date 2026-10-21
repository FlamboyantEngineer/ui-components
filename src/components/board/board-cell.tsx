import { createDropIndicator } from '../../utils/create-drop-indicator.js';
import { useCallback, useMemo, type ReactNode } from 'react';
import {
  GridList,
  GridListItem,
  ListLayout,
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

/** What every cell of a board draws its cards with. */
export interface BoardCellOptions<T> {
  renderCard: (item: T) => ReactNode;
  getTextValue: (item: T) => string;
  onAction: ((key: Key) => void) | undefined;
  onAddCard: ((cell: BoardCellAddress) => void) | undefined;
  /** The `aria-keyshortcuts` of a card while the board takes card moves. */
  keyShortcuts: string | undefined;
  virtualized: boolean;
  drag: BoardCardDrag | null;
}

export interface BoardCellProps<T> {
  address: BoardCellAddress;
  /** The cell's cards, in order. */
  items: readonly T[];
  isCollapsed: boolean;
  isOverLimit: boolean;
  /** The ids of the column title and, with lanes, the lane title, which name the cell. */
  labelledBy: string;
  options: BoardCellOptions<T>;
}

/** The estimated height of a card in a virtualized cell, in pixels; cards are measured. */
const estimatedCardHeight = 96;

type DragAndDropOptions = Parameters<typeof useDragAndDrop>[0];

/** The options of a cell that does not drag: neither draggable nor droppable. */
const noDragAndDrop: DragAndDropOptions = {};

const renderDropIndicator = createDropIndicator(hooks.slotClass('drop-indicator'));

/**
 * A cell's grid list drag and drop hooks: its cards drag with the board's media type, and it takes
 * drops of the board's cards wherever `resolveDrop` lets them land. `undefined` without `drag`.
 */
function useCellDragAndDrop(drag: BoardCardDrag | null, { column, lane }: BoardCellAddress) {
  const options = useMemo<DragAndDropOptions>(() => {
    if (!drag) return noDragAndDrop;
    const address = { column, lane };
    return {
      getItems: (keys) =>
        [...keys].map((key) => ({
          [drag.dragType]: String(key),
          'text/plain': drag.getTextValue(key),
        })),
      getAllowedDropOperations: () => ['move'],
      acceptedDragTypes: [drag.dragType],
      onDragStart: ({ keys }) => drag.setDragging([...keys][0] ?? null),
      onDragEnd: () => drag.setDragging(null),
      getDropOperation: (target) => (drag.resolveDrop(address, target) ? 'move' : 'cancel'),
      onDrop: ({ target }) => drag.drop(address, target),
      renderDropIndicator,
    };
  }, [drag, column, lane]);
  const { dragAndDropHooks } = useDragAndDrop(options);
  return drag ? dragAndDropHooks : undefined;
}

/** The cell's cards: a grid list of the caller's card content, virtualized on request. */
function BoardCards<T extends { id: Key }>({
  address,
  items,
  labelledBy,
  options,
}: BoardCellProps<T>) {
  const strings = useUiStrings();
  const { renderCard, getTextValue, onAction, keyShortcuts, virtualized, drag } = options;
  const dragAndDropHooks = useCellDragAndDrop(drag, address);
  const renderEmptyState = useCallback(
    () => (
      <EmptyState size="sm" description={strings.noCards} className={hooks.slotClass('empty')} />
    ),
    [strings.noCards],
  );
  const list = (
    <GridList
      // React Aria keeps drag and drop hooks for the list's lifetime: remount when moves toggle.
      key={drag ? 'drag' : 'static'}
      aria-labelledby={labelledBy}
      items={items}
      dependencies={[renderCard, getTextValue, keyShortcuts]}
      onAction={onAction}
      dragAndDropHooks={dragAndDropHooks}
      renderEmptyState={renderEmptyState}
      {...hooks.slot('cards', { virtualized })}
    >
      {(item) => (
        <GridListItem
          id={item.id}
          textValue={getTextValue(item)}
          className={hooks.slotClass('card')}
          render={(domProps) => <div {...domProps} aria-keyshortcuts={keyShortcuts} />}
        >
          {({ allowsDragging }) => (
            <>
              {allowsDragging ? <DragHandle className={hooks.slotClass('card-handle')} /> : null}
              <div {...hooks.slot('card-content')}>{renderCard(item)}</div>
            </>
          )}
        </GridListItem>
      )}
    </GridList>
  );
  if (!virtualized) return list;
  return (
    <Virtualizer layout={ListLayout} layoutOptions={{ estimatedRowSize: estimatedCardHeight }}>
      {list}
    </Virtualizer>
  );
}

/**
 * One column of one lane: its cards, then the add-card button when the board takes new cards. A
 * collapsed column's cell stays as an empty placeholder so the lanes keep their columns aligned.
 */
export function BoardCell<T extends { id: Key }>(props: BoardCellProps<T>) {
  const strings = useUiStrings();
  const { address, isCollapsed, isOverLimit, labelledBy, options } = props;
  const { onAddCard } = options;
  const data = { collapsed: isCollapsed, overLimit: isOverLimit };
  if (isCollapsed) return <div {...hooks.slot('cell', data)} />;
  return (
    <div {...hooks.slot('cell', data)}>
      <BoardCards {...props} />
      {onAddCard ? (
        <Button
          variant="ghost"
          size="sm"
          startIcon="plus"
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
