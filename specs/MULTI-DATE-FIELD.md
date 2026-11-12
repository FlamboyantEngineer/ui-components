# Multi Date Field

`MultiDateField` edits a set of independent calendar dates, such as the days a team member is away or the dates an event repeats on. It is a field control: it composes the field base ([FIELD.md](FIELD.md)) for its label, layout, description, help, validation, dirty state, restore, undo and menu, around React Aria's `Calendar` with multiple selection, drawn with the [Date Time Field](DATE-TIME-FIELD.md)'s calendar parts. Its value is a list of `YYYY-MM-DD` dates. A set of dates is not a range: each date stands alone, and no day between two chosen dates belongs to the value, so a range that may span unavailable days is a [Date Time Field](DATE-TIME-FIELD.md#uic-date-time-field-37---ranges-across-unavailable-days) with `rangeAvailability="endpoints"` instead.

## UIC-MULTI-DATE-FIELD-1 - Field

### UIC-MULTI-DATE-FIELD-1.1 - Structure

`MultiDateField` shall render a `Field` whose root also carries `ui-multi-date-field`. Its control (`ui-multi-date-field__control`) holds an inline calendar (`ui-multi-date-field__calendar`, React Aria's `Calendar` with `selectionMode="multiple"`, named by the field's label and described by its description and message), drawn with the Date Time Field's calendar parts (`ui-date-time-field__calendar-header` to `ui-date-time-field__calendar-cell`, with previous and next buttons named by the provider strings `previous` and `next`), then the chosen dates as a [Tag Group](TAG-GROUP.md) (`ui-multi-date-field__tags`, named by the provider's `selectedValues` message with the label), each tag the date in the locale's medium date style. `hideTags` leaves the tags out. The calendar takes the Date Time Field's calendar options: `visibleMonths`, `calendarPaging`, `calendarHeading`, `firstDayOfWeek` and `weekNumbers` ([UIC-DATE-TIME-FIELD-3.3](DATE-TIME-FIELD.md#uic-date-time-field-33---month-and-year-selects) to [UIC-DATE-TIME-FIELD-3.6](DATE-TIME-FIELD.md#uic-date-time-field-36---week-start-and-week-numbers)). It opens on the earliest chosen date, else on today by the provider's clock. The calendar draws once the device's clock may be read, after hydration, since its today mark is the device's: the server and the first client render show the label, the tags and the form values without it, so they agree.

Implementation: `src/components/multi-date-field/multi-date-field.tsx`, `src/components/multi-date-field/multi-date-parts.tsx`, `labs/reference/multi-date-field.css`
Verification: `src/components/multi-date-field/multi-date-field.test.tsx`, `e2e/multi-date-field.spec.ts`

### UIC-MULTI-DATE-FIELD-1.2 - Values

The value shall be a list of `YYYY-MM-DD` calendar dates (`[]` by default and when cleared). Every set the field writes holds each date once, earliest first, so the same days always make the same value; a value the caller passes with repeats or in another order shows as that set, unchanged until the reader changes it. A date is a calendar day with no time or zone, so it reads, orders and submits the same in every time zone and across daylight saving changes. A text that is no `YYYY-MM-DD` date leaves the calendar and the tags without it and makes the field invalid with the provider string `dateUnreadable`; the next change drops it.

Implementation: `src/components/multi-date-field/multi-date-values.ts`, `src/components/multi-date-field/multi-date-parts.tsx`
Verification: `src/components/multi-date-field/multi-date-values.test.ts`, `src/components/multi-date-field/multi-date-field.test.tsx`

### UIC-MULTI-DATE-FIELD-1.3 - Picking

Pressing a day, or Enter or Space on the focused day, shall add it to the set when it is not there and remove it when it is, then commit the set. Each chosen day publishes `data-selected` and is announced as selected, and the arrow keys move from day to day and from month to month as in a single calendar. Pressing a tag's remove button, or Delete or Backspace on a focused tag, removes that date and commits; focus moves to the next tag, and once no tag is left, to the calendar's focused day. A read-only field shows the set and changes nothing; a disabled field, or one in a disabled `Fieldset`, disables the calendar and its tags.

Implementation: `src/components/multi-date-field/multi-date-parts.tsx`
Verification: `src/components/multi-date-field/multi-date-field.test.tsx`, `e2e/multi-date-field.spec.ts`

### UIC-MULTI-DATE-FIELD-1.4 - Rules

`minValue` and `maxValue` (`YYYY-MM-DD`) shall bound the dates: the calendar refuses days outside them, and a value holding one is invalid with the provider string `dateTooEarly` or `dateTooLate` naming the localized bound. `isDateUnavailable(date)` and `getDateState(date)` (`isDisabled` and `isTaken` days) make days unavailable as in [UIC-DATE-TIME-FIELD-3.4](DATE-TIME-FIELD.md#uic-date-time-field-34---calendar-date-states), with the same tones, descriptions and marks: the calendar does not pick them and a value holding one is invalid with `dateUnavailable`. `maxValues` caps the set: while it holds that many dates, every other day is unavailable in the calendar, so a press can only remove, and a value holding more is invalid with the provider string `tooManyDates`. The caller's `validate` runs on sets the field accepts.

Implementation: `src/components/multi-date-field/multi-date-field.tsx`, `src/components/multi-date-field/multi-date-values.ts`, `src/components/multi-date-field/multi-date-parts.tsx`, `src/core/strings.ts`
Verification: `src/components/multi-date-field/multi-date-values.test.ts`, `src/components/multi-date-field/multi-date-field.test.tsx`

### UIC-MULTI-DATE-FIELD-1.5 - Clear, restore, undo and forms

The field base's restore button (given `showRestoreButton`), undo and redo chords and field menu shall apply to the set, and Clear sets `[]`. A required field is empty with no date. `name` adds one hidden input per chosen date to the field's form, each holding a `YYYY-MM-DD` date under that same name, earliest first, so the form submits the name once per date and nothing for an empty set; a disabled field submits none.

Implementation: `src/components/multi-date-field/multi-date-field.tsx`, `src/components/multi-date-field/multi-date-parts.tsx`
Verification: `src/components/multi-date-field/multi-date-field.test.tsx`

### UIC-MULTI-DATE-FIELD-1.6 - Hooks and caller attributes

`MultiDateField` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to the field root.

Implementation: `src/components/multi-date-field/multi-date-field.tsx`
Verification: `src/components/multi-date-field/multi-date-field.test.tsx`

## Hooks

| Hook                            | Kind  | Values | Description                                                         |
| ------------------------------- | ----- | ------ | ------------------------------------------------------------------- |
| `ui-multi-date-field`           | root  |        | The field root (also `ui-field`).                                   |
| `ui-multi-date-field__control`  | slot  |        | The calendar, the tags and the form inputs.                         |
| `ui-multi-date-field__calendar` | slot  |        | The inline calendar (holding the Date Time Field's calendar parts). |
| `ui-multi-date-field__tags`     | slot  |        | The chosen dates (also `ui-tag-group`).                             |
| `data-disabled`                 | state | `true` | On the calendar: disabled (React Aria).                             |
| `data-invalid`                  | state | `true` | On the calendar: the set is invalid (React Aria).                   |
