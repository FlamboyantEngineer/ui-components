import { useId, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { Button as AriaButton, useLocale } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import type { FieldState } from '../field/field.js';

export const numberFieldHooks = createHooks('number-field', [
  'box',
  'group',
  'decrement',
  'scrubber',
  'start',
  'input',
  'end',
  'increment',
]);

const hooks = numberFieldHooks;

/** The steps a number moves by: `step` alone, `smallStep` with Alt and `largeStep` with Shift. */
export interface NumberSteps {
  step: number;
  smallStep: number | undefined;
  largeStep: number | undefined;
  minValue: number | undefined;
  maxValue: number | undefined;
}

/** How far a scrub travels, in pixels, for each step. */
const pixelsPerStep = 4;

const arrowDirections: Readonly<Record<string, number>> = { ArrowUp: 1, ArrowDown: -1 };

function decimalsOf(value: number): number {
  const text = String(value);
  const point = text.indexOf('.');
  return point === -1 ? 0 : text.length - point - 1;
}

/**
 * The value `delta` away from `value`, kept in the range and rounded to the precision of both, so
 * decimal steps do not drift (0.1 + 0.2). An empty value moves to the minimum, or zero.
 */
export function addStep(value: number | null, delta: number, steps: NumberSteps): number {
  const minimum = steps.minValue ?? -Infinity;
  const maximum = steps.maxValue ?? Infinity;
  if (value === null) return clamp(0, minimum, maximum);
  const precision = Math.max(decimalsOf(value), decimalsOf(Math.abs(delta)));
  return clamp(Number((value + delta).toFixed(precision)), minimum, maximum);
}

/** The step a modifier chooses: `largeStep` with Shift, `smallStep` with Alt, else none. */
function modifierStep(event: { shiftKey: boolean; altKey: boolean }, steps: NumberSteps) {
  if (event.shiftKey) return steps.largeStep;
  return event.altKey ? steps.smallStep : undefined;
}

function isLocked(state: FieldState<number | null>): boolean {
  return state.isReadOnly || state.isDisabled;
}

/**
 * Shift and Alt with Arrow Up or Arrow Down step the value by `largeStep` or `smallStep` and commit
 * it; React Aria steps by `step` only for the plain keys.
 */
export function createModifierStepHandler(state: FieldState<number | null>, steps: NumberSteps) {
  return (event: KeyboardEvent<HTMLInputElement>) => {
    const direction = arrowDirections[event.key];
    const size = modifierStep(event, steps);
    if (!direction || size === undefined || isLocked(state)) return;
    event.preventDefault();
    state.setValue(addStep(state.value, direction * size, steps));
    state.commit();
  };
}

/** A step button, named by its action and the field label (`Decrease Weight`). */
export function Stepper({
  slot,
  labelledBy,
}: {
  slot: 'decrement' | 'increment';
  labelledBy?: string | undefined;
}) {
  const id = useId();
  return (
    <AriaButton
      slot={slot}
      {...hooks.slot(slot)}
      id={id}
      aria-labelledby={labelledBy ? `${id} ${labelledBy}` : undefined}
    >
      <Glyph name={slot === 'decrement' ? 'minus' : 'plus'} />
    </AriaButton>
  );
}

/**
 * A handle that steps the value as it is dragged sideways: one step every few pixels, toward the
 * end of the line (right in left-to-right text), by `largeStep` with Shift and `smallStep` with Alt.
 * The value commits when the drag ends. It is a pointer shortcut for the arrow keys, so assistive
 * technology does not see it.
 */
export function NumberScrubber({
  state,
  steps,
}: {
  state: FieldState<number | null>;
  steps: NumberSteps;
}) {
  const { direction } = useLocale();
  const drag = useRef<{ x: number; travelled: number; value: number | null } | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (isLocked(state) || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { x: event.clientX, travelled: 0, value: state.value };
  };
  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const current = drag.current;
    if (!current) return;
    const travelled =
      current.travelled + (event.clientX - current.x) * (direction === 'rtl' ? -1 : 1);
    const count = Math.trunc(travelled / pixelsPerStep);
    const size = modifierStep(event, steps) ?? steps.step;
    const value = count === 0 ? current.value : addStep(current.value, count * size, steps);
    drag.current = { x: event.clientX, travelled: travelled - count * pixelsPerStep, value };
    if (count !== 0) state.setValue(value);
  };
  const onDragEnd = () => {
    if (!drag.current) return;
    drag.current = null;
    state.commit();
  };
  return (
    <span
      {...hooks.slot('scrubber')}
      aria-hidden="true"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
    >
      <Glyph name="scrub" />
    </span>
  );
}
