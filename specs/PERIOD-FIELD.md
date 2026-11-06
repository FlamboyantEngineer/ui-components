# Period Field

`PeriodField` chooses a calendar month or a year, for a value that is a period rather than a day or an instant: a billing month, a fiscal year, a report's period. Its value is text in a fixed form (`YYYY-MM` or `YYYY`), so it carries no day, time or time zone; the trigger shows the period in the locale and opens a grid of twelve periods.

## UIC-PERIOD-FIELD-1 - Contract

### UIC-PERIOD-FIELD-1.1 - Value

`PeriodField` shall be a field (UIC-FIELD) whose value is a period in its `granularity`'s form or `null`: `YYYY-MM` for `month` (the default) and `YYYY` for `year`, years 1 to 9999. `value`, `defaultValue`, `committedValue`, `onChange`, `onCommit` and `validate` read and write that text; Clear, Reset, undo and the field menu follow the field (UIC-FIELD-2), and `name` submits the text with a form (with `form`, UIC-FIELD-8.5). The control is a button (`ui-period-field__trigger`) named by the label and the period, showing the period's full name in the locale (`March 2026`, `2026`) in its value element (`ui-period-field__value`), or `placeholder` (by default the provider's `selectPlaceholder`) with `data-placeholder` while it has none. Delete or Backspace on the trigger clears a clearable value. A value the field cannot read shows as itself and is invalid with the provider's `dateUnreadable` message (`badInput`). The root carries `ui-period-field` beside `ui-field` and publishes `data-granularity`.

Implementation: `src/components/period-field/period-field.tsx`, `src/components/period-field/period-values.ts`
Verification: `src/components/period-field/period-field.test.tsx`, `src/components/period-field/period-values.test.ts`, `e2e/period-field.spec.ts`

### UIC-PERIOD-FIELD-1.2 - Grid

Pressing the trigger shall open a dialog (`ui-period-field__dialog`) in a popover (`ui-period-field__popover`) on the `dropdown` layer, below the trigger. It holds a header (`ui-period-field__picker-header`) with Previous and Next page buttons (`ui-period-field__picker-nav`, named by the provider's `previous` and `next`, their chevrons mirrored right to left) around the page's heading (`ui-period-field__picker-heading`, announced politely), and the page's twelve periods as a grid listbox (`ui-period-field__grid`, publishing `data-granularity`) named by the heading. A month page is a year's January to December, headed by the year; a year page is twelve years from a multiple of twelve, headed by its first and last years. Each period (`ui-period-field__period`) shows its short name (`Mar`, `2026`) and is named by its full one. The page opens on the chosen period's, else the current period's by the provider's clock (UIC-PROVIDER-8), else the bounds'. Focus starts on the chosen period, else the first; the arrow keys move across and down the grid (mirrored right to left), Home and End reach the ends, and Enter, Space or a press picks the period, commits it, closes the popover and returns focus to the trigger. Escape closes it without a change. A read-only field opens the grid but picks nothing.

Implementation: `src/components/period-field/period-picker.tsx`, `src/components/period-field/period-field.tsx`
Verification: `src/components/period-field/period-field.test.tsx`, `e2e/period-field.spec.ts`

### UIC-PERIOD-FIELD-1.3 - Bounds

`minValue` and `maxValue`, in the value's form, shall bound the periods offered: periods beyond them are disabled in the grid, and the Previous or Next button is disabled once its page would hold none within them. A value beyond them is invalid with the provider's `dateTooEarly` or `dateTooLate` message naming the bound in the locale (`rangeUnderflow`, `rangeOverflow`).

Implementation: `src/components/period-field/period-field.tsx`, `src/components/period-field/period-picker.tsx`
Verification: `src/components/period-field/period-field.test.tsx`

## Hooks

| Hook                              | Kind      | Values          | Description                                                  |
| --------------------------------- | --------- | --------------- | ------------------------------------------------------------ |
| `ui-period-field`                 | root      |                 | The field's root, beside `ui-field`.                         |
| `ui-period-field__trigger`        | slot      |                 | The button that shows the period and opens the grid.         |
| `ui-period-field__value`          | slot      |                 | The period's name, or the placeholder.                       |
| `ui-period-field__popover`        | slot      |                 | The popover around the grid.                                 |
| `ui-period-field__dialog`         | slot      |                 | The dialog inside the popover.                               |
| `ui-period-field__picker`         | slot      |                 | The header and the grid.                                     |
| `ui-period-field__picker-header`  | slot      |                 | The page buttons and the heading.                            |
| `ui-period-field__picker-nav`     | slot      |                 | A Previous or Next page button, beside `ui-button`.          |
| `ui-period-field__picker-heading` | slot      |                 | The page's year, or its first and last years.                |
| `ui-period-field__grid`           | slot      |                 | The page's twelve periods, a grid listbox.                   |
| `ui-period-field__period`         | slot      |                 | One period of the grid.                                      |
| `data-granularity`                | attribute | `month`, `year` | On the root and the grid: months or years.                   |
| `data-placeholder`                | state     | `true`          | On the value: no period is chosen.                           |
| `data-layer`                      | attribute | `dropdown`      | On the popover: its overlay layer.                           |
| `data-layout`                     | attribute | `grid`          | On the grid: its layout (React Aria).                        |
| `data-orientation`                | attribute | `vertical`      | On the grid: its orientation (React Aria).                   |
| `data-selected`                   | state     | `true`          | On a period: chosen (React Aria).                            |
| `data-disabled`                   | state     | `true`          | On a period: beyond the bounds (React Aria).                 |
| `data-hovered`                    | state     | `true`          | On a period or the trigger: under the pointer (React Aria).  |
| `data-pressed`                    | state     | `true`          | On a period or the trigger: being pressed (React Aria).      |
| `data-focused`                    | state     | `true`          | On a period or the trigger: has focus (React Aria).          |
| `data-focus-visible`              | state     | `true`          | On a period or the trigger: has keyboard focus (React Aria). |
