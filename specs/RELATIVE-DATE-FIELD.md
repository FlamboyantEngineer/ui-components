# Relative Date Field

`RelativeDateField` sets a date, a date and time or a range of dates, as ISO 8601 texts, from presets that read relative to now, such as Today, Tomorrow, In 3 days or Last 7 days, and optionally from a calendar beside them. It is a field control: it composes the field base ([FIELD.md](FIELD.md)) for its label, layout, description, help, validation, dirty state, restore, undo and menu, around React Aria's `Select`. The trigger reads the value relative to now, and a `<time>` element after it gives the absolute date; every text is formatted through `Intl` for the reader's locale. Picking a preset commits the concrete date it stands for; bounds disable the presets they refuse. A date typed into segments is a [Date Time Field](DATE-TIME-FIELD.md), whose calendar parts this field draws.

## UIC-RELATIVE-DATE-FIELD-1 - Field

### UIC-RELATIVE-DATE-FIELD-1.1 - Structure

`RelativeDateField` shall render a `Field` whose root also carries `ui-relative-date-field`, publishes `data-mode` (`date` by default, `date-time` or `date-range`, modes it shares with [Date Time Field](DATE-TIME-FIELD.md), whose `DateRangeValue` is its range) and, while the value is a date, `data-relation` (`past`, `present` or `future`). Its control is React Aria's `Select` (`ui-relative-date-field__select`) with a trigger button (`ui-relative-date-field__trigger`) that carries the control's id and is named by its value element (`ui-relative-date-field__value`) followed by the field's label, and ends with a chevron glyph (`ui-relative-date-field__chevron`). After the select, a `<time>` element (`ui-relative-date-field__preview`) carries the value in its `datetime` attribute and shows it as an absolute, localized date (with the time for a date and time); for a range the preview is a `<span>` holding a `<time>` element per end.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`
Verification: `src/components/relative-date-field/relative-date-field.test.tsx`, `e2e/relative-date-field.spec.ts`

### UIC-RELATIVE-DATE-FIELD-1.2 - Relative text

