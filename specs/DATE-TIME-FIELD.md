# Date Time Field

`DateTimeField` edits a calendar date, a time of day, a date and time, or a range of dates or of dates and times. It is a field control: it composes the field base ([FIELD.md](FIELD.md)) for its label, layout, description, help, validation, dirty state, restore, undo and menu, around React Aria's `DatePicker`, `TimeField` and `DateRangePicker` with dates from `@internationalized/date`. Each part of the value is a segment the reader types into or steps with the arrow keys; the date modes also open a calendar with the caller's presets and quick actions. Values are plain ISO 8601 texts, so they store, compare and serialize without conversion: `YYYY-MM-DD` dates, `HH:mm` times, floating `YYYY-MM-DDTHH:mm` dates and times, zoned `YYYY-MM-DDTHH:mm:ss±HH:MM[Zone]` dates and times in a chosen time zone, and `{ start, end }` ranges of dates or of dates and times, to the hour, minute or second. The field converts them to and from the building blocks' date objects inside its implementation.

## UIC-DATE-TIME-FIELD-1 - Field

### UIC-DATE-TIME-FIELD-1.1 - Structure

`DateTimeField` shall render a `Field` whose root also carries `ui-date-time-field` and publishes `data-mode` (`date` by default, `time`, `date-time`, `date-range` or `date-time-range`). Its control is React Aria's picker (`ui-date-time-field__picker`) holding a group (`ui-date-time-field__group`) with the segments of the value in an input (`ui-date-time-field__input`) of segments (`ui-date-time-field__segment`, React Aria's `spinbutton` segments publishing `data-type`), each named by its part and the field's label and described by the field's description, decoration and message. The date modes end the group with a calendar button (`ui-date-time-field__button`, the `calendar` glyph, named by React Aria). A range has a start and an end input with a separator between them (`ui-date-time-field__separator`, hidden from assistive technology). The time mode ends it with later and earlier step buttons instead ([UIC-DATE-TIME-FIELD-4.6](#uic-date-time-field-46---time-picker)). Each space in a segment's text, which runtimes write differently (a narrow no-break space or a plain space before AM and PM), is a no-break space, so the server's segments and the browser's agree and a space that stands alone in a literal segment never collapses. The reference stylesheet sizes the control to its value, so a label after it (`control-label`) sits right beside it, gives a date and time range the width its value needs, and wraps a range's end, separator and button onto further rows of the frame where the field is narrower, so every segment stays inside the frame and reachable. Feedback wraps within the field without increasing its intrinsic width; the control leaves room for the reserved restore button, and inline saved text shrinks before the current segments. The state lab compares an unchanged displayed value with saved text hidden, and separately shows empty placeholders and saved values in narrow columns, where their different content may change the intrinsic size or wrap.

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-time-pickers.tsx`, `src/core/glyphs.tsx`, `src/utils/intl-format.ts`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-1.2 - Values

The value shall be `null` or an ISO 8601 text by mode, and the field shall write every value it sets in that mode's canonical form:

| Mode              | Canonical value                                                             | Also read                                               |
| ----------------- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| `date`            | `YYYY-MM-DD`                                                                |                                                         |
| `time`            | `HH:mm` (`HH:mm:ss` at the `second` granularity)                            | `HH:mm:ss`, `HH:mm:ss.sss`                              |
| `date-time`       | floating `YYYY-MM-DDTHH:mm` (`…:ss` at `second`)                            | a text with an offset (`Z`, `+02:00`) or a zone (`[…]`) |
| `date-time` zoned | `YYYY-MM-DDTHH:mm:ss±HH:MM[Zone]` with `timeZone` (UIC-DATE-TIME-FIELD-4.2) | an offset or zoned text, a floating text                |
| `date-range`      | `{ start, end }` of `date` values                                           |                                                         |
| `date-time-range` | `{ start, end }` of `date-time` values, floating or zoned                   | as `date-time` (UIC-DATE-TIME-FIELD-4.3)                |

`YYYY` is always four digits, so a year before 1000 keeps its leading zeros (`0099-04-20T12:30`). A floating date and time has no zone: its segments edit it as written. A text with an offset or a zone given to a floating field reads as the wall time of its instant in the local zone: the provider's `timeZone`, else UTC on the server and while hydrating, then the browser's zone, so the server and the first client render agree. Switching to the browser's zone after hydration changes only what the segments, bounds and previous value show, never the value. A text the mode cannot read (`2026-02-30`, `25:00`, a date in a date-time mode) shows as empty segments and is never rewritten until the reader sets a value, but is invalid with the provider string `dateUnreadable` and so blocks a `Form` submit; a range mode reads only a `{ start, end }` range whose ends it can both read, and a single mode only a text.

Implementation: `src/components/date-time-field/date-values.ts`, `src/components/date-time-field/date-time-pickers.tsx`, `src/primitives/date-values.ts`
Verification: `src/components/date-time-field/date-values.test.ts`, `src/components/date-time-field/date-time-field.test.tsx`, `src/components/date-time-field/date-time-zones.test.tsx`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-1.3 - Commit

Every complete change, typed into the segments, picked from the calendar or set by a quick action, shall set the value and commit it, unless the value is out of bounds (UIC-DATE-TIME-FIELD-1.4). An incomplete entry, with some segments still empty, stays in the segments as typed without changing the value. Clearing the segments sets `null`.

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-time-pickers.tsx`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-1.4 - Bounds

`minValue` and `maxValue`, ISO 8601 texts read as one end of the mode's value (dates for a date range, dates and times for a date-time range, compared as instants when zoned), shall bound the value: the calendar refuses days outside them, and a value typed outside them stays on screen, uncommitted, while the field is invalid with the provider string `dateTooEarly` or `dateTooLate` naming the localized bound. A range whose end precedes its start is invalid the same way. The caller's `validate` runs on values within bounds.

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-values.ts`, `src/core/strings.ts`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `src/components/date-time-field/date-values.test.ts`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-1.5 - States

The field base's validation shall apply (required, `validate`, `isPending`), and an invalid field marks its picker invalid (`data-invalid`). A read-only field shows read-only segments and never opens its calendar; a disabled field, or one in a disabled `Fieldset`, disables its segments and button. While read-only or disabled, in every mode, the calendar stays closed whatever `isOpen` or `defaultOpen` ask, and a calendar open when the field locks closes, without reporting a change of `isOpen`.

Implementation: `src/components/date-time-field/date-time-pickers.tsx`
Verification: `src/components/date-time-field/date-time-field.test.tsx`

### UIC-DATE-TIME-FIELD-1.6 - Previous value

While the field is dirty and its committed value is not empty, the group shall start with that value, localized at the editor's precision (seconds at the `second` granularity) and hour cycle (a range with an unreadable end joined by the provider's `valueRange` message, and a reversed range joined from its localized endpoints), as a `FieldPreviousValue` (`ui-date-time-field__previous`), so a difference the segments show is visible in it too. Its spaces are plain spaces whatever the runtime writes, so it hydrates as rendered on the server.

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-time-pickers.tsx`, `src/components/date-time-field/date-values.ts`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `src/components/date-time-field/date-values.test.ts`, `e2e/date-time-field.spec.ts`

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

The calendar button shall open a popover (`ui-date-time-field__popover`) on the `dropdown` layer, publishing `data-layer` and taking its z-index from `useLayerZIndex('dropdown')`, holding a dialog (`ui-date-time-field__dialog`) with React Aria's calendar (`ui-date-time-field__calendar`): a header (`ui-date-time-field__calendar-header`, with no landmark role) with previous and next buttons (`ui-date-time-field__calendar-nav`, named by the provider strings `previous` and `next`, their chevrons pointing to the inline start and end, so mirrored right to left) around the month heading (`ui-date-time-field__calendar-heading`), and a month grid (`ui-date-time-field__calendar-grid` in `ui-date-time-field__calendar-months`) of weekday headers (`ui-date-time-field__calendar-head`, `ui-date-time-field__calendar-weekday`) and day cells (`ui-date-time-field__calendar-body`, `ui-date-time-field__calendar-cell`). A range shows one range calendar of two months. The arrow keys move between days, Enter picks, and Escape or a press outside the popover, its group and the heading's own lists closes it. The popover is nonmodal: the page outside stays scrollable, reachable and visible to assistive technology while it is open, and the popover follows its group as the page scrolls, without the first scroll being spent on releasing a lock; a scroll of an element that holds the field closes it, since it cannot follow that, and inside a modal the modal's own scroll lock still holds. Picking a day closes it in the date modes; with a time, it stays open for the time columns ([UIC-DATE-TIME-FIELD-4.6](#uic-date-time-field-46---time-picker)). The reference stylesheet keeps the popover within the viewport (less the overlay gutter) down to 320 CSS pixels and at zoom: there a range's months stack, presets stand above the calendar and wrap, and the heading wraps, so every day, navigation button, preset and action stays in view; what still cannot fit scrolls inside the popover, never the page.

Implementation: `src/components/date-time-field/date-time-calendar.tsx`, `src/components/date-time-field/calendar-anchoring.ts`, `src/utils/use-scroll-close-guard.ts`, `src/components/date-time-field/date-time-pickers.tsx`, `labs/reference/date-time-field.css`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-2.2 - Quick actions

The popover shall end with quick actions (`ui-date-time-field__actions`, each a ghost `Button` also carrying `ui-date-time-field__action`): Today (provider string `today`) for a date, Now (`now`) for a date and time, to the minute, as a floating or (with `timeZone`) zoned value, and Clear (`clear`) in every picker mode unless the field is required, disabled while there is no value to clear. Each sets its value, commits it and closes the popover; Today and Now read the clock when pressed, not when the popover opened: the provider's clock (`getNow`, UIC-PROVIDER-8), with the day and wall time read in the field's `timeZone`, else the provider's zone, so every date control under one provider agrees on today. Today and Now are disabled while the field would refuse their value (outside `minValue`/`maxValue`, unavailable or taken, UIC-DATE-TIME-FIELD-3.1), and a quick action or preset whose value the field refuses when pressed, because the clock moved on or the rules changed while the popover was open, picks nothing and leaves the popover open. An empty zoned field starts typing from midnight of that today, once the clock may be read after hydration.

Implementation: `src/components/date-time-field/date-time-calendar.tsx`, `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-values.ts`, `src/core/strings.ts`
Verification: `src/components/date-time-field/date-time-field.test.tsx`, `e2e/date-time-field.spec.ts`

## UIC-DATE-TIME-FIELD-3 - Availability, presets and calendar heading

### UIC-DATE-TIME-FIELD-3.1 - Unavailable dates

`isDateUnavailable(date)`, called with the `YYYY-MM-DD` date a day or value falls on (in the field's time zone for a zoned value), shall refuse dates such as weekends or booked days: the calendar marks them `data-unavailable` and does not pick them, and a value typed on such a date stays on screen, uncommitted, while the field is invalid with the provider string `dateUnavailable`. A range is refused when any day it spans is unavailable, its ends and every day between them included, whether it is typed, picked in the calendar or chosen as a preset. A value outside the bounds reports the bound instead.

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-values.ts`, `src/components/date-time-field/date-time-pickers.tsx`, `src/core/strings.ts`
Verification: `src/components/date-time-field/date-time-presets.test.tsx`, `src/components/date-time-field/date-values.test.ts`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-3.2 - Presets

`presets`, a list of `{ label, value }` with values in the mode's format, shall be offered in the popover before the calendar (`ui-date-time-field__presets`), each a ghost `Button` also carrying `ui-date-time-field__preset`. Pressing one sets its value, written as the editor writes a pick (zoned in `timeZone`, without parts finer than the granularity, for a single value and each end of a range), commits it and closes the popover. A preset whose written value the field would refuse, outside the bounds or on an unavailable date, is disabled. Presets are told apart by their place and value, never their label: two presets may share a label, and a relabelled preset (a locale change) keeps its button and focus. Rendering never rewrites a value the caller passes. The time mode, which has no popover, offers none.

Implementation: `src/components/date-time-field/date-time-calendar.tsx`, `src/components/date-time-field/date-time-field.tsx`
Verification: `src/components/date-time-field/date-time-presets.test.tsx`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-3.3 - Month and year selects

With `calendarHeading="select"`, the calendar heading shall show a month select and a year select instead of its text (React Aria `CalendarMonthPicker` and `CalendarYearPicker`, each a React Aria `Select`: `ui-date-time-field__calendar-select` publishing `data-unit` `month` or `year`, its button `ui-date-time-field__calendar-select-button` showing the choice, and a popover `ui-date-time-field__calendar-select-popover` on the `dropdown` layer holding a listbox `ui-date-time-field__calendar-select-list` of options `ui-date-time-field__calendar-select-option`), named by the locale's words for month and year. Picking a month or a year moves the calendar there without changing the value; in a range calendar they choose the first visible month.

Implementation: `src/components/date-time-field/date-time-calendar-heading.tsx`, `src/components/date-time-field/date-time-calendar.tsx`
Verification: `src/components/date-time-field/date-time-calendar-heading.test.tsx`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-3.4 - Calendar date states

`getDateState(isoDate)` returns an optional `{ tone, description, isDisabled, isTaken }` for each ISO calendar day. Semantic tones are neutral, info, success, warning and danger; the stylesheet chooses their colors. The description is exposed to assistive technology. Disabled and taken dates are unavailable in the calendar, typed input, quick presets and every day of an inclusive range. Taken dates are struck through by the reference stylesheet. Disabled dates and dates outside the viewed month are faded without a strike-through, and the reference stylesheet hatches the unavailable days of the viewed month. Highlights can coexist with unavailability. Each cell's states come from `getDateState` on every render, so they hold through every pick, month change and reopening. While a range is being chosen, the days it can no longer reach (past an unavailable day from the first one chosen) publish `data-disabled` alone, and unavailable days keep `data-unavailable` with their tone, taken and description, so a stylesheet tells the two apart. A drag released on a day the range cannot reach picks nothing: the field keeps its value and the first day stays chosen until another day is picked.

Implementation: `src/components/date-time-field/date-time-field.tsx`, `src/components/date-time-field/date-time-calendar.tsx`, `src/components/date-time-field/date-values.ts`
Verification: `src/components/date-time-field/date-states.test.tsx`, `e2e/date-states.spec.ts`

## UIC-DATE-TIME-FIELD-4 - Time, zones, ranges and forms

### UIC-DATE-TIME-FIELD-4.1 - Granularity and hour cycle

`granularity` (`hour`, `minute`, the default, or `second`) shall set the smallest time segment of the time, date-time and date-time range modes. With `second`, a time value is `HH:mm:ss`, a date and time keeps its seconds and Now picks the current second; with `hour` the segments stop at the hour. Parts finer than the granularity are written as zero (`07:00` at `hour`). `hourCycle` (`12` or `24`) shows the hours of a day in that cycle whatever the locale's.

Implementation: `src/components/date-time-field/date-time-pickers.tsx`, `src/components/date-time-field/date-values.ts`, `src/primitives/date-values.ts`
Verification: `src/components/date-time-field/date-time-zones.test.tsx`, `src/components/date-time-field/date-values.test.ts`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-4.2 - Time zones

With `timeZone`, an IANA zone such as `Asia/Tokyo`, the date-time modes shall edit zoned values as wall time in that zone, ending their segments with the zone (`data-type="timeZoneName"`) unless `hideTimeZone`. Values are written zoned, with seconds, offset and zone (`2026-04-13T12:00:00+09:00[Asia/Tokyo]`). A zoned text in another zone or a text with an offset (`2026-04-13T03:00:00Z`) converts to the same instant in the field's zone; a floating text reads as wall time in it, and a wall time the zone's clocks skip reads as the time after the gap. Dropping parts finer than the granularity, for an edit, Now or either range end, keeps a value in a repeated hour (the hour the clocks fall back through) in the occurrence it was in, including half-hour transitions. The previous value, bound messages and Now read in the zone.

Implementation: `src/components/date-time-field/date-time-pickers.tsx`, `src/components/date-time-field/date-values.ts`, `src/components/date-time-field/date-time-field.tsx`, `src/primitives/date-values.ts`
Verification: `src/components/date-time-field/date-time-zones.test.tsx`, `src/components/date-time-field/date-values.test.ts`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-4.3 - Date-time ranges

`mode="date-time-range"` shall edit a range whose start and end inputs hold date and time segments, with the range calendar of two months and the Clear action. Its value is a `{ start, end }` of `date-time` values, floating or (with `timeZone`) zoned, its bounds are dates and times, and an end before the start is invalid as in UIC-DATE-TIME-FIELD-1.4.

Implementation: `src/components/date-time-field/date-time-pickers.tsx`, `src/components/date-time-field/date-values.ts`, `src/components/date-time-field/date-time-field.tsx`
Verification: `src/components/date-time-field/date-time-zones.test.tsx`, `src/components/date-time-field/date-values.test.ts`, `e2e/date-time-field.spec.ts`

### UIC-DATE-TIME-FIELD-4.4 - Form values

`name` shall add a hidden input to the field's form holding a single value's canonical text (empty without a value), and `startName` and `endName` hidden inputs holding a range's start and end. A disabled field's inputs are disabled, so its form submits none of them. [Relative Date Field](RELATIVE-DATE-FIELD.md) submits through the same inputs, so either field of a mode gives a form the same entries. Errors a [Form](FORM.md) gives in `validationErrors` under `startName` or `endName` belong to the field ([UIC-FIELD-3.9](FIELD.md#uic-field-39---external-errors)): it shows them, they block the form's submission, and each clears once its own end changes, while the other end's error stays until a new errors object or its own end changes.

Implementation: `src/components/date-time-field/date-time-form.tsx`, `src/components/date-time-field/date-time-field.tsx`, `src/components/field/field-validation.ts`
Verification: `src/components/date-time-field/date-time-form.test.tsx`, `src/components/relative-date-field/relative-date-field.test.tsx`

### UIC-DATE-TIME-FIELD-4.5 - Incomplete drafts

While a segment group is typed in part, or one end of a range has segments filled and the other none, the field shall report a draft issue (UIC-FIELD-3.11) with the provider's `dateIncomplete` string, whatever value it last accepted, and withdraw it once every group is complete or empty. A native form reset that a listener cancels (UIC-FIELD-2.6) keeps the segments typed in part: the building block clears them on the form's own reset listener, so the field notes each group typed in part as the reset starts and types those segments back once the reset is cancelled, without a change or commit. A reset that goes through leaves every group showing the initial value.

Implementation: `src/components/date-time-field/date-draft.tsx`, `src/components/date-time-field/date-time-pickers.tsx`
Verification: `src/components/form/form-validity.test.tsx`, `e2e/form.spec.ts`

### UIC-DATE-TIME-FIELD-4.6 - Time picker

The time can be set without typing, with the pointer and the wheel alone.

In every mode with a time, the wheel rolled over a time segment (the hour, minute, second or day period) steps that part as the arrow keys do, up for later and down for earlier, one step per notch, wrapping around, and focuses it; while it steps, the wheel neither scrolls the page nor reaches another component, and a zoom or mostly sideways wheel is left to the browser. The date segments and a disabled or read-only field leave the wheel to the page.

A time field has no popover. After its segments it shows two small buttons (`ui-date-time-field__steps`, each a `ui-date-time-field__step` publishing `data-direction` `later` or `earlier`, named by the provider's `timeLater` and `timeEarlier` strings) that step the time segment focused last, else the hour. They stay out of the tab order and leave focus where it is, since the arrow keys step a focused segment, and are disabled while the field is disabled or read-only.

A date and time, or a date-time range, shows time columns under the calendar in the same popover (`ui-date-time-field__time-columns`, a group named by its visible label `ui-date-time-field__time-label`, the provider's `timeOfDay` string): a column (`ui-date-time-field__time-column`, a `role="listbox"` publishing `data-unit`) of hours, of minutes and of seconds down to the granularity, and in a 12 hour cycle (the field's `hourCycle`, else the locale's) of the day periods, named by the provider's `hoursColumn`, `minutesColumn`, `secondsColumn` and `dayPeriodColumn` strings. A range shows the start's (`startTime`) and the end's (`endTime`) in `ui-date-time-field__time-range`. Each option (`ui-date-time-field__time-option`) reads as the locale writes it (two-digit minutes, `12` and `1` to `11` for a 12 hour clock's hours, the locale's AM and PM). A press on an option, or Enter or Space on the focused one, sets that part of the picker's time and keeps the others (midnight without a time), and the wheel rolled over a column steps it to the next enabled option (rolled down) or the previous one (rolled up), wrapping around, one option per notch, as over a segment. The arrow keys move within a column and Tab between columns. The chosen option scrolls to the middle of its column. Picking a day sets the date and keeps the popover open, as does a pick in the columns. The time is wall time in the field's time zone, and a pick commits as typing does.

An option is disabled when the bounds allow none of its times: an hour or a day period when none of its time is allowed, a minute or a second within the chosen hour or minute. The bounds apply on their own dates (the start's with `minValue`, the end's with `maxValue` in a range), and every option is disabled on a date past a bound. A pick that leaves the bounds, such as an hour whose kept minutes are too early, moves to the nearest allowed time on a whole step of the granularity.

Implementation: `src/components/date-time-field/time-segment-steps.tsx`, `src/components/date-time-field/date-segments.tsx`, `src/components/date-time-field/time-columns.tsx`, `src/components/date-time-field/time-columns-model.ts`, `src/components/date-time-field/date-time-time-picker.tsx`, `src/components/date-time-field/date-time-pickers.tsx`, `labs/reference/date-time-field.css`
Verification: `src/components/date-time-field/time-columns-model.test.ts`, `src/components/date-time-field/date-time-time-picker.test.tsx`, `e2e/date-time-field.spec.ts`

## Hooks

| Hook                                          | Kind      | Values                                                                                            | Description                                                             |
| --------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ui-date-time-field`                          | root      |                                                                                                   | The field root (also `ui-field`).                                       |
| `ui-date-time-field__picker`                  | slot      |                                                                                                   | React Aria's date picker, range picker or time field.                   |
| `ui-date-time-field__group`                   | slot      |                                                                                                   | The framed group of segments and button.                                |
| `ui-date-time-field__previous`                | slot      |                                                                                                   | The committed value while dirty (also `ui-field-previous-value`).       |
| `ui-date-time-field__input`                   | slot      |                                                                                                   | One run of segments (two in a range).                                   |
| `ui-date-time-field__segment`                 | slot      |                                                                                                   | One part of the value, or a literal between parts.                      |
| `ui-date-time-field__separator`               | slot      |                                                                                                   | The provider's `rangeSeparator` between a range's start and end.        |
| `ui-date-time-field__button`                  | slot      |                                                                                                   | The calendar button.                                                    |
| `ui-date-time-field__popover`                 | slot      |                                                                                                   | The calendar's floating surface.                                        |
| `ui-date-time-field__dialog`                  | slot      |                                                                                                   | The dialog holding the calendar and actions.                            |
| `ui-date-time-field__calendar`                | slot      |                                                                                                   | The calendar or range calendar.                                         |
| `ui-date-time-field__calendar-header`         | slot      |                                                                                                   | The heading row with month navigation.                                  |
| `ui-date-time-field__calendar-heading`        | slot      |                                                                                                   | The visible month heading.                                              |
| `ui-date-time-field__calendar-select`         | slot      |                                                                                                   | A month or year select of the heading.                                  |
| `ui-date-time-field__calendar-select-button`  | slot      |                                                                                                   | A heading select's button, showing its choice.                          |
| `ui-date-time-field__calendar-select-popover` | slot      |                                                                                                   | A heading select's floating surface.                                    |
| `ui-date-time-field__calendar-select-list`    | slot      |                                                                                                   | A heading select's `role="listbox"` list.                               |
| `ui-date-time-field__calendar-select-option`  | slot      |                                                                                                   | A month or year to choose.                                              |
| `ui-date-time-field__calendar-nav`            | slot      |                                                                                                   | Previous and next buttons (also `ui-button`).                           |
| `ui-date-time-field__calendar-months`         | slot      |                                                                                                   | Holds one grid per visible month.                                       |
| `ui-date-time-field__calendar-grid`           | slot      |                                                                                                   | A month grid.                                                           |
| `ui-date-time-field__calendar-head`           | slot      |                                                                                                   | The weekday header row group.                                           |
| `ui-date-time-field__calendar-weekday`        | slot      |                                                                                                   | A weekday header cell.                                                  |
| `ui-date-time-field__calendar-body`           | slot      |                                                                                                   | The grid's body.                                                        |
| `ui-date-time-field__calendar-cell`           | slot      |                                                                                                   | A day cell.                                                             |
| `ui-date-time-field__presets`                 | slot      |                                                                                                   | The caller's presets, before the calendar.                              |
| `ui-date-time-field__preset`                  | slot      |                                                                                                   | A preset (also `ui-button`).                                            |
| `ui-date-time-field__actions`                 | slot      |                                                                                                   | The quick actions.                                                      |
| `ui-date-time-field__action`                  | slot      |                                                                                                   | A quick action (also `ui-button`).                                      |
| `ui-date-time-field__time-range`              | slot      |                                                                                                   | A date-time range's start and end time columns.                         |
| `ui-date-time-field__steps`                   | slot      |                                                                                                   | A time field's later and earlier buttons.                               |
| `ui-date-time-field__step`                    | slot      |                                                                                                   | One step button.                                                        |
| `ui-date-time-field__time-columns`            | slot      |                                                                                                   | A time's columns, `role="group"`.                                       |
| `ui-date-time-field__time-label`              | slot      |                                                                                                   | The visible name of a time's columns.                                   |
| `ui-date-time-field__time-column`             | slot      |                                                                                                   | A column of hours, minutes, seconds or day periods, `role="listbox"`.   |
| `ui-date-time-field__time-option`             | slot      |                                                                                                   | An hour, minute, second or day period to pick.                          |
| `data-mode`                                   | attribute | `date`, `time`, `date-time`, `date-range`, `date-time-range`                                      | What the field edits.                                                   |
| `data-unit`                                   | state     | `month`, `year`, `hour`, `minute`, `second`, `dayPeriod`                                          | On a heading select or a time column: what it chooses.                  |
| `data-direction`                              | attribute | `later`, `earlier`                                                                                | On a step button: which way it steps.                                   |
| `data-layer`                                  | attribute | `dropdown`                                                                                        | The popover's overlay layer.                                            |
| `data-type`                                   | state     | `era`, `year`, `month`, `day`, `hour`, `minute`, `second`, `dayPeriod`, `timeZoneName`, `literal` | A segment's part (React Aria).                                          |
| `data-placeholder`                            | state     | `true`                                                                                            | An empty segment (React Aria).                                          |
| `data-open`                                   | state     | `true`                                                                                            | The calendar is open (React Aria).                                      |
| `data-focused`                                | state     | `true`                                                                                            | Focused (React Aria).                                                   |
| `data-focus-visible`                          | state     | `true`                                                                                            | Keyboard focus (React Aria).                                            |
| `data-focus-within`                           | state     | `true`                                                                                            | Focus inside (React Aria).                                              |
| `data-hovered`                                | state     | `true`                                                                                            | Pointer over the element (React Aria).                                  |
| `data-pressed`                                | state     | `true`                                                                                            | Pressed (React Aria).                                                   |
| `data-disabled`                               | state     | `true`                                                                                            | Disabled (React Aria).                                                  |
| `data-readonly`                               | state     | `true`                                                                                            | Read-only (React Aria).                                                 |
| `data-invalid`                                | state     | `true`                                                                                            | Invalid (React Aria).                                                   |
| `data-required`                               | state     | `true`                                                                                            | Required (React Aria).                                                  |
| `data-selected`                               | state     | `true`                                                                                            | A picked day (React Aria).                                              |
| `data-selection-start`                        | state     | `true`                                                                                            | The first day of a picked range (React Aria).                           |
| `data-selection-end`                          | state     | `true`                                                                                            | The last day of a picked range (React Aria).                            |
| `data-today`                                  | state     | `true`                                                                                            | Today's cell (React Aria).                                              |
| `data-outside-month`                          | state     | `true`                                                                                            | A day of another month (React Aria).                                    |
| `data-outside-visible-range`                  | state     | `true`                                                                                            | A day outside the visible months (React Aria).                          |
| `data-unavailable`                            | state     | `true`                                                                                            | A day that cannot be picked (React Aria).                               |
| `data-placement`                              | state     | `top`, `bottom`, `left`, `right`, `center`                                                        | Side of the group the popover opened on (React Aria).                   |
| `data-trigger`                                | state     | `DatePicker`, `DateRangePicker`, `Select`                                                         | What opened the popover (React Aria).                                   |
| `data-entering`                               | state     | `true`                                                                                            | Popover entry animation (React Aria).                                   |
| `data-exiting`                                | state     | `true`                                                                                            | Popover exit animation (React Aria).                                    |
| `data-collection`                             | state     |                                                                                                   | On a heading select's list and options: React Aria's collection marker. |
| `data-key`                                    | state     |                                                                                                   | On a heading select's option: the month or year number (React Aria).    |
| `data-selection-mode`                         | state     | `single`                                                                                          | On a heading select's option (React Aria).                              |
| `data-layout`                                 | state     | `stack`                                                                                           | On a heading select's list (React Aria).                                |
| `data-orientation`                            | state     | `vertical`                                                                                        | On a heading select's list (React Aria).                                |
| `data-tone`                                   | attribute | `neutral`, `info`, `success`, `warning`, `danger`                                                 | Calendar cell highlight.                                                |
| `data-taken`                                  | state     | `true`                                                                                            | Calendar cell is taken and unavailable.                                 |
