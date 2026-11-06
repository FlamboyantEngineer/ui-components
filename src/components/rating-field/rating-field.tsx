'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Radio, RadioGroup as AriaRadioGroup } from '../../primitives/index.js';
import { containsFocus, isFocused } from '../../utils/focus-target.js';
import {
  Field,
  type FieldControlProps,
  type FieldInputProps,
  type FieldState,
  toAriaControlProps,
  useFieldControl,
} from '../field/field.js';
import { resolveRatingMax } from './rating.js';
import { ratingFieldHooks as hooks } from './rating-field-hooks.js';
import { RatingGlyphs, type RatingIcons } from './rating-glyphs.js';

/** The values a pick can take: whole glyphs, or halves too. */
export type RatingFieldStep = 1 | 0.5;

export interface RatingFieldProps extends FieldInputProps<number | null>, RatingIcons {
  /** The highest rating, and how many glyphs are drawn. Defaults to 5. */
  maxValue?: number | undefined;
  /** Whole glyphs (`1`, the default) or halves too (`0.5`). */
  step?: RatingFieldStep | undefined;
}

interface RatingGroupProps extends RatingIcons {
  control: FieldControlProps;
  state: FieldState<number | null>;
  name: string | undefined;
  max: number;
  step: RatingFieldStep;
}

/** The pick a value selects: rounded to the step and bounded to the range, or none below a step. */
export function toRatingPick(value: number | null, max: number, step: RatingFieldStep) {
  if (value === null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value / step) * step;
  return rounded < step ? null : Math.min(rounded, max);
}

/** The radios of one glyph: its half, when halves count, then the whole glyph. */
function picksOf(position: number, step: RatingFieldStep): number[] {
  return step === 0.5 ? [position - 0.5, position] : [position];
}

/**
 * The glyphs and their radios, one per pick. Hovering a radio previews its value on the glyphs, and
 * leaving restores the picked one; the radios hold the picked value throughout.
 */
function RatingGroup({ control, state, name, max, step, icon, emptyIcon }: RatingGroupProps) {
  const strings = useUiStrings();
  const [preview, setPreview] = useState<number | null>(null);
  const pick = toRatingPick(state.value, max, step);
  const isLocked = state.isReadOnly || state.isDisabled;
  const shown = preview !== null && !isLocked ? preview : pick;
  const focusTarget = pick ?? step;
  const group = useRef<HTMLDivElement>(null);
  // A restore or undo picks another rating while focus is on the old one: focus follows the pick.
  useLayoutEffect(() => {
    const element = group.current;
    const picked = element?.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    if (picked && !isFocused(picked) && containsFocus(element)) picked.focus();
  }, [pick]);
  return (
    <AriaRadioGroup
      ref={group}
      {...toAriaControlProps(control)}
      {...hooks.slot('group', { previewing: shown !== pick })}
      name={name}
      orientation="horizontal"
      value={pick === null ? null : String(pick)}
      onChange={(next) => {
        state.setValue(Number(next));
        state.commit();
      }}
    >
      <RatingGlyphs
        hooks={hooks}
        value={shown}
        count={max}
        icon={icon}
        emptyIcon={emptyIcon}
        renderItem={(position) =>
          picksOf(position, step).map((value) => (
            <Radio
              key={value}
              value={String(value)}
              {...hooks.slot('radio', { half: value % 1 !== 0 })}
              aria-label={strings.ratingValue(value, max)}
              inputRef={value === focusTarget ? control.ref : undefined}
              onHoverStart={() => setPreview(value)}
              onHoverEnd={() => setPreview((current) => (current === value ? null : current))}
            />
          ))
        }
      />
    </AriaRadioGroup>
  );
}

/**
 * A field that rates with glyphs, in whole or half steps up to `maxValue`. Its value is the picked
 * rating, or `null` while there is none; each pick commits, and Clear in the field menu removes it.
 * It is a radio group, so the arrow keys step through the ratings and a form submits the picked one.
 */
export function RatingField({
  maxValue,
  step = 1,
  icon,
  emptyIcon,
  size = 'md',
  ...props
}: RatingFieldProps) {
  const max = resolveRatingMax(maxValue);
  const { state, field, rest } = useFieldControl(props, {
    initialValue: null,
    emptyValue: null,
    isEmpty: (value) => toRatingPick(value, max, step) === null,
  });
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data: { step: step === 1 ? 'whole' : 'half' } })}
      size={size}
      state={state}
    >
      {(control) => (
        <RatingGroup
          control={control}
          state={state}
          name={rest.name}
          max={max}
          step={step}
          icon={icon}
          emptyIcon={emptyIcon}
        />
      )}
    </Field>
  );
}

export type { RatingProps, RatingSize } from './rating.js';
export { Rating } from './rating.js';
export type { RatingGlyphFill, RatingIcons } from './rating-glyphs.js';
