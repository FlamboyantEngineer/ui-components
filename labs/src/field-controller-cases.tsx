import { useState } from 'react';
import {
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
  useController,
  useForm,
} from 'react-hook-form';
import { Button } from '../../src/components/button/button.js';
import {
  type DateRangeValue,
  DateTimeField,
} from '../../src/components/date-time-field/date-time-field.js';
import type { FieldStateOptions } from '../../src/components/field/field.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import type { Key } from '../../src/core/props.js';

/** The values the booking form holds; React Hook Form owns them, their dirty state and their checks. */
export interface BookingValues {
  title: string;
  seats: number | null;
  room: Key | null;
  dates: DateRangeValue | null;
}

/** A field the controller owns: it tracks no changes and shows no checks of its own (see below). */
const ownedByController = {
  tracksChanges: false,
  validationMode: 'submit',
} satisfies Pick<FieldStateOptions<unknown>, 'tracksChanges' | 'validationMode'>;

/**
 * The props that hand a library field to React Hook Form: the controller owns the value, the
 * touched state (focus leaving the whole field), the errors and focusing the first invalid field.
 * The field tracks no changes of its own and shows only the controller's errors: its own checks,
 * such as `isRequired`, which still marks the field, wait for a library `Form`'s submit, which this
 * form never makes.
 */
export function useControlledField<V extends FieldValues, N extends FieldPath<V>>(
  control: Control<V>,
  name: N,
  rules?: Omit<RegisterOptions<V, N>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'>,
) {
  const { field, fieldState } = useController({ control, name, rules });
  return {
    value: field.value,
    onChange: field.onChange,
    onLeave: field.onBlur,
    controlRef: field.ref,
    errorMessage: fieldState.error?.message,
    ...ownedByController,
  };
}

const rooms = [
  { id: 'north', label: 'North room' },
  { id: 'south', label: 'South room' },
  { id: 'garden', label: 'Garden' },
];

const emptyBooking: BookingValues = { title: '', seats: null, room: null, dates: null };

/** Loads the saved booking a moment later, as a host reads it from its server. */
function loadSavedBooking(): Promise<BookingValues> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          title: 'Quarterly review',
          seats: 12,
          room: 'north',
          dates: { start: '2026-03-02', end: '2026-03-04' },
        }),
      300,
    );
  });
}

/** Whether a range ends on or after its start; ISO dates compare as text. */
function isOrdered(dates: DateRangeValue | null): boolean {
  return !dates || dates.start <= dates.end;
}

interface ControllerFormProps {
  /** Loads the form's defaults; defaults to a saved booking that arrives after 300 ms. */
  loadDefaults?: (() => Promise<BookingValues>) | undefined;
  onSave?: ((values: BookingValues) => void) | undefined;
}

/**
 * A booking form owned by React Hook Form: a text, number, select and date range field, each
 * through `useControlledField`. Defaults load asynchronously, Save validates and focuses the first
 * invalid field, Reset puts the loaded values back, and leaving a field (the whole range, not one
 * of its dates) marks it touched.
 */
export function ControllerForm({ loadDefaults = loadSavedBooking, onSave }: ControllerFormProps) {
  const { control, handleSubmit, reset, formState } = useForm<BookingValues>({
    defaultValues: loadDefaults,
    mode: 'onTouched',
  });
  const [saved, setSaved] = useState('nothing');
  const title = useControlledField(control, 'title', { required: 'Enter a title.' });
  const seats = useControlledField(control, 'seats', {
    validate: (value) => (value !== null && value >= 1) || 'Book at least one seat.',
  });
  const room = useControlledField(control, 'room', { required: 'Choose a room.' });
  const dates = useControlledField(control, 'dates', {
    validate: (value) =>
      (value !== null && isOrdered(value)) || 'Choose dates that end after they start.',
  });
  const isLoading = formState.isLoading;
  const touched = Object.keys(formState.touchedFields).join(', ') || 'none';
  return (
    <form
      aria-label="Booking"
      aria-busy={isLoading || undefined}
      data-lab-demo="field-controller"
      noValidate
      onSubmit={(event) =>
        void handleSubmit((values) => {
          setSaved(`${values.title}, ${String(values.seats)} seats`);
          onSave?.(values);
        })(event)
      }
      style={{ display: 'grid', gap: 12, maxWidth: 420 }}
    >
      <TextField label="Title" isRequired {...title} isDisabled={isLoading} />
      <NumberField label="Seats" minValue={0} {...seats} isDisabled={isLoading} />
      <SelectField label="Room" options={rooms} isRequired {...room} isDisabled={isLoading} />
      <DateTimeField label="Dates" mode="date-range" {...dates} isDisabled={isLoading} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" variant="primary" label="Save" />
        <Button label="Reset" onPress={() => reset()} />
        <Button
          label="Clear the form"
          onPress={() => reset(emptyBooking, { keepDefaultValues: true })}
        />
      </div>
      <p>
        Loading: <output data-lab-output="controller-loading">{String(isLoading)}</output>; dirty:{' '}
        <output data-lab-output="controller-dirty">{String(formState.isDirty)}</output>; touched:{' '}
        <output data-lab-output="controller-touched">{touched}</output>; saved:{' '}
        <output data-lab-output="controller-saved">{saved}</output>
      </p>
    </form>
  );
}
