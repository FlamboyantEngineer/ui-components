# Color Field

`ColorField` is a [field](FIELD.md) for a colour value, stored as lowercase `#rrggbb` text (`#rrggbbaa` with alpha, or text in a chosen `valueFormat`) or `null`. It takes the field's props (`FieldInputProps<string | null>`), so it has a label and layout, validation, dirty state and restore, undo and redo, and the field menu. Its control is a trigger showing a [Color Swatch](COLOR-SWATCH.md) and the colour text (or a swatch button and a text input to type a colour into), which opens a picker built on React Aria's `ColorPicker`: a format choice, a saturation and brightness `ColorArea`, hue and alpha `ColorSlider`s, a hex `ColorField` or one per colour channel, an eye dropper, preset swatches (a `ColorSwatchPicker`) and a Clear button.

## UIC-COLOR-FIELD-1 - Contract

### UIC-COLOR-FIELD-1.1 - Field control

`ColorField` shall render a `Field` around its trigger, built with `useFieldControl`, and take the field's props. Its root element is the field's root, which carries `ui-color-field` beside `ui-field`. A field given no value, committed value or default starts with no colour (`null`), and Clear returns to it.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/field/field-control.ts`
Verification: `src/components/color-field/color-field.test.tsx`

### UIC-COLOR-FIELD-1.2 - Trigger

The control shall be a React Aria button (`ui-color-field__trigger`) holding a small `ColorSwatch` of the value (`ui-color-field__swatch`) and the colour text (`ui-color-field__value`), written in `format`: `hex` (the default, in upper case: `#AABBCC`), `rgb`, `hsl` or `hsb`, or their alpha forms `hexa`, `rgba`, `hsla` and `hsba` (UIC-COLOR-FIELD-3.1), as React Aria writes them. With no colour the swatch is empty and the text is `placeholder` (the provider string `noColor` by default), with `data-placeholder` on the text. The trigger is named by the field label followed by the colour text and described by the field's parts. A read-only or disabled field's trigger is disabled.

Implementation: `src/components/color-field/color-field.tsx`, `labs/reference/color-field.css`
Verification: `src/components/color-field/color-field.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-1.3 - Picker

Pressing the trigger, or Enter or Space on it, shall open a popover (`ui-color-field__popover`, below the trigger's start edge) holding a dialog (`ui-color-field__dialog`) named by the field label, with focus moved into it: a saturation and brightness area (`ui-color-field__area`) and a hue slider (`ui-color-field__slider` with its `ui-color-field__track`), each with a thumb (`ui-color-field__thumb`) moved by pointer or arrow keys; the format's inputs (UIC-COLOR-FIELD-3.2), for the default `hex` format a hex input (`ui-color-field__hex` around `ui-color-field__input`) named by the provider string `hexColor`; and, unless the field is required, a Clear button (`ui-color-field__clear`, a `Button` named by the provider string `clear`), disabled while there is no colour. Escape or a press outside closes the picker and returns focus to the trigger. The area, track and thumbs carry React Aria's inline colour gradients and positions, values the picker draws rather than styles.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/color-field/color-field-panel.tsx`, `labs/reference/color-field.css`
Verification: `src/components/color-field/color-field.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-1.4 - Hooks and caller attributes

`ColorField` shall carry the hooks below on top of the field's, append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the trigger's id derives from it (`<id>-control`).

Implementation: `src/components/color-field/color-field.tsx`
Verification: `src/components/color-field/color-field.test.tsx`

## UIC-COLOR-FIELD-2 - Value

### UIC-COLOR-FIELD-2.1 - Picking and committing

Each change in the picker (the area, a slider, a committed input, a swatch or the eye dropper) shall set the value in its stored format (lowercase `#rrggbb` by default, UIC-COLOR-FIELD-3.4) through `onChange`, and the value commits when the picker closes, so `onCommit` hears the colour picked, not each step of a drag.

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

## UIC-COLOR-FIELD-3 - Formats and channels

### UIC-COLOR-FIELD-3.1 - Alpha

