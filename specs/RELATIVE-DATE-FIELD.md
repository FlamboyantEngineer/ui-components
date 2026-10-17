# Relative Date Field

`RelativeDateField` sets a date from presets that read relative to now, such as Today, Tomorrow or In 3 days. It is a field control: it composes the field base ([FIELD.md](FIELD.md)) for its label, layout, description, help, validation, dirty state, restore, undo and menu, around React Aria's `Select`. The trigger reads the value relative to now, and a `<time>` element after it gives the absolute date; every text is formatted through `Intl` for the reader's locale. Picking a preset commits the concrete date it stands for. A date typed or picked from a calendar is a [Date Time Field](DATE-TIME-FIELD.md).

## UIC-RELATIVE-DATE-FIELD-1 - Field

### UIC-RELATIVE-DATE-FIELD-1.1 - Structure

`RelativeDateField` shall render a `Field` whose root also carries `ui-relative-date-field`, publishes `data-value-kind` (`date` by default, or `date-time`) and, while the value is a date, `data-relation` (`past`, `present` or `future`). Its control is React Aria's `Select` (`ui-relative-date-field__select`) with a trigger button (`ui-relative-date-field__trigger`) that carries the control's id and is named by its value element (`ui-relative-date-field__value`) followed by the field's label, and ends with a chevron glyph (`ui-relative-date-field__chevron`). After the select, a `<time>` element (`ui-relative-date-field__preview`) carries the value in its `datetime` attribute and shows it as an absolute, localized date (with the time for an instant).

Implementation: `src/components/relative-date-field/relative-date-field.tsx`
Verification: `src/components/relative-date-field/relative-date-field.test.tsx`, `e2e/relative-date-field.spec.ts`

### UIC-RELATIVE-DATE-FIELD-1.2 - Relative text

The trigger shall read the value relative to `getNow()` (the current time by default) in the locale's words, starting with a capital: an instant within a day in seconds, minutes or hours (`5 minutes ago`, `In 2 hours`), a value within `fallbackAfterDays` (7 by default) in calendar days (`Today`, `Tomorrow`, `Yesterday`, `In 3 days`, `4 days ago`), and anything farther as its absolute date. Without a value, or with a value that is not a date, the trigger shows `placeholder` (by default the provider string `selectPlaceholder`), its value element publishes `data-placeholder`, and no preview renders.

Implementation: `src/components/relative-date-field/relative-date.ts`, `src/components/relative-date-field/relative-date-field.tsx`
Verification: `src/components/relative-date-field/relative-date.test.ts`, `src/components/relative-date-field/relative-date-field.test.tsx`

### UIC-RELATIVE-DATE-FIELD-1.3 - Presets

Pressing the trigger shall open the presets in a popover (`ui-relative-date-field__popover`) on the `dropdown` layer, publishing `data-layer` and taking its z-index from `useLayerZIndex('dropdown')`, as options (`ui-relative-date-field__option`) of a listbox (`ui-relative-date-field__listbox`). `presets` lists them as `{ amount, unit }` counts of days, weeks, months or years from now (negative for the past), each labelled in the locale's words (`Next week`, `In 3 days`); the default presets are today, tomorrow, yesterday, next week and last week. Picking one commits the date it stands for: a `YYYY-MM-DD` date, or, with `valueKind="date-time"`, a UTC ISO instant. The select holds no choice, so picking the same preset again commits again.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`, `src/components/relative-date-field/relative-date.ts`
Verification: `src/components/relative-date-field/relative-date-field.test.tsx`, `src/components/relative-date-field/relative-date.test.ts`, `e2e/relative-date-field.spec.ts`

### UIC-RELATIVE-DATE-FIELD-1.4 - States, restore and menu

The field base's validation (an invalid field marks its select invalid), restore button, undo and redo chords and field menu shall apply; Clear sets `null`. A read-only field keeps its trigger focusable but never opens the presets; a disabled field disables its trigger. Both keep their preview.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`
Verification: `src/components/relative-date-field/relative-date-field.test.tsx`

### UIC-RELATIVE-DATE-FIELD-1.5 - Hooks and caller attributes

`RelativeDateField` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes and `id` to the field root, and pass `isOpen`, `defaultOpen` and `onOpenChange` to React Aria's `Select`.

Implementation: `src/components/relative-date-field/relative-date-field.tsx`
Verification: `src/components/relative-date-field/relative-date-field.test.tsx`

## Hooks

| Hook                              | Kind      | Values                                     | Description                                             |
| --------------------------------- | --------- | ------------------------------------------ | ------------------------------------------------------- |
| `ui-relative-date-field`          | root      |                                            | The field root (also `ui-field`).                       |
| `ui-relative-date-field__select`  | slot      |                                            | React Aria's select wrapper.                            |
| `ui-relative-date-field__trigger` | slot      |                                            | The trigger button.                                     |
| `ui-relative-date-field__value`   | slot      |                                            | The relative text or placeholder; names the trigger.    |
| `ui-relative-date-field__chevron` | slot      |                                            | The trigger's chevron glyph.                            |
| `ui-relative-date-field__popover` | slot      |                                            | The presets' floating surface.                          |
| `ui-relative-date-field__listbox` | slot      |                                            | The `role="listbox"` list of presets.                   |
| `ui-relative-date-field__option`  | slot      |                                            | One preset.                                             |
| `ui-relative-date-field__preview` | slot      |                                            | The `<time>` element with the absolute date.            |
| `data-value-kind`                 | attribute | `date`, `date-time`                        | What a preset commits.                                  |
| `data-layer`                      | attribute | `dropdown`                                 | The popover's overlay layer.                            |
| `data-relation`                   | state     | `past`, `present`, `future`                | Where the value lies against now.                       |
| `data-placeholder`                | state     | `true`                                     | On the value: there is no date to read.                 |
| `data-open`                       | state     | `true`                                     | The presets are open (React Aria).                      |
| `data-focused`                    | state     | `true`                                     | Focused (React Aria).                                   |
| `data-focus-visible`              | state     | `true`                                     | Keyboard focus (React Aria).                            |
| `data-hovered`                    | state     | `true`                                     | Pointer over the element (React Aria).                  |
| `data-pressed`                    | state     | `true`                                     | Pressed (React Aria).                                   |
| `data-disabled`                   | state     | `true`                                     | Disabled (React Aria).                                  |
| `data-invalid`                    | state     | `true`                                     | Invalid (React Aria).                                   |
| `data-required`                   | state     | `true`                                     | Required (React Aria).                                  |
| `data-selection-mode`             | state     | `single`                                   | Selection of the presets (React Aria).                  |
| `data-placement`                  | state     | `top`, `bottom`, `left`, `right`, `center` | Side of the trigger the popover opened on (React Aria). |
| `data-trigger`                    | state     | `Select`                                   | What opened the popover (React Aria).                   |
| `data-entering`                   | state     | `true`                                     | Popover entry animation (React Aria).                   |
| `data-exiting`                    | state     | `true`                                     | Popover exit animation (React Aria).                    |
| `data-collection`                 | state     |                                            | React Aria's collection marker.                         |
| `data-key`                        | state     |                                            | A preset's key (React Aria).                            |
| `data-layout`                     | state     | `stack`                                    | Listbox layout (React Aria).                            |
| `data-orientation`                | state     | `vertical`                                 | Listbox orientation (React Aria).                       |
| `data-empty`                      | state     | `true`                                     | An empty list (React Aria).                             |
