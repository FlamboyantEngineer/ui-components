# External form controllers

Library fields hold their own value, committed value, dirty state and validation, and a library [`Form`](../specs/FORM.md) gathers them. A host that already runs a form controller, such as [React Hook Form](https://react-hook-form.com/), can let it own the fields instead. The library has no dependency on any controller: a field takes plain props that any controller can fill ([UIC-FIELD-12](../specs/FIELD.md#uic-field-12---external-form-controllers)).

## Which layer owns what

| Concern                                  | Owner          | Through                                                       |
| ---------------------------------------- | -------------- | ------------------------------------------------------------- |
| Values, defaults (also async) and reset  | The controller | `value` and `onChange`, which take values, not events         |
| Dirty state                              | The controller | `tracksChanges: false`: the field marks no changes or Restore |
| Touched state                            | The controller | `onLeave`, called once focus leaves the whole field           |
| Validation rules and messages            | The controller | `errorMessage`, shown whatever the validation mode            |
| Focus on the first invalid field         | The controller | `controlRef`, whose `focus()` focuses the control             |
| Submit                                   | The controller | Its own submit handler on a plain `<form>`                    |
| Labels, ARIA, layout and the required \* | The field      | `label`, `isRequired` and the field's other props             |

Keep each concern in one layer, so a message shows once and only one layer blocks the submit:

- Give the fields `validationMode: 'submit'`. Their own checks (`isRequired`, string rules, `validate`) then wait for a library `Form`'s submit, which a controller's form never makes, while `isRequired` still marks the field required for readers and assistive technology. Put the rules, the required one included, in the controller.
- Do not wrap a controller's form in a library `Form`, and do not pass `name` for external errors from a `Form`'s `validationErrors`; report server errors through the controller (`setError`), which `errorMessage` shows.

## React Hook Form

One adapter hook hands any library field to `useController`. It is typed by the form's values, so each field receives a value of its own type without a cast.

```tsx
import {
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
  useController,
} from 'react-hook-form';
import type { FieldStateOptions } from '@flamboyantengineer/ui-components';

const ownedByController = {
  tracksChanges: false,
  validationMode: 'submit',
} satisfies Pick<FieldStateOptions<unknown>, 'tracksChanges' | 'validationMode'>;

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
```

Each field then spreads it, whatever its value type:

```tsx
interface BookingValues {
  title: string;
  seats: number | null;
  room: Key | null;
  dates: DateRangeValue | null;
}

const { control, handleSubmit, reset, formState } = useForm<BookingValues>({
  defaultValues: loadSavedBooking, // an async function: the fields wait while it loads
  mode: 'onTouched',
});
const isLoading = formState.isLoading;

<form noValidate onSubmit={(event) => void handleSubmit(save)(event)}>
  <TextField
    label="Title"
    isRequired
    {...useControlledField(control, 'title', { required: 'Enter a title.' })}
    isDisabled={isLoading}
  />
  <NumberField label="Seats" {...useControlledField(control, 'seats', seatRules)} />
  <SelectField
    label="Room"
    options={rooms}
    isRequired
    {...useControlledField(control, 'room', roomRules)}
  />
  <DateTimeField
    label="Dates"
    mode="date-range"
    {...useControlledField(control, 'dates', dateRules)}
  />
  <Button type="submit" label="Save" />
  <Button label="Reset" onPress={() => reset()} />
</form>;
```

(Call the hooks at the top of the component, as the [lab case](../labs/src/field-controller-cases.tsx) does; they are inline here to keep the example short.)

- **Async defaults:** while `defaultValues` loads, `formState.isLoading` holds; disable the fields until it settles, then they show the loaded values. `reset()` puts those values back, and `reset(values)` replaces them.
- **Touched:** `onLeave` runs once focus leaves the whole field, so a date range is touched when focus leaves both of its dates and its calendar button, not between them, and `mode: 'onTouched'` validates then.
- **Focus on errors:** on a refused submit React Hook Form calls `focus()` on the first invalid field's ref. `controlRef`'s `focus()` opens what hides the field (a collapsed section that gives its fields a reveal scope) and focuses the control: the input, a select's trigger, or a date range's first segment.
- **Values, not events:** every field calls `onChange` with its value (`string`, `number | null`, `Key | null`, `DateRangeValue | null`, …), which React Hook Form stores as is.

## Compound fields

A field with several parts, such as a date range, is one controlled value and one touched state: the controller sees `{ start, end }` and one blur. To validate or report errors for each end separately, validate the whole value in the controller and word the message for the end at fault; to submit the ends as two form entries, read them from the value in the submit handler. A draft that is not yet a value, such as a date typed in part, stays inside the field: the controller sees the last accepted value (`null` for a range not yet complete), so its rules catch an incomplete entry, and the field's own draft message (UIC-FIELD-3.11) waits like its other checks under `validationMode: 'submit'`.

The [Field lab](../labs/field.html) runs this form, and `test/field-controller.test.tsx` checks it.
