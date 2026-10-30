import { useMemo, useRef, type HTMLAttributes, type RefObject } from 'react';
import type { PressEvent } from '../../core/events.js';
import { useItemDrag } from '../../utils/use-item-drag.js';
import { useDragType } from '../../utils/use-drag-type.js';
import { armElementDrag } from '../../utils/pointer-drag.js';
import { resolveStepDrop, type StepListEditorStep, type StepMove } from './step-list.js';
import { useLatest } from '../../utils/use-latest.js';

/** What every step's drag and drop shares: the editor's media type, the dragged step and the move. */
export interface StepDrag {
  /** Unique to the editor, so other editors and drop targets refuse its steps. */
  dragType: string;
  dragging: RefObject<string | null>;
  /** The move a drop of the dragged step on `targetKey` makes. */
  resolveDrop: (targetKey: string) => StepMove | null;
  onMove: (move: StepMove) => void;
}

interface StepDragSource {
  steps: readonly StepListEditorStep[];
  onMove: (move: StepMove) => void;
}

/** The editor's step drag and drop, each drop checked against the steps last rendered. */
export function useStepDrag(source: StepDragSource): StepDrag {
  const latest = useLatest(source);
  const dragType = useDragType('step');
  const dragging = useRef<string | null>(null);
  return useMemo(
    () => ({
      dragType,
      dragging,
      resolveDrop: (targetKey) => {
        const key = dragging.current;
        return key === null ? null : resolveStepDrop(latest.current.steps, { key, targetKey });
      },
      onMove: (move) => latest.current.onMove(move),
    }),
    [dragType, latest],
  );
}

/**
 * Lets only the handle start the step's pointer drag: a primary press on it makes the step
 * draggable until the press or the drag ends, so text selection in its fields never drags it.
 */
function armStep(event: PressEvent): void {
  const step = event.target.closest('[data-key]');
  if (event.pointerType === 'keyboard' || event.pointerType === 'virtual' || !step) return;
  armElementDrag(step);
}

/** A step's drag and drop: props for the step and its handle, and its states. */
interface StepRowDrag {
  ref: RefObject<HTMLLIElement | null>;
  /** Spread on the step: it drags and takes drops. */
  props: HTMLAttributes<HTMLLIElement>;
  /** Spread on the handle: a pointer press arms the drag, a keyboard press starts it. */
  handleProps: { onPressStart: (event: PressEvent) => void; onPress: (event: PressEvent) => void };
  isDragging: boolean;
  dropPosition: StepMove['position'] | null;
}

/**
 * One step's drag and drop: it drags from its handle, by pointer or by keyboard and screen reader
 * from the handle's press, and takes drops of the editor's other steps.
 */
export function useStepRowDrag({
  id,
  label,
  drag,
}: {
  id: string;
  label: string;
  drag: StepDrag | null;
}): StepRowDrag {
  const ref = useRef<HTMLLIElement>(null);
  const { dragProps, startDrag, isDragging, dropPosition } = useItemDrag({
    ref,
    key: id,
    textValue: label,
    dragType: drag?.dragType ?? '',
    dragging: drag?.dragging ?? null,
    isDisabled: !drag,
    resolveMove: () => drag?.resolveDrop(id) ?? null,
    onMove: (move) => drag?.onMove(move),
  });
  // The step turns draggable only while its handle is pressed (`armStep`).
  const { draggable: _draggable, ...stepDragProps } = dragProps;
  return {
    ref,
    props: drag ? (stepDragProps as HTMLAttributes<HTMLLIElement>) : {},
    handleProps: {
      onPressStart: armStep,
      onPress: startDrag,
    },
    isDragging,
    dropPosition,
  };
}
