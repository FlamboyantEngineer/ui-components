'use client';

import { type RefObject, useMemo, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { PlusGlyph } from '../../core/glyphs.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { getComposedActiveElement } from '../../utils/focus-target.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { formatOutlineNumber } from '../../utils/outline-number.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { useIdFactory } from '../../utils/use-id-factory.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  insertStep,
  isStepListDirty,
  moveStep,
  removeStep,
  resolveStepMove,
  type StepListEditorStep,
  type StepMove,
  updateStep,
} from './step-list.js';
import {
  type StepAction,
  type StepListEditorColumn,
  stepListEditorHooks as hooks,
  StepRow,
} from './step-row.js';
import { useStepDrag } from './use-step-drag.js';

export interface StepListEditorProps
  extends RefProps<HTMLDivElement>, BaseProps, AriaLabellingProps {
  /** The text columns of every step, in order, such as an action and its expected result. */
  columns: readonly StepListEditorColumn[];
  /** The steps, controlled. */
  value?: readonly StepListEditorStep[] | undefined;
  /** The steps to start with, uncontrolled. Defaults to none. */
  defaultValue?: readonly StepListEditorStep[] | undefined;
  /** Called with the new steps after each edit, insertion, removal or move. */
  onChange?: ((steps: readonly StepListEditorStep[]) => void) | undefined;
  /** The steps as last saved: steps and fields that differ from them are marked dirty. */
  committedValue?: readonly StepListEditorStep[] | undefined;
  /** Shows the steps without handles, menus or the add button, their fields read-only. */
  isReadOnly?: boolean | undefined;
}

/** Which part of a step takes focus after an edit. */
type StepFocusPart = 'field' | 'actions';

const noSteps: readonly StepListEditorStep[] = [];

/** The step elements of the editor, by the step ids they carry. */
function findStepElement(root: HTMLElement | null, id: string): HTMLElement | undefined {
  const steps = root?.querySelectorAll<HTMLElement>(`.${hooks.slotClass('step')}`) ?? [];
  return [...steps].find((step) => step.dataset['key'] === id);
}

function findFocusPart(step: HTMLElement | undefined, part: StepFocusPart): HTMLElement | null {
  const selector = part === 'field' ? 'textarea, input' : `.${hooks.slotClass('actions')}`;
  return step?.querySelector<HTMLElement>(selector) ?? null;
}

/** The edits a step's menu, its keys and its drag make, each followed by a focus move. */
function useStepActions(options: {
  steps: readonly StepListEditorStep[];
  setSteps: (steps: readonly StepListEditorStep[]) => void;
  root: RefObject<HTMLDivElement | null>;
}) {
  const { steps, setSteps, root } = options;
  const strings = useUiStrings();
  const createId = useIdFactory();
  const requestFocus = useFocusRequest();
  const focusStep = (id: string, part: StepFocusPart) =>
    requestFocus(() => findFocusPart(findStepElement(root.current, id), part));
  const insertAt = (index: number, values: StepListEditorStep['values'] = {}) => {
    // The new id skips every id in the list, such as ids a restored list kept from an earlier page.
    const step = { id: createId(steps.map((item) => item.id))(), values };
    setSteps(insertStep(steps, index, step));
    focusStep(step.id, 'field');
  };
  const [announcement, setAnnouncement] = useState('');
  // Every move, by keys, menu or drop, says where the step now sits.
  const move = (move: StepMove | null, focus: () => void) => {
    if (!move) return;
    const next = moveStep(steps, move);
    setSteps(next);
    const position = next.findIndex((step) => step.id === move.key) + 1;
    setAnnouncement(strings.stepMoved(position, next.length));
    focus();
  };
  const run = (action: StepAction, id: string) => {
    const index = steps.findIndex((step) => step.id === id);
    const step = steps[index];
    if (!step) return;
    if (action === 'insert-above') insertAt(index);
    else if (action === 'insert-below') insertAt(index + 1);
    else if (action === 'duplicate') insertAt(index + 1, step.values);
    else if (action === 'delete') {
      setSteps(removeStep(steps, id));
      const next = steps[index + 1] ?? steps[index - 1];
      if (next) focusStep(next.id, 'field');
      else requestFocus(() => root.current?.querySelector(`.${hooks.slotClass('add')}`));
    } else {
      move(resolveStepMove(steps, id, action === 'up' ? -1 : 1), () => focusStep(id, 'actions'));
    }
  };
  /** Alt+Arrow keys: focus stays on the element that had it, which the move may drop. */
  const step = (id: string, delta: -1 | 1) => {
    const active = getComposedActiveElement(root.current ?? getOwnerDocument(null));
    move(resolveStepMove(steps, id, delta), () =>
      requestFocus(() => (isHTMLElement(active) && active.isConnected ? active : null)),
    );
  };
  return {
    run,
    step,
    insertAt,
    move: (stepMove: StepMove) => move(stepMove, () => {}),
    announcement,
  };
}