An alpha format (`hexa`, `rgba`, `hsla` or `hsba`) shall write the colour with its alpha (`#AABBCCFF`, `rgba(51, 102, 153, 0.5)`, to two decimals), add an alpha slider (`ui-color-field__slider` with `data-channel="alpha"`, after the hue slider, which carries `data-channel="hue"`) and an alpha input to the picker, and store the value as lowercase `#rrggbbaa` unless `valueFormat` says otherwise. The alpha slider's track carries React Aria's inline checkerboard and gradient.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/color-field/color-field-panel.tsx`, `src/components/color-field/color-values.ts`
Verification: `src/components/color-field/color-field-channels.test.tsx`, `src/components/color-field/color-values.test.ts`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-3.2 - Channel inputs

The picker's inputs (`ui-color-field__channels`) shall follow the format: a hex input for `hex` and `hexa`, and otherwise one number input per channel of the format's colour space (React Aria `ColorField` with `channel`, `ui-color-field__channel` around `ui-color-field__input`): Red, Green and Blue for `rgb`, Hue, Saturation and Lightness for `hsl`, Hue, Saturation and Brightness for `hsb`, each named by React Aria from its channel. An alpha format ends them with an Alpha input. The arrow keys step a channel, and a typed number sets it on Enter or when focus leaves.

Implementation: `src/components/color-field/color-field-channels.tsx`, `src/components/color-field/color-values.ts`
Verification: `src/components/color-field/color-field-channels.test.tsx`, `src/components/color-field/color-values.test.ts`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-3.3 - Format choice

With two or more `formats`, the picker shall start with a format choice (`ui-color-field__format`, a `SegmentedChoice` named by the provider string `colorFormat`) holding a segment per format, labelled with its name in upper case (`HEX`, `RGBA`). Picking a segment calls `onFormatChange` and, while the format is uncontrolled (starting at `defaultFormat`, `hex` by default), switches the trigger text and the picker's inputs to that format; a controlled `format` changes only when the caller passes a new one.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/color-field/color-field-channels.tsx`, `src/core/strings.ts`
Verification: `src/components/color-field/color-field-channels.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-3.4 - Stored format

`valueFormat` shall choose the text the value is stored as: a hex format in lower case (`#336699`, `#33669980`) and the other formats as React Aria writes them (`rgb(51, 102, 153)`). Without it the value is stored as `hex`, or `hexa` while the shown format has alpha. A stored value that is not `hex` is still read in any format React Aria parses.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/color-field/color-values.ts`
Verification: `src/components/color-field/color-field-channels.test.tsx`, `src/components/color-field/color-values.test.ts`

## UIC-COLOR-FIELD-4 - Presets, eye dropper and typing

### UIC-COLOR-FIELD-4.1 - Preset swatches

With `swatches`, the picker shall offer those colours as a [swatch picker](COLOR-SWATCH.md) (`ui-color-field__swatches`, also `ui-color-swatch-picker`) of small swatches, named by React Aria (`Color swatches`), whose swatch of the current colour is selected. Picking a swatch sets the value like any change in the picker and leaves the picker open.

Implementation: `src/components/color-field/color-field-panel.tsx`, `src/components/color-swatch/color-swatch-picker.tsx`
Verification: `src/components/color-field/color-field-panel.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-4.2 - Eye dropper

With `allowsEyeDropper`, where the browser has the EyeDropper API, the picker shall draw an eye dropper button (`ui-color-field__eye-dropper`, an `IconButton` with the `eye-dropper` glyph named by the provider string `pickScreenColor`). Pressing it opens the browser's eye dropper; a sampled colour sets the value like any change in the picker, and a dismissed one changes nothing. Where the browser has no eye dropper, no button is drawn.

Implementation: `src/components/color-field/color-field-eye-dropper.tsx`, `src/core/glyphs.tsx`, `src/core/strings.ts`
Verification: `src/components/color-field/color-field-eye-dropper.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-4.3 - Typing a colour

With `allowsTyping`, the control shall be a group (`ui-color-field__group`) of a trigger button holding only the swatch, named by the provider string `colorPicker` from the label (`Accent picker`), and a React Aria text field (`ui-color-field__entry` around `ui-color-field__input`) that carries the control's id, name, description and states and shows the colour text in the format, or nothing with `placeholder` as its hint. Enter, or focus leaving the input, commits the typed text: a colour in any form React Aria parses (hex with or without `#`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hsb()`, `hsba()`) sets the value in its stored format and commits it, empty text clears an optional value, and anything else is put back. Escape puts back the typed text; the field's undo and redo chords work from the input. A read-only or disabled field's input is read-only or disabled and its button disabled.

