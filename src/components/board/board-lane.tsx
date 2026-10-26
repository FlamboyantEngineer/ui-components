import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ExpandToggle } from '../expand-toggle/expand-toggle.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { BoardLane } from './board.js';
import { BoardCell, type BoardCellOptions } from './board-cell.js';
import { boardHooks as hooks } from './board-hooks.js';
import type { BoardModel } from './use-board-model.js';

interface BoardCellsProps<T> {
  model: BoardModel<T>;
  /** The lane the cells belong to; `null` on a board without lanes. */
  lane: Key | null;
  /** The id of the lane's title, which names its cells with their column's title. */
  laneTitleId?: string | undefined;
  options: BoardCellOptions<T>;
}

interface BoardLaneGroupProps<T> {
  model: BoardModel<T>;
  lane: BoardLane;
  index: number;
  options: BoardCellOptions<T>;
}

/** One cell per column of a lane, or of a board without lanes. */
export function BoardCells<T extends { id: Key }>({
  model,
  lane,
  laneTitleId,
  options,
}: BoardCellsProps<T>) {
  return (
    <div {...hooks.slot('cells')}>
      {model.columns.map((column, index) => (
        <BoardCell
          key={toKeyIdentity(column.id)}
          address={{ column: column.id, lane }}
          items={model.getCellItems(column.id, lane)}
          isCollapsed={model.collapsedColumns.keys.has(column.id)}
          isOverLimit={model.isOverLimit(column)}
          labelledBy={[model.columnTitleId(index), laneTitleId].filter(Boolean).join(' ')}
          options={options}
        />
      ))}
    </div>
  );
}

/**
 * A lane: a group named by its header (collapse toggle, title, card count) holding one cell per
 * column, which a collapsed lane hides.
 */
export function BoardLaneGroup<T extends { id: Key }>({
  model,
  lane,
  index,
  options,
}: BoardLaneGroupProps<T>) {
  const strings = useUiStrings();
  const titleId = model.laneTitleId(index);
  const isCollapsed = model.collapsedLanes.keys.has(lane.id);
  const count = model.countLane(lane.id);
  return (
    <div role="group" aria-labelledby={titleId} {...hooks.slot('lane', { collapsed: isCollapsed })}>
      <div {...hooks.slot('lane-header')}>
        <ExpandToggle
          isExpanded={!isCollapsed}
          onExpandedChange={(isExpanded) => model.collapsedLanes.setCollapsed(lane.id, !isExpanded)}
          label={isCollapsed ? strings.expandPanel(lane.title) : strings.collapsePanel(lane.title)}
          className={hooks.slotClass('lane-toggle')}
        />
        <span id={titleId} {...hooks.slot('lane-title')}>
          {lane.title}
        </span>
        <span {...hooks.slot('lane-count')}>
          <span aria-hidden="true">{count}</span>
          <VisuallyHidden elementType="span">{strings.cardCount(count)}</VisuallyHidden>
        </span>
      </div>
      {isCollapsed ? null : (
        <BoardCells model={model} lane={lane.id} laneTitleId={titleId} options={options} />
      )}
    </div>
  );
}
