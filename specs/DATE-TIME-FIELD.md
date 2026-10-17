# Date Time Field

`DateTimeField` edits a calendar date, a time of day, a date and time, or a range of dates. It is a field control: it composes the field base ([FIELD.md](FIELD.md)) for its label, layout, description, help, validation, dirty state, restore, undo and menu, around React Aria's `DatePicker`, `TimeField` and `DateRangePicker` with dates from `@internationalized/date`. Each part of the value is a segment the reader types into or steps with the arrow keys; the date modes also open a calendar with quick actions. Values are canonical text, so they store and compare without conversion: `YYYY-MM-DD` dates, `HH:mm` times, UTC ISO instants and `{ start, end }` date ranges.

## UIC-DATE-TIME-FIELD-1 - Field

### UIC-DATE-TIME-FIELD-1.1 - Structure

`DateTimeField` shall render a `Field` whose root also carries `ui-date-time-field` and publishes `data-mode` (`date` by default, `time`, `date-time` or `date-range`). Its control is React Aria's picker (`ui-date-time-field__picker`) holding a group (`ui-date-time-field__group`) with the segments of the value in an input (`ui-date-time-field__input`) of segments (`ui-date-time-field__segment`, React Aria's `spinbutton` segments publishing `data-type`), each named by its part and the field's label and described by the field's description, decoration and message. The date modes end the group with a calendar button (`ui-date-time-field__button`, the `calendar` glyph, named by React Aria). A range has a start and an end input with a separator between them (`ui-date-time-field__separator`, hidden from assistive technology). The time mode has no button.

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-time-pickers.tsx`, `src/core/glyphs.tsx`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-1.2 - Values

The value shall be `null` or, by mode, a `YYYY-MM-DD` date, an `HH:mm` time, a UTC ISO instant whose segments edit the local wall time to the minute, or a `{ start, end }` range of dates. A value the mode cannot read shows as empty segments.

Implementation: `src/components/date-time-field/date-values.ts`, `src/components/date-time-field/date-time-pickers.tsx`
Verification: `src/components/date-time-field/date-values.test.ts`, `src/components/date-time-field/date-time-field.test.tsx`

### UIC-DATE-TIME-FIELD-1.3 - Commit

Every complete change, typed into the segments, picked from the calendar or set by a quick action, shall set the value and commit it, unless the value is out of bounds (UIC-DATE-TIME-FIELD-1.4). An incomplete entry, with some segments still empty, stays in the segments as typed without changing the value. Clearing the segments sets `null`.

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-time-pickers.tsx`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-1.4 - Bounds

`minValue` and `maxValue`, in the mode's format (dates for a range), shall bound the value: the calendar refuses days outside them, and a value typed outside them stays on screen, uncommitted, while the field is invalid with the provider string `dateTooEarly` or `dateTooLate` naming the localized bound. A range whose end precedes its start is invalid the same way. The caller's `validate` runs on values within bounds.

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-values.ts`, `src/core/strings.ts`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `src/components/date-time-field/date-values.test.ts`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-1.5 - States

The field base's validation shall apply (required, `validate`, `isPending`), and an invalid field marks its picker invalid (`data-invalid`). A read-only field shows read-only segments and never opens its calendar; a disabled field disables its segments and button.

Implementation: `src/components/date-time-field/date-time-pickers.tsx`
Verification: `src/components/date-time-field/date-time-field.test.tsx`

### UIC-DATE-TIME-FIELD-1.6 - Previous value

While the field is dirty and its committed value is not empty, the group shall start with that value, localized, as a `FieldPreviousValue` (`ui-date-time-field__previous`).

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-time-pickers.tsx`, `src/components/date-time-field/date-values.ts`
Verification: `src/components/date-time-field/date-time-field.test.tsx`

### UIC-DATE-TIME-FIELD-1.7 - Restore, undo and menu

The field base's restore button, undo and redo chords and field menu shall apply to the value; Clear sets `null` (the default `emptyValue`).

Implementation: `src/components/date-time-field/date-time-field.tsx`
Verification: `src/components/date-time-field/date-time-field.test.tsx`

### UIC-DATE-TIME-FIELD-1.8 - Hooks and caller attributes

