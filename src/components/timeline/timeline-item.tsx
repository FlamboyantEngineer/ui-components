'use client';

import { useId, type KeyboardEvent } from 'react';
import { useDateFormatter, useLocale, useNumberFormatter } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  readTimelineItem,
  readTimelineProgress,
  resolveKeyboardChange,
  toInlineStart,
  type TimelineItemChange,
  type TimelineScale,
} from './timeline-geometry.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
import { useItemMenu, type TimelineItemMenuOptions } from './timeline-item-menu.js';
import type { ItemPredecessors, PlacedItem } from './timeline-layout.js';
import { useTimelineDrag } from './use-timeline-drag.js';
import { isFreeEditKey } from '../../utils/is-free-edit-key.js';

interface TimelineItemSelection {
  isSelectable: boolean;
  isSelected: boolean;
  onToggle: (id: Key) => void;
}

interface TimelineItemButtonProps {
  placed: PlacedItem;
  predecessors: ItemPredecessors | undefined;
  scale: TimelineScale;
  dayWidth: number;
  isEditable: boolean;
  selection: TimelineItemSelection;
  menu: TimelineItemMenuOptions;
  onDraft: (change: TimelineItemChange | null) => void;
  onCommit: (change: TimelineItemChange) => void;
}

/** The text that describes an item: its days, progress, predecessors and how to move it. */
function useItemDescription(
  placed: PlacedItem,
  predecessors: ItemPredecessors | undefined,
  isEditable: boolean,
): string {
  const strings = useUiStrings();
  const days = useDateFormatter({ dateStyle: 'medium', timeZone: 'UTC' });
  const percent = useNumberFormatter({ style: 'percent' });
  const formatDay = (date: string) => days.format(new Date(date));
  const { read } = placed;
  const progress = readTimelineProgress(placed.item);
  const parts = [
    read.kind === 'milestone'
      ? strings.timelineMilestone(formatDay(read.start))
      : strings.timelineDates({ start: formatDay(read.start), end: formatDay(read.end) }),
    progress === undefined ? '' : strings.timelineProgress(percent.format(progress)),
    predecessors ? strings.timelineDependsOn(predecessors.names) : '',
    predecessors?.hasConflict ? strings.timelineConflict : '',
    isEditable ? strings.timelineKeyboardHint(read.kind) : '',
  ];
  return parts.filter(Boolean).join('. ');
}

/**
 * A bar or milestone: a button named by the item's label and described by its days, which moves by
 * pointer drag and arrow keys and, for a bar, resizes from its handles and with Shift and arrows.
 */
export function TimelineItemButton({
  placed,
  predecessors,
  scale,
  dayWidth,
  isEditable,
  selection,
  menu,
  onDraft,
  onCommit,
}: TimelineItemButtonProps) {
  const descriptionId = useId();
  const { item, read, left, right } = placed;
  const description = useItemDescription(placed, predecessors, isEditable);
  const isRtl = useLocale().direction === 'rtl';
  const drag = useTimelineDrag({
    ...{ read, source: readTimelineItem(item), dayWidth, isRtl, isEditable },
    ...{ onDraft, onCommit },
  });
  const progress = readTimelineProgress(placed.item);
  const isBar = read.kind === 'bar';
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const key = { key: event.key, shiftKey: event.shiftKey, isRtl };
    // Only plain arrows and Shift with arrows edit; other chords and composing keys pass by.
    const isEditKey = isEditable && isFreeEditKey(event.nativeEvent);
    const change = isEditKey ? resolveKeyboardChange(read, key, scale) : null;
    if (!change) return;
    event.preventDefault();
    if (change.start !== read.start || change.end !== read.end) onCommit(change);
  };
  const itemMenu = useItemMenu(item, menu, { onKeyDown });
  return (
    <>
      <button
        type="button"
        {...hooks.slot('item', {
          kind: read.kind,
          tone: item.tone ?? 'neutral',
          selected: selection.isSelectable && selection.isSelected,
          dragging: drag.isDragging,
          readonly: !isEditable,
          conflict: predecessors?.hasConflict,
        })}
        style={{
          position: 'absolute',
          ...toInlineStart(left, isRtl),
          width: isBar ? right - left : undefined,
          touchAction: isEditable ? 'none' : undefined,
        }}
        aria-label={item.label}
        aria-describedby={descriptionId}
        aria-pressed={selection.isSelectable ? selection.isSelected : undefined}
        onClick={() => {
          if (!drag.consumeDrag() && selection.isSelectable) selection.onToggle(item.id);
        }}
        {...drag.handlers}
        {...itemMenu.targetProps}
      >
        {progress === undefined ? null : (
          <span {...hooks.slot('progress')} style={{ width: `${progress * 100}%` }} />
        )}
        <span {...hooks.slot('item-label')}>{item.label}</span>
        {isBar && isEditable ? (
          <>
            <span {...hooks.slot('handle', { edge: 'start' })} />
            <span {...hooks.slot('handle', { edge: 'end' })} />
          </>
        ) : null}
        <span id={descriptionId} hidden>
          {description}
        </span>
      </button>
      {itemMenu.menu}
    </>
  );
}
