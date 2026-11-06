'use client';

import { useId, useState } from 'react';
import { useToday } from '../../core/clock.js';
import { useUiStrings } from '../../core/provider.js';
import { Button as AriaButton, Dialog, DialogTrigger } from '../../primitives/index.js';
import { DEFAULT_DROPDOWN_OFFSET } from '../../utils/overlay-defaults.js';
import {
  Field,
  type FieldControlProps,
  FieldFormValue,
  type FieldInputProps,
  type FieldIssue,
  type FieldState,
  toAriaControlProps,
  useFieldControl,
} from '../field/field.js';
import { PopoverPanel } from '../popover/popover.js';
import { periodFieldHooks as hooks } from './period-field-hooks.js';
import { PeriodPicker, usePeriodFormats } from './period-picker.js';
import { type PeriodGranularity, readPeriod } from './period-values.js';

export interface PeriodFieldProps extends FieldInputProps<string | null> {
  /** Whether the value is a calendar month (`YYYY-MM`, the default) or a year (`YYYY`). */
  granularity?: PeriodGranularity | undefined;
  /** The earliest period offered, in the value's form. */
  minValue?: string | undefined;
  /** The latest period offered, in the value's form. */
  maxValue?: string | undefined;
  /** Shown while no period is chosen. Defaults to the provider's `selectPlaceholder`. */
  placeholder?: string | undefined;
}

type PeriodFormats = ReturnType<typeof usePeriodFormats>;

/** The field's own check: a value it cannot read, or one beyond the bounds. */
function checkPeriod(
  value: string | null,
  options: { granularity: PeriodGranularity; min: number | null; max: number | null },
  messages: { strings: ReturnType<typeof useUiStrings>; formats: PeriodFormats },
): FieldIssue | null {
  if (value === null) return null;
  const { strings, formats } = messages;
  const index = readPeriod(value, options.granularity);
  if (index === null)
    return { severity: 'error', message: strings.dateUnreadable, validity: 'badInput' };
  if (options.min !== null && index < options.min) {
    const message = strings.dateTooEarly(formats.full(options.min));
    return { severity: 'error', message, validity: 'rangeUnderflow' };
  }
  if (options.max !== null && index > options.max) {
    const message = strings.dateTooLate(formats.full(options.max));
    return { severity: 'error', message, validity: 'rangeOverflow' };
  }
  return null;
}

/** The trigger: named by the label and the chosen period, which it shows in the locale. */
function PeriodTrigger(props: {
  control: FieldControlProps;
  state: FieldState<string | null>;
  text: string | null;
  placeholder: string;
}) {
  const valueId = useId();
  const { ref, ...rest } = props.control;
  const aria = toAriaControlProps(rest);
  const { state, text } = props;
  return (
    <AriaButton
      {...hooks.slot('trigger')}
      id={aria.id}
      ref={ref}
      aria-label={aria['aria-label']}
      aria-labelledby={`${aria['aria-labelledby'] ?? aria.id} ${valueId}`}
      aria-describedby={aria['aria-describedby']}
      isDisabled={aria.isDisabled}
      onKeyDown={(event) => {
        if ((event.key === 'Backspace' || event.key === 'Delete') && state.canClear) state.clear();
        else event.continuePropagation();
      }}
    >
      <span {...hooks.slot('value', { placeholder: text === null })} id={valueId}>
        {text ?? props.placeholder}
      </span>
    </AriaButton>
  );
}

/**
 * A field whose value is a calendar month (`YYYY-MM`) or year (`YYYY`), never a day or an instant:
 * a trigger showing the period in the locale opens a grid of a year's months or of twelve years,
 * with page buttons, bounds and the field's validation, dirty state, restore, undo and menu.
 */
export function PeriodField(props: PeriodFieldProps) {
  const strings = useUiStrings();
  const { granularity = 'month', minValue, maxValue } = props;
  const formats = usePeriodFormats(granularity);
  const min = minValue === undefined ? null : readPeriod(minValue, granularity);
  const max = maxValue === undefined ? null : readPeriod(maxValue, granularity);
  const bounds = { granularity, min, max };
  const { state, field, rest } = useFieldControl<string | null, PeriodFieldProps>(props, {
    initialValue: null,
    emptyValue: null,
    check: (value) => checkPeriod(value, bounds, { strings, formats }),
  });
  const [isOpen, setOpen] = useState(false);
  const today = useToday();
  const index = state.value === null ? null : readPeriod(state.value, granularity);
  const current =
    today === null
      ? null
      : readPeriod(today.slice(0, granularity === 'month' ? 7 : 4), granularity);
  const text = state.value === null ? null : index === null ? state.value : formats.full(index);
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, data: { granularity } })}
      state={state}
    >
      {(control) => (
        <>
          <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
            <PeriodTrigger
              control={control}
              state={state}
              text={text}
              placeholder={rest.placeholder ?? strings.selectPlaceholder}
            />
            <PopoverPanel
              {...hooks.slot('popover', { layer: 'dropdown' })}
              placement="bottom start"
              offset={DEFAULT_DROPDOWN_OFFSET}
            >
              <Dialog {...hooks.slot('dialog')} aria-label={field.label}>
                <PeriodPicker
                  granularity={granularity}
                  value={index}
                  fallback={current ?? min ?? max ?? 0}
                  min={min}
                  max={max}
                  isReadOnly={state.isReadOnly}
                  onPick={(picked) => {
                    state.setValue(picked);
                    state.commit();
                    setOpen(false);
                  }}
                />
              </Dialog>
            </PopoverPanel>
          </DialogTrigger>
          <FieldFormValue name={rest.name} value={state.value} isDisabled={state.isDisabled} />
        </>
      )}
    </Field>
  );
}

export type { PeriodGranularity } from './period-values.js';
