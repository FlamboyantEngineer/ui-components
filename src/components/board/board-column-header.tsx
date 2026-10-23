import { useRef, type KeyboardEvent } from 'react';
import { useLocale } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useItemDrag } from '../../utils/use-item-drag.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { ExpandToggle } from '../expand-toggle/expand-toggle.js';
import { IconButton } from '../icon-button/icon-button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { boardHooks as hooks } from './board-hooks.js';
import type { BoardColumnDrag } from './use-board-drag.js';

/** A column header's view of its column. */
export interface BoardColumnHeaderProps {
  columnKey: Key;
  title: string;
  /** The id of the title, which names the column's cells. */
  titleId: string;
  /** The cards in the column, across lanes. */
  count: number;
  limit: number | undefined;
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
  /** Column reordering, while the board takes column moves. */
  drag: BoardColumnDrag | null;
  /** Moves the column one place toward the start (-1) or the end (1) by keyboard. */
  onStep: (key: Key, step: -1 | 1) => void;
}

const steps: Readonly<Record<string, -1 | 1>> = { ArrowLeft: -1, ArrowRight: 1 };

/** A column header's drag and drop: it drags, and takes drops of another column of the board. */
function useColumnHeaderDrag({
  columnKey,
  title,
  drag,
}: Pick<BoardColumnHeaderProps, 'columnKey' | 'title' | 'drag'>) {
  const ref = useRef<HTMLDivElement>(null);
  const { dragProps, startDrag, isDragging, dropPosition } = useItemDrag({
    ref,
    key: columnKey,
    textValue: title,
    dragType: drag?.dragType ?? '',
    dragging: drag?.dragging ?? null,
    isDisabled: !drag,
    resolveMove: () => drag?.resolveDrop(columnKey) ?? null,
    onMove: (move) => drag?.onMove(move),
  });
  return { ref, props: dragProps, startDrag, isDragging, dropPosition };
}

/**
 * A board column's header: a drag handle while the board takes column moves (Alt+Arrow keys move
 * the column too), a collapse toggle, the title and the card count against the column's limit.
 */
export function BoardColumnHeader(props: BoardColumnHeaderProps) {
  const { columnKey, title, titleId, count, limit, isCollapsed, onCollapsedChange, drag, onStep } =
    props;
  const strings = useUiStrings();
  const { direction } = useLocale();
  const header = useColumnHeaderDrag({ columnKey, title, drag });
  const isOverLimit = limit !== undefined && count > limit;
  const onHandleKeyDown = (event: KeyboardEvent) => {
    const step = steps[event.key];
    if (!step || !isMoveChord(event)) return;
    event.preventDefault();
    onStep(columnKey, direction === 'rtl' ? (-step as -1 | 1) : step);
  };
  const data = {
    keyIdentity: toKeyIdentity(columnKey),
    collapsed: isCollapsed,
    overLimit: isOverLimit,
    dragging: header.isDragging,
    dropTarget: header.dropPosition !== null,
    position: header.dropPosition,
  };
  return (
    <div
      ref={header.ref}
      {...(drag ? header.props : {})}
      {...hooks.slot('column', data)}
      data-key={columnKey}
    >
      {drag ? (
        <IconButton
          icon="drag-handle"
          size="sm"
          label={strings.moveColumn(title)}
          className={hooks.slotClass('column-handle')}
          onPress={header.startDrag}
          onKeyDown={onHandleKeyDown}
        />
      ) : null}
      <ExpandToggle
        isExpanded={!isCollapsed}
        onExpandedChange={(isExpanded) => onCollapsedChange(!isExpanded)}
        label={isCollapsed ? strings.expandPanel(title) : strings.collapsePanel(title)}
        className={hooks.slotClass('column-toggle')}
      />
      <span id={titleId} {...hooks.slot('column-title')}>
        {title}
      </span>
      <span {...hooks.slot('column-count')}>
        <span aria-hidden="true">{limit === undefined ? count : `${count}/${limit}`}</span>
        <VisuallyHidden elementType="span">{strings.cardCount(count, limit)}</VisuallyHidden>
      </span>
    </div>
  );
}