/** The committed steps by id, and whether the steps differ from them. */
function useStepsDirty(
  steps: readonly StepListEditorStep[],
  {
    committedValue,
    columns,
  }: Pick<StepListEditorProps, 'committedValue'> & { columns: readonly StepListEditorColumn[] },
) {
  const committedById = useMemo(
    () => (committedValue ? new Map(committedValue.map((step) => [step.id, step])) : null),
    [committedValue],
  );
  const columnIds = columns.map(({ id }) => id);
  const isDirty = committedValue !== undefined && isStepListDirty(steps, committedValue, columnIds);
  return { committedById, isDirty };
}

/**
 * Edits an ordered list of steps, each a numbered row with a multi-line text field per column
 * (such as an action, its data and its expected result). Steps are added, inserted above or below,
 * duplicated, moved and deleted from their menus, reordered by dragging their handles or with
 * Alt+ArrowUp and Alt+ArrowDown, and marked dirty against the committed steps. The value is plain
 * data.
 */
export function StepListEditor({
  ref,
  columns,
  value,
  defaultValue = noSteps,
  onChange,
  committedValue,
  isReadOnly = false,
  className,
  'aria-label': ariaLabel,
  ...rest
}: StepListEditorProps) {
  const strings = useUiStrings();
  const [steps, setSteps] = useControllableState(value, defaultValue, onChange);
  const root = useRef<HTMLDivElement>(null);
  const rootRefs = useMergedRefs(root, ref);
  const actions = useStepActions({ steps, setSteps, root });
  const drag = useStepDrag({ steps, onMove: actions.move });
  const { committedById, isDirty } = useStepsDirty(steps, { committedValue, columns });
  const label = ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.steps);
  return (
    <div
      {...rest}
      ref={rootRefs}
      {...hooks.root({ className, props: rest, data: { dirty: isDirty, readonly: isReadOnly } })}
      role="group"
      aria-label={label}
    >
      {steps.length === 0 ? (
        <EmptyState size="sm" description={strings.noSteps} className={hooks.slotClass('empty')} />
      ) : (
        <>
          <div {...hooks.slot('header')} aria-hidden="true">
            {columns.map((column) => (
              <span key={column.id} {...hooks.slot('heading')} data-column={column.id}>
                {column.label}
              </span>
            ))}
          </div>
          <ol {...hooks.slot('steps')}>
            {steps.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                index={index}
                count={steps.length}
                number={formatOutlineNumber([index])}
                columns={columns}
                committed={committedById ? (committedById.get(step.id) ?? null) : undefined}
                isReadOnly={isReadOnly}
                drag={drag}
                onChange={(next) => setSteps(updateStep(steps, next))}
                onAction={actions.run}
                onStep={actions.step}
              />
            ))}
          </ol>
        </>
      )}
      {isReadOnly ? null : (
        <Button
          variant="ghost"
          size="sm"
          startIcon={PlusGlyph}
          className={hooks.slotClass('add')}
          onPress={() => actions.insertAt(steps.length)}
        >
          {strings.addStep}
        </Button>
      )}
      {isReadOnly ? null : (
        <VisuallyHidden as="div" role="status">
          {actions.announcement}
        </VisuallyHidden>
      )}
    </div>
  );
}

export type { StepListEditorStep } from './step-list.js';
export type { StepListEditorColumn } from './step-row.js';
