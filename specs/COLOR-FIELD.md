# Color Field

`ColorField` is a [field](FIELD.md) for a colour value, stored as lowercase `#rrggbb` text or `null`. It takes the field's props (`FieldInputProps<string | null>`), so it has a label and layout, validation, dirty state and restore, undo and redo, and the field menu. Its control is a trigger showing a [Color Swatch](COLOR-SWATCH.md) and the colour text, which opens a picker built on React Aria's `ColorPicker`: a saturation and brightness `ColorArea`, a hue `ColorSlider`, a hex `ColorField` and a Clear button.

## UIC-COLOR-FIELD-1 - Contract

### UIC-COLOR-FIELD-1.1 - Field control

`ColorField` shall render a `Field` around its trigger, built with `useFieldControl`, and take the field's props. Its root element is the field's root, which carries `ui-color-field` beside `ui-field`. A field given no value, committed value or default starts with no colour (`null`), and Clear returns to it.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/field/field-control.ts`
Verification: `src/components/color-field/color-field.test.tsx`

### UIC-COLOR-FIELD-1.2 - Trigger

The control shall be a React Aria button (`ui-color-field__trigger`) holding a small `ColorSwatch` of the value (`ui-color-field__swatch`) and the colour text (`ui-color-field__value`), written in `format`: `hex` (the default, in upper case: `#AABBCC`), `rgb`, `hsl` or `hsb`, as React Aria writes them. With no colour the swatch is empty and the text is `placeholder` (the provider string `noColor` by default), with `data-placeholder` on the text. The trigger is named by the field label followed by the colour text and described by the field's parts. A read-only or disabled field's trigger is disabled.

Implementation: `src/components/color-field/color-field.tsx`, `labs/reference/color-field.css`
Verification: `src/components/color-field/color-field.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-1.3 - Picker

Pressing the trigger, or Enter or Space on it, shall open a popover (`ui-color-field__popover`, below the trigger's start edge) holding a dialog (`ui-color-field__dialog`) named by the field label, with focus moved into it: a saturation and brightness area (`ui-color-field__area`) and a hue slider (`ui-color-field__slider` with its `ui-color-field__track`), each with a thumb (`ui-color-field__thumb`) moved by pointer or arrow keys; a hex input (`ui-color-field__hex` around `ui-color-field__input`) named by the provider string `hexColor`; and, unless the field is required, a Clear button (`ui-color-field__clear`, a `Button` named by the provider string `clear`), disabled while there is no colour. Escape or a press outside closes the picker and returns focus to the trigger. The area, track and thumbs carry React Aria's inline colour gradients and positions, values the picker draws rather than styles.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/color-field/color-field-panel.tsx`, `labs/reference/color-field.css`
Verification: `src/components/color-field/color-field.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-1.4 - Hooks and caller attributes

`ColorField` shall carry the hooks below on top of the field's, append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the trigger's id derives from it (`<id>-control`).

Implementation: `src/components/color-field/color-field.tsx`
Verification: `src/components/color-field/color-field.test.tsx`

## UIC-COLOR-FIELD-2 - Value

### UIC-COLOR-FIELD-2.1 - Picking and committing

Each change in the picker (the area, the slider or a committed hex input) shall set the value as lowercase `#rrggbb` through `onChange`, and the value commits when the picker closes, so `onCommit` hears the colour picked, not each step of a drag.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/color-field/color-field-panel.tsx`
Verification: `src/components/color-field/color-field.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-2.2 - Clearing

The picker's Clear button, which then closes the picker and returns focus to the trigger, and Backspace or Delete on the focused trigger shall clear an optional value to `null` and commit it. A required field has no Clear button and ignores those keys; every other key on the trigger goes on to the field, for its undo and redo chords.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/color-field/color-field-panel.tsx`
Verification: `src/components/color-field/color-field.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-2.3 - Field behaviour

`ColorField` shall show each validation status, show dirty state with a restore button, undo and redo with the field's chords from its trigger, and offer the field menu, whose Clear removes the colour and Set to default puts the default back.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/field/field.tsx`
Verification: `src/components/color-field/color-field.test.tsx`, `e2e/color-field.spec.ts`

## Hooks

| Hook                      | Kind  | Values                                     | Description                                                    |
| ------------------------- | ----- | ------------------------------------------ | -------------------------------------------------------------- |
| `ui-color-field`          | root  |                                            | The field's root (also `ui-field`).                            |
| `ui-color-field__trigger` | slot  |                                            | The button that opens the picker.                              |
| `ui-color-field__swatch`  | slot  |                                            | The swatch in the trigger (also `ui-color-swatch`).            |
| `ui-color-field__value`   | slot  |                                            | The colour text, or the placeholder.                           |
| `ui-color-field__popover` | slot  |                                            | The picker popover.                                            |
| `ui-color-field__dialog`  | slot  |                                            | The dialog inside the popover.                                 |
| `ui-color-field__area`    | slot  |                                            | The saturation and brightness area.                            |
| `ui-color-field__slider`  | slot  |                                            | The hue slider.                                                |
| `ui-color-field__track`   | slot  |                                            | The hue slider's track.                                        |
| `ui-color-field__thumb`   | slot  |                                            | A thumb of the area or the slider.                             |
| `ui-color-field__hex`     | slot  |                                            | The hex colour field around its input.                         |
| `ui-color-field__input`   | slot  |                                            | The hex input.                                                 |
| `ui-color-field__clear`   | slot  |                                            | The Clear button (also `ui-button`).                           |
| `data-placeholder`        | state | `true`                                     | On the text: no colour is set, so it shows the placeholder.    |
| `data-placement`          | state | `top`, `bottom`, `left`, `right`, `center` | On the popover: the side it opened on (React Aria).            |
| `data-trigger`            | state | `DialogTrigger`                            | On the popover: what opened it (React Aria).                   |
| `data-entering`           | state | `true`                                     | On the popover: opening (React Aria).                          |
| `data-exiting`            | state | `true`                                     | On the popover: closing (React Aria).                          |
| `data-orientation`        | state | `horizontal`, `vertical`                   | On the slider and its track (React Aria).                      |
| `data-dragging`           | state | `true`                                     | On a thumb and the track: being dragged (React Aria).          |
| `data-hovered`            | state | `true`                                     | On the trigger, a thumb, the track and the input (React Aria). |
| `data-pressed`            | state | `true`                                     | On the trigger: being pressed (React Aria).                    |
| `data-focused`            | state | `true`                                     | On the trigger, a thumb, the track and the input (React Aria). |
| `data-focus-visible`      | state | `true`                                     | On the trigger, a thumb, the track and the input (React Aria). |
| `data-disabled`           | state | `true`                                     | On the trigger and the picker parts: disabled (React Aria).    |
| `data-channel`            | state | `hex`                                      | On the hex field: the channel it edits (React Aria).           |
| `data-invalid`            | state | `true`                                     | On the hex field and its input: invalid text (React Aria).     |
| `data-readonly`           | state | `true`                                     | On the hex field: read-only (React Aria).                      |
| `data-required`           | state | `true`                                     | On the hex field: required (React Aria).                       |
