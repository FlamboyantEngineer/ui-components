'use client';

import {
  type ComponentProps,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
} from 'react';
import { DragHandleGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { formatCount } from '../../utils/count.js';
import { isElement } from '../../utils/is-element.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useItemDrag } from '../../utils/use-item-drag.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { Button } from '../button/button.js';
import { ExpandToggle } from '../expand-toggle/expand-toggle.js';
import { hasIcon, Icon, type IconSource, toIconProps } from '../icon/icon.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { boardHooks as hooks } from './board-hooks.js';
import type { BoardColumnDrag } from './use-board-drag.js';

/** A column header's view of its column. */
interface BoardColumnHeaderProps {
  columnKey: Key;
  title: string;
  /** A decorative icon before the title. */
  icon: IconSource;
  /** The id of the title, which names the column's cells. */
  titleId: string;
  /** The cards in the column, across lanes. */
  count: number;
  limit: number | undefined;
  /** Whether the column holds more cards than its limit. */
  isOverLimit: boolean;
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
  /** Column reordering, while the board takes column moves. */
  drag: BoardColumnDrag | null;
  /** Moves the column one place toward the start (-1) or the end (1) by keyboard. */
  onStep: (key: Key, step: -1 | 1) => void;
  /** The caller's controls drawn at the end of the header, or nothing. */
  actions: ReactNode;
}

const steps: Readonly<Record<string, -1 | 1>> = { ArrowLeft: -1, ArrowRight: 1 };

const columnShortcuts = 'Alt+ArrowLeft Alt+ArrowRight';

/** A `<button>` that publishes the column's move keys. */
const renderWithShortcuts = (domProps: ComponentProps<'button'>) => (
  <button {...domProps} aria-keyshortcuts={columnShortcuts} />
);

const isEmptyNode = (node: ReactNode) => node === undefined || node === null || node === false;

/** A column header's drag and drop: it drags, and takes drops of another column of the board. */
function useColumnHeaderDrag({
  columnKey,
  title,
  drag,
}: Pick<BoardColumnHeaderProps, 'columnKey' | 'title' | 'drag'>) {
  const ref = useRef<HTMLDivElement>(null);
  const pressedInActions = useRef(false);
  const { dragProps, startDrag, describedBy, isDragging, dropPosition } = useItemDrag({
    ref,
    key: columnKey,
    textValue: title,
    dragType: drag?.dragType ?? '',
    dragging: drag?.dragging ?? null,
    isDisabled: !drag,
    resolveMove: () => drag?.resolveDrop(columnKey) ?? null,
    onMove: (move) => drag?.onMove(move),
  });
  // The whole header is the native drag source, so a pointer that went down in the caller's actions
  // would drag the column: the drag is refused before React Aria starts it.
  const props = {
    ...dragProps,
    onPointerDownCapture: (event: PointerEvent) => {
      const target = isElement(event.target) ? event.target : null;
      pressedInActions.current = !!target?.closest(`.${hooks.slotClass('column-actions')}`);
    },
    onDragStartCapture: (event: DragEvent) => {
      if (!pressedInActions.current) return;
      event.preventDefault();
      event.stopPropagation();
    },
  };
  return { ref, props, startDrag, describedBy, isDragging, dropPosition };
}

/**
 * A column's title and its card count against its limit, both visually hidden while the column is
 * collapsed: the title still names the column's cells and the count is still read.
 */
function ColumnHeaderLabel({
  title,
  titleId,
  count,
  limit,
  isCollapsed,
}: Pick<BoardColumnHeaderProps, 'title' | 'titleId' | 'count' | 'limit' | 'isCollapsed'>) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const label = (
    <>
      <span id={titleId} {...hooks.slot('column-title')}>
        {title}
      </span>
      <span {...hooks.slot('column-count')}>
        <span aria-hidden="true">
          {limit === undefined
            ? formatCount(count, locale)
            : strings.cardCountOfLimit(count, limit)}
        </span>
        <VisuallyHidden as="span">{strings.cardCount(count, limit)}</VisuallyHidden>
      </span>
    </>
  );
  return isCollapsed ? <VisuallyHidden as="span">{label}</VisuallyHidden> : label;
}

/**
 * A board column's header: a drag handle while the board takes column moves (Alt+Arrow keys move
 * the column too), a collapse toggle, an optional decorative icon, the title, the card count
 * against the column's limit and the caller's actions. Collapsed, it shows only its toggle.
 */
export function BoardColumnHeader(props: BoardColumnHeaderProps) {
  const { columnKey, title, icon, titleId, count, limit, isOverLimit, isCollapsed } = props;
  const { onCollapsedChange, drag, onStep, actions } = props;
  const strings = useUiStrings();
  const { direction } = useLocale();
  const columnDrag = useColumnHeaderDrag({ columnKey, title, drag });
  const { ref, isDragging, dropPosition, describedBy, startDrag } = columnDrag;
  const onHandleKeyDown = (event: KeyboardEvent) => {
    const step = steps[event.key];
    if (!step || !isMoveChord(event)) return;
    event.preventDefault();
    event.stopPropagation();
    onStep(columnKey, direction === 'rtl' ? (-step as -1 | 1) : step);
  };
  const data = {
    keyIdentity: toKeyIdentity(columnKey),
    collapsed: isCollapsed,
    overLimit: isOverLimit,
    dragging: isDragging,
    dropTarget: dropPosition !== null,
    position: dropPosition,
  };
  const shortcutProps = { onKeyDown: onHandleKeyDown, render: renderWithShortcuts };
  return (
    <div
      ref={ref}
      {...(drag ? columnDrag.props : {})}
      {...hooks.slot('column', data)}
      data-key={columnKey}
    >
      {drag && !isCollapsed ? (
        <Button
          icon={DragHandleGlyph}
          size="sm"
          label={strings.moveColumn(title)}
          className={hooks.slotClass('column-handle')}
          aria-describedby={describedBy}
          onPress={startDrag}
          onKeyDown={onHandleKeyDown}
          render={renderWithShortcuts}
        />
      ) : null}
      {/* One toggle in both states, so it keeps focus as it collapses and expands. Collapsed, it is
          the header's one control: drawn with the column's icon, it takes the Alt+Arrow moves and
          its tooltip shows the hidden title and count. */}
      <ExpandToggle
        isExpanded={!isCollapsed}
        onExpandedChange={(isExpanded) => onCollapsedChange(!isExpanded)}
        label={isCollapsed ? strings.expandPanel(title) : strings.collapsePanel(title)}
        icon={isCollapsed && hasIcon(icon) ? icon : undefined}
        tooltip={isCollapsed ? `${title} ${strings.cardCount(count, limit)}` : undefined}
        className={hooks.slotClass('column-toggle')}
        {...(drag && isCollapsed ? shortcutProps : {})}
      />
      {hasIcon(icon) && !isCollapsed ? (
        <Icon {...toIconProps(icon)} className={hooks.slotClass('column-icon')} />
      ) : null}
      <ColumnHeaderLabel
        title={title}
        titleId={titleId}
        count={count}
        limit={limit}
        isCollapsed={isCollapsed}
      />
      {isEmptyNode(actions) || isCollapsed ? null : (
        <div {...hooks.slot('column-actions')}>{actions}</div>
      )}
    </div>
  );
}
