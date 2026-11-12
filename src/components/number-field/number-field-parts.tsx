'use client';

import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useId,
  useRef,
} from 'react';
import { type GlyphComponent, MinusGlyph, PlusGlyph, ScrubGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { Button as AriaButton, useLocale } from '../../primitives/index.js';
import { clamp } from '../../utils/clamp.js';
import { countDecimalPlaces } from '../../utils/count-decimal-places.js';
import { FreeControls } from '../../utils/free-controls.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { useWheelSteps } from '../../utils/use-wheel-steps.js';
import type { FieldState } from '../field/field.js';

export const numberFieldHooks = createHooks('number-field', [
  'box',
  'group',
  'decrement',
  'scrubber',
  'start',
  'value',
  'input',
  'sizer',
  'end',
  'increment',
  'slider',
  'output',
  'track',
  'fill',
  'mark',
  'mark-label',
  'thumb',
  'thumb-label',
  'endpoints',
  'endpoint',
  'separator',
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

/**
 * The value `delta` away from `value`, kept in the range and rounded to the precision of both, so
 * decimal steps do not drift (0.1 + 0.2). An empty value steps up to the minimum and down to the
 * maximum (zero without one), as React Aria's plain arrow keys do.
 */
export function addStep(value: number | null, delta: number, steps: NumberSteps): number {
  const minimum = steps.minValue ?? -Infinity;
  const maximum = steps.maxValue ?? Infinity;
  if (value === null)
    return clamp((delta > 0 ? steps.minValue : steps.maxValue) ?? 0, minimum, maximum);
  const precision = Math.max(countDecimalPlaces(value), countDecimalPlaces(delta));
  const next = value + delta;
  return clamp(precision <= 100 ? Number(next.toFixed(precision)) : next, minimum, maximum);
}

/** The step a modifier chooses: `largeStep` with Shift, `smallStep` with Alt, else none. */
export function modifierStep(event: { shiftKey: boolean; altKey: boolean }, steps: NumberSteps) {
  if (event.shiftKey) return steps.largeStep;
  return event.altKey ? steps.smallStep : undefined;
}

function isLocked(state: FieldState<number | null>): boolean {
  return state.isReadOnly || state.isDisabled;
}

/**
 * Shift and Alt with Arrow Up or Arrow Down step the number the input shows (`draft`, the typed
 * text parsed as the plain arrows read it; `null` while it is empty or not yet a number) by
 * `largeStep` or `smallStep` and commit it; React Aria steps by `step` only for the plain keys.
 */
export function createModifierStepHandler(state: FieldState<number | null>, steps: NumberSteps) {
  return (event: KeyboardEvent<HTMLInputElement>, draft: number | null) => {
    const direction = arrowDirections[event.key];
    const size = modifierStep(event, steps);
    if (!direction || size === undefined || isLocked(state)) return;
    // An input method composing in the input owns its arrows.
    if (isComposingKey(event.nativeEvent)) return;
    event.preventDefault();
    state.setValue(addStep(draft, direction * size, steps));
    state.commit();
  };
}

/** The modifier keys of an event, and the calls that take it from React Aria's press handling. */
interface ModifiedEvent {
  shiftKey: boolean;
  altKey: boolean;
  preventDefault(): void;
  stopPropagation(): void;
}

/**
 * Capture handlers that take a step button's press with Shift or Alt held from React Aria, which
 * would step by `step`, and step by `largeStep` or `smallStep` instead, once per press, through
 * `onStep(size)`. They follow the arrows' rules: Shift wins over Alt, and without the matching
 * prop, or while read-only or disabled, a modified press does nothing. Plain presses pass through.
 */
export function toModifiedPressProps(
  state: FieldState<number | null>,
  steps: NumberSteps,
  onStep: (size: number) => void,
) {
  const take = (event: ModifiedEvent) => {
    if (!event.shiftKey && !event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    const size = modifierStep(event, steps);
    if (size !== undefined && !isLocked(state)) onStep(size);
  };
  const block = (event: ModifiedEvent) => {
    if (!event.shiftKey && !event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
  };
  return {
    onPointerDownCapture: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button === 0) take(event);
    },
    // Keeps focus where it was, as React Aria's steppers do.
    onMouseDownCapture: (event: MouseEvent<HTMLButtonElement>) => {
      if (event.button === 0 && (event.shiftKey || event.altKey)) event.preventDefault();
    },
    onClickCapture: block,
    onKeyDownCapture: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') take(event);
    },
    onKeyUpCapture: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') block(event);
    },
  };
}

/** Host content before or after the input; content that renders nothing draws no slot. */
export function NumberAdornment({
  side,
  children,
}: {
  side: 'start' | 'end';
  children: ReactNode;
}) {
  if (isEmptyNode(children)) return null;
  return (
    <span {...hooks.slot(side)}>
      <FreeControls>{children}</FreeControls>
    </span>
  );
}

/**
 * The input, and with `isTight` a wrapper that also holds a hidden copy of its text
 * (`ui-number-field__sizer`), so a stylesheet can size the input to the number and set the end
 * adornment right after it, while editing too.
 */
export function NumberValue({
  isTight,
  text,
  children,
}: {
  isTight: boolean;
  /** The text the input shows, or its placeholder while empty. */
  text: string;
  children: ReactNode;
}) {
  if (!isTight) return children;
  return (
    <span {...hooks.slot('value')}>
      {children}
      <span {...hooks.slot('sizer')} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}

/** The capture handlers a step button takes its presses with. */
export type StepperPressProps = ReturnType<typeof toModifiedPressProps>;

/** A step button, named by its action and the field label (`Decrease Weight`). */
export function Stepper({
  slot,
  labelledBy,
  press,
  icon,
  isDisabled,
}: {
  slot: 'decrement' | 'increment';
  labelledBy?: string | undefined;
  /** The capture handlers of its presses, such as those with Shift or Alt held (`toModifiedPressProps`). */
  press: StepperPressProps;
  /** The glyph; minus or plus by default. */
  icon?: GlyphComponent | undefined;
  /** Refuses presses; otherwise the field decides, by its range and state. */
  isDisabled?: boolean | undefined;
}) {
  const id = useId();
  return (
    <AriaButton
      slot={slot}
      {...press}
      {...hooks.slot(slot)}
      id={id}
      aria-labelledby={labelledBy ? `${id} ${labelledBy}` : undefined}
      // Only a refusal is passed: `undefined` leaves the field's own disabled state in place.
      isDisabled={isDisabled === true ? true : undefined}
    >
      <Glyph icon={icon ?? (slot === 'decrement' ? MinusGlyph : PlusGlyph)} />
    </AriaButton>
  );
}

/** A scrub: where it started, the value it last set and the one before, and whether it lost control. */
interface ScrubGesture {
  x: number;
  travelled: number;
  start: number | null;
  value: number | null;
  previous: number | null;
  isLost: boolean;
}

/** Whether the field holds a value the scrub set: its latest, or the one before while that renders. */
function isScrubValue(value: number | null, gesture: ScrubGesture): boolean {
  return Object.is(value, gesture.value) || Object.is(value, gesture.previous);
}

/**
 * The wheel over the scrub handle steps the value, one step a notch (up raises it), by `largeStep`
 * with Shift and `smallStep` with Alt, and commits each step, as an arrow key does. Steps that come
 * before the field re-renders build on the value the last one set, unless the host replaced it.
 */
function useScrubberWheel(
  handle: RefObject<HTMLSpanElement | null>,
  state: FieldState<number | null>,
  steps: NumberSteps,
) {
  const last = useRef<{ from: number | null; to: number | null } | null>(null);
  useWheelSteps(
    handle,
    (direction, event) => {
      const pending = last.current;
      const value = pending && Object.is(state.value, pending.from) ? pending.to : state.value;
      const size = modifierStep(event, steps) ?? steps.step;
      const next = addStep(value, direction * size, steps);
      last.current = { from: state.value, to: next };
      state.setValue(next);
      state.commit();
    },
    isLocked(state),
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
  const drag = usePointerDrag<HTMLSpanElement, ScrubGesture>({
    isDisabled: isLocked(state),
    onStart: (event) => {
      event.preventDefault();
      const { value } = state;
      return {
        x: event.clientX,
        travelled: 0,
        start: value,
        value,
        previous: value,
        isLost: false,
      };
    },
    onMove: (event, current) => {
      // A value the gesture neither set nor is still drawing came from the host: it wins.
      if (current.isLost || !isScrubValue(state.value, current)) {
        current.isLost = true;
        return;
      }
      const travelled =
        current.travelled + (event.clientX - current.x) * (direction === 'rtl' ? -1 : 1);
      const count = Math.trunc(travelled / pixelsPerStep);
      const size = modifierStep(event, steps) ?? steps.step;
      const value = count === 0 ? current.value : addStep(current.value, count * size, steps);
      Object.assign(current, {
        x: event.clientX,
        travelled: travelled - count * pixelsPerStep,
        previous: count === 0 ? current.previous : current.value,
        value,
      });
      if (count !== 0) state.setValue(value);
    },
    onEnd: (_event, current, isCancelled) => {
      // The host may have replaced the value since the last move: it still wins.
      if (current.isLost || !isScrubValue(state.value, current) || isLocked(state)) return;
      if (isCancelled) state.setValue(current.start);
      else state.commit();
    },
  });
  const handle = useRef<HTMLSpanElement>(null);
  useScrubberWheel(handle, state, steps);
  return (
    <span
      ref={handle}
      {...hooks.slot('scrubber')}
      aria-hidden="true"
      style={{ touchAction: 'none' }}
      {...drag}
    >
      <Glyph icon={ScrubGlyph} />
    </span>
  );
}
