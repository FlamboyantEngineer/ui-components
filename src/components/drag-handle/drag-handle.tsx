'use client';

import { DragHandleGlyph } from '../../core/glyphs.js';
import type { PointerEvent } from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { armElementDrag } from '../../utils/pointer-drag.js';
import { Icon } from '../icon/icon.js';
import { isElement } from '../../utils/is-element.js';

export interface DragHandleProps extends BaseProps, AriaLabellingProps {
  /** Refuses dragging, for a row that cannot move. */
  isDisabled?: boolean | undefined;
  /** Keeps the handle out of the tab sequence. Defaults to `true`; the arrow keys reach it. */
  excludeFromTabOrder?: boolean | undefined;
}

const hooks = createHooks('drag-handle');

/** The enabled drag handle drawn in `row` itself, not in a collection nested inside it. */
function findRowHandle(row: Element): Element | undefined {
  return [...row.querySelectorAll(`.${hooks.className}`)].find(
    (handle) => handle.closest('[role="row"]') === row && !handle.hasAttribute('disabled'),
  );
}

function isInside(box: DOMRect, event: PointerEvent): boolean {
  const { clientX: x, clientY: y } = event;
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
}

/**
 * Keeps the browser from focusing the cell a press lands in until the next frame. React Aria moves
 * focus from a focused cell into its first control, the handle, and a focus move during a press
 * cancels the browser's drag.
 */
function holdCellFocus(target: Element): void {
  const cell = target.closest('[role="gridcell"], [role="rowheader"]');
  const tabIndex = cell?.getAttribute('tabindex');
  if (!cell || tabIndex === null || tabIndex === undefined) return;
  cell.removeAttribute('tabindex');
  requestAnimationFrame(() => cell.setAttribute('tabindex', tabIndex));
}

/**
 * Lets a pointer drag start from the cell that holds a row's drag handle. Call it on a pointer
 * press inside a collection whose rows drag from anywhere: a primary press in that cell keeps
 * focus on the row for the press, so React Aria does not move it into the handle and cancel the
 * drag. `armHandleDrag` does this itself.
 */
export function keepHandleCellDraggable(event: PointerEvent<Element>): void {
  const row = isElement(event.target) ? event.target.closest('[role="row"]') : null;
  const handle = row ? findRowHandle(row) : undefined;
  const cell = handle?.closest('[role="gridcell"], [role="rowheader"]');
  if (event.button === 0 && cell && isElement(event.target) && cell.contains(event.target)) {
    holdCellFocus(cell);
  }
}

/**
 * Lets only the handle start a row's pointer drag. Call it on a pointer press inside a collection
 * whose rows render without `draggable`: a primary press on a row's enabled handle makes that row
 * draggable until the press or the drag ends, so a press elsewhere in the row never drags it. React
 * Aria keeps the handle itself out of pointer hit testing, so the press is matched by position.
 */
export function armHandleDrag(event: PointerEvent<Element>): void {
  const row = isElement(event.target) ? event.target.closest('[role="row"]') : null;
  const handle = row ? findRowHandle(row) : undefined;
  if (event.button !== 0 || !row || !handle || !isInside(handle.getBoundingClientRect(), event)) {
    return;
  }
  holdCellFocus(handle);
  armElementDrag(row);
}

/**
 * The drag button of a row in a library collection that reorders by drag and drop. The collection
 * names it after the row and starts the row's keyboard drag from it; it stays out of the tab
 * sequence, since the collection reaches it with the arrow keys.
 */
export function DragHandle({ className, excludeFromTabOrder = true, ...rest }: DragHandleProps) {
  return (
    <AriaButton
      {...rest}
      excludeFromTabOrder={excludeFromTabOrder}
      {...hooks.root({ className, props: rest })}
      slot="drag"
    >
      <Icon icon={DragHandleGlyph} size="sm" />
    </AriaButton>
  );
}