`DateTimeField` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes and `id` to the field root, and pass `isOpen`, `defaultOpen` and `onOpenChange` to the date pickers.

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-time-pickers.tsx`
Verification: `src/components/date-time-field/date-time-field.test.tsx`

## UIC-DATE-TIME-FIELD-2 - Calendar

### UIC-DATE-TIME-FIELD-2.1 - Popover

The calendar button shall open a popover (`ui-date-time-field__popover`) on the `dropdown` layer, publishing `data-layer` and taking its z-index from `useLayerZIndex('dropdown')`, holding a dialog (`ui-date-time-field__dialog`) with React Aria's calendar (`ui-date-time-field__calendar`): a header (`ui-date-time-field__calendar-header`) with previous and next buttons (`ui-date-time-field__calendar-nav`, named by the provider strings `previous` and `next`) around the month heading (`ui-date-time-field__calendar-heading`), and a month grid (`ui-date-time-field__calendar-grid` in `ui-date-time-field__calendar-months`) of weekday headers (`ui-date-time-field__calendar-head`, `ui-date-time-field__calendar-weekday`) and day cells (`ui-date-time-field__calendar-body`, `ui-date-time-field__calendar-cell`). A range shows one range calendar of two months. The arrow keys move between days, Enter picks, and Escape closes the popover.

Implementation: `src/components/date-time-field/date-time-calendar.tsx`, `src/components/date-time-field/date-time-pickers.tsx`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-2.2 - Quick actions

The popover shall end with quick actions (`ui-date-time-field__actions`, each a ghost `Button` also carrying `ui-date-time-field__action`): Today (provider string `today`) for a date, Now (`now`) for a date and time, to the minute, and Clear (`clear`) in every picker mode. Each sets its value, commits it and closes the popover.

Implementation: `src/components/date-time-field/date-time-calendar.tsx`, `src/components/date-time-field/date-values.ts`, `src/core/strings.ts`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `e2e/date-time-field.spec.ts`

## Hooks

| Hook                                   | Kind      | Values                                                                                            | Description                                                       |
| -------------------------------------- | --------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `ui-date-time-field`                   | root      |                                                                                                   | The field root (also `ui-field`).                                 |
| `ui-date-time-field__picker`           | slot      |                                                                                                   | React Aria's date picker, range picker or time field.             |
| `ui-date-time-field__group`            | slot      |                                                                                                   | The framed group of segments and button.                          |
| `ui-date-time-field__previous`         | slot      |                                                                                                   | The committed value while dirty (also `ui-field-previous-value`). |
| `ui-date-time-field__input`            | slot      |                                                                                                   | One run of segments (two in a range).                             |
| `ui-date-time-field__segment`          | slot      |                                                                                                   | One part of the value, or a literal between parts.                |
| `ui-date-time-field__separator`        | slot      |                                                                                                   | The dash between a range's start and end.                         |
| `ui-date-time-field__button`           | slot      |                                                                                                   | The calendar button.                                              |
| `ui-date-time-field__popover`          | slot      |                                                                                                   | The calendar's floating surface.                                  |
| `ui-date-time-field__dialog`           | slot      |                                                                                                   | The dialog holding the calendar and actions.                      |
| `ui-date-time-field__calendar`         | slot      |                                                                                                   | The calendar or range calendar.                                   |
| `ui-date-time-field__calendar-header`  | slot      |                                                                                                   | The heading row with month navigation.                            |
| `ui-date-time-field__calendar-heading` | slot      |                                                                                                   | The visible month heading.                                        |
| `ui-date-time-field__calendar-nav`     | slot      |                                                                                                   | Previous and next buttons (also `ui-icon-button`).                |
| `ui-date-time-field__calendar-months`  | slot      |                                                                                                   | Holds one grid per visible month.                                 |
| `ui-date-time-field__calendar-grid`    | slot      |                                                                                                   | A month grid.                                                     |
| `ui-date-time-field__calendar-head`    | slot      |                                                                                                   | The weekday header row group.                                     |
| `ui-date-time-field__calendar-weekday` | slot      |                                                                                                   | A weekday header cell.                                            |
| `ui-date-time-field__calendar-body`    | slot      |                                                                                                   | The grid's body.                                                  |
| `ui-date-time-field__calendar-cell`    | slot      |                                                                                                   | A day cell.                                                       |
| `ui-date-time-field__actions`          | slot      |                                                                                                   | The quick actions.                                                |
| `ui-date-time-field__action`           | slot      |                                                                                                   | A quick action (also `ui-button`).                                |
| `data-mode`                            | attribute | `date`, `time`, `date-time`, `date-range`                                                         | What the field edits.                                             |
| `data-layer`                           | attribute | `dropdown`                                                                                        | The popover's overlay layer.                                      |
| `data-type`                            | state     | `era`, `year`, `month`, `day`, `hour`, `minute`, `second`, `dayPeriod`, `timeZoneName`, `literal` | A segment's part (React Aria).                                    |
| `data-placeholder`                     | state     | `true`                                                                                            | An empty segment (React Aria).                                    |
| `data-open`                            | state     | `true`                                                                                            | The calendar is open (React Aria).                                |
| `data-focused`                         | state     | `true`                                                                                            | Focused (React Aria).                                             |
| `data-focus-visible`                   | state     | `true`                                                                                            | Keyboard focus (React Aria).                                      |
| `data-focus-within`                    | state     | `true`                                                                                            | Focus inside (React Aria).                                        |
| `data-hovered`                         | state     | `true`                                                                                            | Pointer over the element (React Aria).                            |
| `data-pressed`                         | state     | `true`                                                                                            | Pressed (React Aria).                                             |
| `data-disabled`                        | state     | `true`                                                                                            | Disabled (React Aria).                                            |
| `data-readonly`                        | state     | `true`                                                                                            | Read-only (React Aria).                                           |
| `data-invalid`                         | state     | `true`                                                                                            | Invalid (React Aria).                                             |
| `data-required`                        | state     | `true`                                                                                            | Required (React Aria).                                            |
| `data-selected`                        | state     | `true`                                                                                            | A picked day (React Aria).                                        |
| `data-selection-start`                 | state     | `true`                                                                                            | The first day of a picked range (React Aria).                     |
| `data-selection-end`                   | state     | `true`                                                                                            | The last day of a picked range (React Aria).                      |
| `data-today`                           | state     | `true`                                                                                            | Today's cell (React Aria).                                        |
| `data-outside-month`                   | state     | `true`                                                                                            | A day of another month (React Aria).                              |
| `data-outside-visible-range`           | state     | `true`                                                                                            | A day outside the visible months (React Aria).                    |
| `data-unavailable`                     | state     | `true`                                                                                            | A day that cannot be picked (React Aria).                         |
| `data-placement`                       | state     | `top`, `bottom`, `left`, `right`, `center`                                                        | Side of the group the popover opened on (React Aria).             |
| `data-trigger`                         | state     | `DatePicker`, `DateRangePicker`                                                                   | What opened the popover (React Aria).                             |
| `data-entering`                        | state     | `true`                                                                                            | Popover entry animation (React Aria).                             |
| `data-exiting`                         | state     | `true`                                                                                            | Popover exit animation (React Aria).                              |
