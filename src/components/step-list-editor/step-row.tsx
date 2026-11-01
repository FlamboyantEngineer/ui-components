'use client';

import { isEditableTarget } from '../../utils/is-editable-target.js';
import { DragHandleGlyph } from '../../core/glyphs.js';
// One step of a step list editor: its drag handle, number, text fields and menu.

import type { KeyboardEvent } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Button } from '../button/button.js';
import { TextField } from '../text-field/text-field.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isStepDirty, readStepValue, type StepListEditorStep } from './step-list.js';
import { useStepRowDrag, type StepDrag } from './use-step-drag.js';

/** A text column every step fills. */
export interface StepListEditorColumn {
  /** The key of the column's text in each step's `values`. */
  id: string;
  /** Names the column's field in every step and heads the column. */
  label: string;
  /** A hint shown while a step's field is empty. */
  placeholder?: string | undefined;
}

/** A step menu's actions. */
export type StepAction = 'insert-above' | 'insert-below' | 'duplicate' | 'up' | 'down' | 'delete';

interface StepRowProps {
  step: StepListEditorStep;
  index: number;
  count: number;
  /** The step's number as shown. */
  number: string;
  columns: readonly StepListEditorColumn[];
  /** The committed version of the step, while the editor marks changes; `null` when it is new. */
  committed: StepListEditorStep | null | undefined;
  isReadOnly: boolean;
  drag: StepDrag | null;
  onChange: (step: StepListEditorStep) => void;
  onAction: (action: StepAction, id: string) => void;
  /** Moves the step one place by Alt+Arrow keys, keeping focus where it is. */
  onStep: (id: string, delta: -1 | 1) => void;
}

export const stepListEditorHooks = createHooks('step-list-editor', [
  'header',
  'heading',
  'steps',
  'step',
  'handle',
  'number',
  'fields',
  'field',
  'actions',
  'empty',
  'add',
]);

const hooks = stepListEditorHooks;

const moveKeys: Readonly<Record<string, -1 | 1>> = { ArrowUp: -1, ArrowDown: 1 };

type StepMenuProps = Pick<StepRowProps, 'index' | 'count' | 'number' | 'onAction'> & { id: string };

/** A step's menu: insert above or below, duplicate, move up or down, and delete. */
/**
 * How a step's field tracks changes: against the committed step's text, or, without one (no
 * committed list, or a new step, marked as a whole), not at all, as a plain input.
 */
function toFieldTracking(committed: StepListEditorStep | null | undefined, column: string) {
  return committed
    ? { committedValue: readStepValue(committed, column) }
    : { tracksChanges: false as const };
}

function StepMenu({ id, index, count, number, onAction }: StepMenuProps) {
  const strings = useUiStrings();
  const disabledKeys: Key[] = [];
  if (index === 0) disabledKeys.push('up');
  if (index === count - 1) disabledKeys.push('down');
  return (
    <DropdownMenu
      iconOnly
      label={strings.stepActions(number)}
      variant="ghost"
      size="sm"
      placement="bottom end"
      className={hooks.slotClass('actions')}
      items={[
        { id: 'insert-above', label: strings.insertStepAbove },
        { id: 'insert-below', label: strings.insertStepBelow },
        { id: 'duplicate', label: strings.duplicate },
        { id: 'up', label: strings.moveItem('up') },
        { id: 'down', label: strings.moveItem('down') },
        { id: 'delete', label: strings.delete },
      ]}
      disabledKeys={disabledKeys}
      onAction={(key) => onAction(key as StepAction, id)}
    />
  );
}

/**
 * One step: a drag handle, its number, a multi-line text field per column and its menu while
 * editable. Alt+ArrowUp and Alt+ArrowDown anywhere in the step but its text fields move it.
 */
export function StepRow(props: StepRowProps) {
  const { step, number, columns, committed, isReadOnly, drag, onChange, onStep } = props;
  const strings = useUiStrings();
  const label = strings.stepLabel(number);
  const row = useStepRowDrag({ id: step.id, label, drag: isReadOnly ? null : drag });
  const { ref, props: rowProps, handleProps, isDragging, dropPosition } = row;
  const onKeyDownCapture = (event: KeyboardEvent<HTMLLIElement>) => {
    const delta = moveKeys[event.key];
    // Keys from an open menu reach the step through its portal; only the step's own keys move it,
    // and never while an input method in a field owns them.
    const isOwn = event.currentTarget.contains(event.target as Node);
    if (!delta || !isMoveChord(event) || !isOwn || isComposingKey(event.nativeEvent)) return;
    // A step's text field keeps the chord for its caret (Option+Arrow moves by paragraph).
    if (isEditableTarget(event.target)) return;
    // Captured before the menu button, which would open its menu on Alt+ArrowDown.
    event.preventDefault();
    event.stopPropagation();
    if (!isReadOnly) onStep(step.id, delta);
  };
  const isDirty =
    committed !== undefined &&
    isStepDirty(
      step,
      committed ?? undefined,
      columns.map(({ id }) => id),
    );
  return (
    <li
      ref={ref}
      {...rowProps}
      {...hooks.slot('step', {
        dirty: isDirty,
        dragging: isDragging,
        dropTarget: dropPosition !== null,
        position: dropPosition,
      })}
      data-key={step.id}
      onKeyDownCapture={onKeyDownCapture}
    >
      {isReadOnly ? null : (
        <Button
          icon={DragHandleGlyph}
          size="sm"
          label={strings.moveStep(number)}
          className={hooks.slotClass('handle')}
          {...handleProps}
        />
      )}
      <span {...hooks.slot('number')} aria-hidden="true">
        {number}
      </span>
      <div {...hooks.slot('fields')} role="group" aria-label={label}>
        {columns.map((column) => (
          <TextField
            key={column.id}
            className={hooks.slotClass('field')}
            data-column={column.id}
            label={column.label}
            labelLayout="control-only"
            multiline
            minRows={1}
            maxRows={6}
            placeholder={column.placeholder}
            isReadOnly={isReadOnly}
            value={readStepValue(step, column.id)}
            {...toFieldTracking(committed, column.id)}
            onChange={(text) =>
              onChange({ ...step, values: { ...step.values, [column.id]: text } })
            }
          />
        ))}
      </div>
      {isReadOnly ? null : (
        <StepMenu
          id={step.id}
          index={props.index}
          count={props.count}
          number={number}
          onAction={props.onAction}
        />
      )}
    </li>
  );
}