The trigger shall read the value relative to `getNow()` (the provider's clock by default, else the current time), reading days in `timeZone` (the provider's by default, else the browser's, as in [Date Time Field](DATE-TIME-FIELD.md)) in the locale's words, starting with a capital: a date and time within a day as `Now` for its first minute, then in minutes or hours (`5 minutes ago`, `In 2 hours`), a value within `fallbackAfterDays` (7 by default) in calendar days (`Today`, `Tomorrow`, `Yesterday`, `In 3 days`, `4 days ago`), and anything farther as its absolute date. The words come from the shared relative time formatter that [Relative Time](RELATIVE-TIME.md#uic-relative-time-21---shared-formatter) also uses. Without a value, or with a value that is not a date, the trigger shows `placeholder` (by default the provider string `selectPlaceholder`), its value element publishes `data-placeholder`, and no preview renders.

Implementation: `src/components/relative-date-field/relative-date.ts`, `src/components/relative-date-field/relative-date-field.tsx`, `src/utils/relative-time.ts`, `src/primitives/date-values.ts`
Verification: `src/components/relative-date-field/relative-date.test.ts`, `src/components/relative-date-field/relative-date-field.test.tsx`

### UIC-RELATIVE-DATE-FIELD-1.3 - Presets

Pressing the trigger shall open the presets in a popover (`ui-relative-date-field__popover`) on the `dropdown` layer, publishing `data-layer` and taking its z-index from `useLayerZIndex('dropdown')` and publishing the trigger's width as `--ui-trigger-width`, as options (`ui-relative-date-field__option`) of a listbox (`ui-relative-date-field__listbox`). `presets` lists them as `{ amount, unit }` counts of days, weeks, months or years from now (negative for the past), each labelled in the locale's words (`Next week`, `In 3 days`); the default presets are today, tomorrow, yesterday, next week and last week. Picking one commits the date it stands for: a `YYYY-MM-DD` date, or, with `mode="date-time"`, the local date and time to the minute as a floating `YYYY-MM-DDTHH:mm` text. A date-time value with an offset or a zone (`2026-04-20T08:05:00Z`, `2026-04-20T10:05:00+02:00[Europe/Paris]`) reads as the local wall time of its instant; a value that is no date or date and time is not a date (UIC-RELATIVE-DATE-FIELD-1.2). The select holds no choice, so picking the same preset again commits again. Only the open list picks: on the closed trigger Arrow Down, Arrow Up, Enter and Space open the list, and Arrow Left, Arrow Right and typing commit nothing.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`, `src/components/relative-date-field/relative-date.ts`
Verification: `src/components/relative-date-field/relative-date-field.test.tsx`, `src/components/relative-date-field/relative-date.test.ts`, `e2e/relative-date-field.spec.ts`

### UIC-RELATIVE-DATE-FIELD-1.4 - States, restore and menu

The field base's validation (an invalid field marks its select invalid), restore button, undo and redo chords and field menu shall apply; Clear sets `null`. A read-only field keeps its trigger focusable but never opens the presets, and pressing it calls no `onOpenChange`; a disabled field disables its trigger and keeps its presets closed, even when explicitly opened. Both keep their preview.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`
Verification: `src/components/relative-date-field/relative-date-field.test.tsx`

### UIC-RELATIVE-DATE-FIELD-1.5 - Hooks and caller attributes

`RelativeDateField` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes and `id` to the field root, and pass `isOpen`, `defaultOpen` and `onOpenChange` to React Aria's `Select`.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`
Verification: `src/components/relative-date-field/relative-date-field.test.tsx`

### UIC-RELATIVE-DATE-FIELD-1.6 - Form value

The field shall submit its value with its form exactly as a [Date Time Field](DATE-TIME-FIELD.md#uic-date-time-field-44---form-values) of the same mode does: a date or a date and time under `name`, a range's ends under `startName` and `endName`, and empty texts while there is no value, never a preset's position. The inputs follow every change of the value, from a pick, a controlled value, Clear, undo, restore or a native form reset (UIC-FIELD-2.6). A read-only field submits its value; a disabled field, or one inside a disabled `<fieldset>`, submits nothing, and a field without names adds no entry.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`, `src/components/date-time-field/date-time-form.tsx`
Verification: `src/components/relative-date-field/relative-date-field.test.tsx`, `e2e/relative-date-field.spec.ts`

## UIC-RELATIVE-DATE-FIELD-2 - Calendar, labels, ranges and bounds

### UIC-RELATIVE-DATE-FIELD-2.1 - Calendar beside the presets

With `showCalendar`, the popover shall hold, after the presets, a React Aria calendar (`ui-relative-date-field__calendar`) drawn with the [Date Time Field](DATE-TIME-FIELD.md)'s calendar parts (`ui-date-time-field__calendar-header` to `ui-date-time-field__calendar-cell`, with previous and next buttons named by the provider strings `previous` and `next`), showing the value's day. Tab moves from the presets into the calendar. Picking a day commits it, a `YYYY-MM-DD` date or, with `mode="date-time"`, that day at the current time of day (`YYYY-MM-DDTHH:mm`), then closes the popover; for `date-range` a range calendar commits the picked range.

Implementation: `src/components/relative-date-field/relative-date-calendar.tsx`, `src/components/relative-date-field/relative-date-field.tsx`, `src/components/date-time-field/date-time-calendar.tsx`
Verification: `src/components/relative-date-field/relative-date-calendar.test.tsx`, `e2e/relative-date-field.spec.ts`

### UIC-RELATIVE-DATE-FIELD-2.2 - Preset labels and computed presets

A `{ amount, unit }` preset with a `label` shall be listed under that label instead of the generated one. A preset `{ label, getValue }` is listed under its label and commits the value `getValue(now)` returns from the field's clock, such as the end of the quarter.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`, `src/components/relative-date-field/relative-date.ts`
Verification: `src/components/relative-date-field/relative-date-select.test.tsx`, `src/components/relative-date-field/relative-date.test.ts`, `e2e/relative-date-field.spec.ts`

### UIC-RELATIVE-DATE-FIELD-2.3 - Relative ranges

With `mode="date-range"`, the value shall be a `{ start, end }` range of `YYYY-MM-DD` dates. A `{ amount, unit }` preset runs from that point to today when the amount is negative and from today to it when positive, labelled by the provider strings `lastPeriod` and `nextPeriod` from the count in the locale's words (`Last 7 days`, `Next 2 weeks`), or by the relative word for an amount of zero (`Today`). The default presets are today, the last 7 days, the last 30 days and the next 7 days. The trigger reads each end relative to now (`3 days ago – Today`), each end farther than `fallbackAfterDays` as its date, and `data-relation` is `past` once the range ends before today, `future` while it starts after, and `present` around it.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`, `src/components/relative-date-field/relative-date.ts`, `src/core/strings.ts`
Verification: `src/components/relative-date-field/relative-date-select.test.tsx`, `src/components/relative-date-field/relative-date.test.ts`, `e2e/relative-date-field.spec.ts`

### UIC-RELATIVE-DATE-FIELD-2.4 - Bounds

`minValue` and `maxValue`, `YYYY-MM-DD` dates, shall disable the presets whose value (either end of a range) falls outside them, and the calendar refuses the days outside. A value outside them is invalid with the provider string `dateTooEarly` or `dateTooLate` naming the localized bound. A range whose end precedes its start is invalid as `dateTooEarly` naming its start, as in `DateTimeField` (the two fields share one bound check, `findOrderedBoundIssue`), and either end is checked against both bounds whatever their order; a preset whose range is reversed is disabled, and an invalid value blocks a `Form` submit.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`, `src/components/relative-date-field/relative-date.ts`, `src/components/relative-date-field/relative-date-calendar.tsx`, `src/utils/date-bounds.ts`
Verification: `src/components/relative-date-field/relative-date-select.test.tsx`, `src/components/relative-date-field/relative-date.test.ts`, `e2e/relative-date-field.spec.ts`

## Hooks

| Hook                               | Kind      | Values                                     | Description                                                                     |
| ---------------------------------- | --------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| `ui-relative-date-field`           | root      |                                            | The field root (also `ui-field`).                                               |
| `ui-relative-date-field__select`   | slot      |                                            | React Aria's select wrapper.                                                    |
| `ui-relative-date-field__trigger`  | slot      |                                            | The trigger button.                                                             |
| `ui-relative-date-field__value`    | slot      |                                            | The relative text or placeholder; names the trigger.                            |
| `ui-relative-date-field__chevron`  | slot      |                                            | The trigger's chevron glyph.                                                    |
| `ui-relative-date-field__popover`  | slot      |                                            | The presets' floating surface.                                                  |
| `--ui-trigger-width`               | property  |                                            | Width of the element the popover opens from, in pixels.                         |
| `ui-relative-date-field__listbox`  | slot      |                                            | The `role="listbox"` list of presets.                                           |
| `ui-relative-date-field__option`   | slot      |                                            | One preset.                                                                     |
| `ui-relative-date-field__preview`  | slot      |                                            | The `<time>` element with the absolute date; a `<span>` of two for a range.     |
| `ui-relative-date-field__calendar` | slot      |                                            | The calendar beside the presets (holding the Date Time Field's calendar parts). |
| `data-mode`                        | attribute | `date`, `date-time`, `date-range`          | What a preset commits.                                                          |
| `data-layer`                       | attribute | `dropdown`                                 | The popover's overlay layer.                                                    |
| `data-relation`                    | state     | `past`, `present`, `future`                | Where the value lies against now.                                               |
| `data-placeholder`                 | state     | `true`                                     | On the value: there is no date to read.                                         |
| `data-open`                        | state     | `true`                                     | The presets are open (React Aria).                                              |
| `data-focused`                     | state     | `true`                                     | Focused (React Aria).                                                           |
| `data-focus-visible`               | state     | `true`                                     | Keyboard focus (React Aria).                                                    |
| `data-hovered`                     | state     | `true`                                     | Pointer over the element (React Aria).                                          |
| `data-pressed`                     | state     | `true`                                     | Pressed (React Aria).                                                           |
| `data-disabled`                    | state     | `true`                                     | Disabled (React Aria).                                                          |
| `data-invalid`                     | state     | `true`                                     | Invalid (React Aria).                                                           |
| `data-required`                    | state     | `true`                                     | Required (React Aria).                                                          |
| `data-selection-mode`              | state     | `single`                                   | Selection of the presets (React Aria).                                          |
| `data-placement`                   | state     | `top`, `bottom`, `left`, `right`, `center` | Side of the trigger the popover opened on (React Aria).                         |
| `data-trigger`                     | state     | `Select`                                   | What opened the popover (React Aria).                                           |
| `data-entering`                    | state     | `true`                                     | Popover entry animation (React Aria).                                           |
| `data-exiting`                     | state     | `true`                                     | Popover exit animation (React Aria).                                            |
| `data-collection`                  | state     |                                            | React Aria's collection marker.                                                 |
| `data-key`                         | state     |                                            | A preset's key (React Aria).                                                    |
| `data-layout`                      | state     | `stack`                                    | Listbox layout (React Aria).                                                    |
| `data-orientation`                 | state     | `vertical`                                 | Listbox orientation (React Aria).                                               |
| `data-empty`                       | state     | `true`                                     | An empty list (React Aria).                                                     |
