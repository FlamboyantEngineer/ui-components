'use client';

// Steps the time parts of a date-time field's segments without typing: the wheel over a time
// segment, and a time field's later and earlier buttons (specs/DATE-TIME-FIELD.md, UIC-DATE-TIME-FIELD-4.6).

import { type RefObject, useContext } from 'react';
import { ChevronDownGlyph, ChevronUpGlyph } from '../../core/glyphs.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import {
  Button as AriaButton,
  DateFieldStateContext,
  TimeFieldStateContext,
} from '../../primitives/index.js';
import { useWheelSteps } from '../../utils/use-wheel-steps.js';
import { dateTimeFieldHooks as hooks } from './date-time-field-hooks.js';

/** The parts of a time the wheel and the step buttons change. */
export type TimeUnit = 'hour' | 'minute' | 'second' | 'dayPeriod';

const timeUnits: ReadonlySet<string> = new Set<TimeUnit>(['hour', 'minute', 'second', 'dayPeriod']);

/** Whether a segment's type is a part of the time. */
export function isTimeUnit(type: string | null | undefined): type is TimeUnit {
  return type != null && timeUnits.has(type);
}

/**
 * The wheel rolled over a segment steps it when it is a part of the time, up for later and down
 * for earlier, and focuses it, while the field may change. `ref` is the segment's element.
 */
export function useSegmentWheel(
  ref: RefObject<HTMLElement | null>,
  { type, isEditable }: { type: string; isEditable: boolean },
): void {
  const dateState = useContext(DateFieldStateContext);
  const timeState = useContext(TimeFieldStateContext);
  const state = dateState ?? timeState;
  const canStep =
    isTimeUnit(type) && isEditable && !!state && !state.isDisabled && !state.isReadOnly;
  useWheelSteps(
    ref,
    (direction) => {
      if (!state || !isTimeUnit(type)) return;
      ref.current?.focus({ preventScroll: true });
      if (direction > 0) state.increment(type);
      else state.decrement(type);
    },
    !canStep,
  );
}

/**
 * A time field's later and earlier buttons, stepping `unit`: the time segment focused last, else
 * the hour. They stay out of the tab order and leave focus where it is, since the arrow keys step
 * a focused segment already.
 */
export function TimeStepButtons({ unit }: { unit: TimeUnit }) {
  const strings = useUiStrings();
  const state = useContext(TimeFieldStateContext);
  const isLocked = !state || state.isDisabled || state.isReadOnly;
  const buttons = [
    { direction: 'later', label: strings.timeLater, icon: ChevronUpGlyph },
    { direction: 'earlier', label: strings.timeEarlier, icon: ChevronDownGlyph },
  ] as const;
  return (
    <span {...hooks.slot('steps')}>
      {buttons.map(({ direction, label, icon }) => (
        <AriaButton
          key={direction}
          {...hooks.slot('step', { direction })}
          aria-label={label}
          excludeFromTabOrder
          preventFocusOnPress
          isDisabled={isLocked}
          onPress={() => {
            if (direction === 'later') state?.increment(unit);
            else state?.decrement(unit);
          }}
        >
          <Glyph icon={icon} />
        </AriaButton>
      ))}
    </span>
  );
}