Implementation: `src/components/color-field/color-field-entry.tsx`, `src/components/color-field/color-field.tsx`, `src/core/strings.ts`
Verification: `src/components/color-field/color-field-entry.test.tsx`, `e2e/color-field.spec.ts`

## Hooks

| Hook                          | Kind  | Values                                                                                 | Description                                                                       |
| ----------------------------- | ----- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `ui-color-field`              | root  |                                                                                        | The field's root (also `ui-field`).                                               |
| `ui-color-field__trigger`     | slot  |                                                                                        | The button that opens the picker; with `allowsTyping`, holding only the swatch.   |
| `ui-color-field__group`       | slot  |                                                                                        | With `allowsTyping`: the swatch button and the text field.                        |
| `ui-color-field__entry`       | slot  |                                                                                        | With `allowsTyping`: the text field around the typed input.                       |
| `ui-color-field__swatch`      | slot  |                                                                                        | The swatch in the trigger (also `ui-color-swatch`).                               |
| `ui-color-field__value`       | slot  |                                                                                        | The colour text, or the placeholder.                                              |
| `ui-color-field__popover`     | slot  |                                                                                        | The picker popover.                                                               |
| `ui-color-field__dialog`      | slot  |                                                                                        | The dialog inside the popover.                                                    |
| `ui-color-field__area`        | slot  |                                                                                        | The saturation and brightness area.                                               |
| `ui-color-field__format`      | slot  |                                                                                        | The format choice (also `ui-segmented-choice`).                                   |
| `ui-color-field__slider`      | slot  |                                                                                        | The hue or alpha slider.                                                          |
| `ui-color-field__track`       | slot  |                                                                                        | A slider's track.                                                                 |
| `ui-color-field__thumb`       | slot  |                                                                                        | A thumb of the area or the slider.                                                |
| `ui-color-field__channels`    | slot  |                                                                                        | Holds the format's inputs.                                                        |
| `ui-color-field__hex`         | slot  |                                                                                        | The hex colour field around its input.                                            |
| `ui-color-field__channel`     | slot  |                                                                                        | A channel's number field around its input.                                        |
| `ui-color-field__input`       | slot  |                                                                                        | The hex, channel or typed input.                                                  |
| `ui-color-field__eye-dropper` | slot  |                                                                                        | The eye dropper button (also `ui-icon-button`).                                   |
| `ui-color-field__swatches`    | slot  |                                                                                        | The preset swatches (also `ui-color-swatch-picker`).                              |
| `ui-color-field__clear`       | slot  |                                                                                        | The Clear button (also `ui-button`).                                              |
| `data-placeholder`            | state | `true`                                                                                 | On the text: no colour is set, so it shows the placeholder.                       |
| `data-placement`              | state | `top`, `bottom`, `left`, `right`, `center`                                             | On the popover: the side it opened on (React Aria).                               |
| `data-trigger`                | state | `DialogTrigger`                                                                        | On the popover: what opened it (React Aria).                                      |
| `data-entering`               | state | `true`                                                                                 | On the popover: opening (React Aria).                                             |
| `data-exiting`                | state | `true`                                                                                 | On the popover: closing (React Aria).                                             |
| `data-orientation`            | state | `horizontal`, `vertical`                                                               | On the slider and its track (React Aria).                                         |
| `data-dragging`               | state | `true`                                                                                 | On a thumb and the track: being dragged (React Aria).                             |
| `data-hovered`                | state | `true`                                                                                 | On the trigger, a thumb, the track and the input (React Aria).                    |
| `data-pressed`                | state | `true`                                                                                 | On the trigger: being pressed (React Aria).                                       |
| `data-focused`                | state | `true`                                                                                 | On the trigger, a thumb, the track and the input (React Aria).                    |
| `data-focus-visible`          | state | `true`                                                                                 | On the trigger, a thumb, the track and the input (React Aria).                    |
| `data-disabled`               | state | `true`                                                                                 | On the trigger and the picker parts: disabled (React Aria).                       |
| `data-channel`                | state | `hex`, `red`, `green`, `blue`, `hue`, `saturation`, `lightness`, `brightness`, `alpha` | On the hex and channel fields (React Aria) and the sliders: the channel it edits. |
| `data-invalid`                | state | `true`                                                                                 | On the hex field and its input: invalid text (React Aria).                        |
| `data-readonly`               | state | `true`                                                                                 | On the hex field: read-only (React Aria).                                         |
| `data-required`               | state | `true`                                                                                 | On the hex field: required (React Aria).                                          |
