# Color Field

`ColorField` is a [field](FIELD.md) for a colour value, stored as lowercase `#rrggbb` text (`#rrggbbaa` with alpha, or text in a chosen `valueFormat`) or `null`. It takes the field's props (`FieldInputProps<string | null>`), so it has a label and layout, validation, dirty state and restore, undo and redo, and the field menu. Its control is a trigger showing a [Color Swatch](COLOR-SWATCH.md) and the colour text (or a swatch button and a text input to type a colour into), which opens a picker built on React Aria's `ColorPicker`: a format choice, a saturation and brightness `ColorArea`, a hue `ColorSlider` (and, with `allowsTransparency`, an alpha one), a hex `ColorField` or one per colour channel, an eye dropper, preset swatches (a `ColorSwatchPicker`) and a Clear button.

## UIC-COLOR-FIELD-1 - Contract

### UIC-COLOR-FIELD-1.1 - Field control

`ColorField` shall render a `Field` around its trigger, built with `useFieldControl`, and take the field's props. Its root element is the field's root, which carries `ui-color-field` beside `ui-field`. A field given no value, committed value or default starts with no colour (`null`), and Clear returns to it.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/field/field-control.ts`
Verification: `src/components/color-field/color-field.test.tsx`

### UIC-COLOR-FIELD-1.2 - Trigger

The control shall be a React Aria button (`ui-color-field__trigger`) holding a small `ColorSwatch` of the value (`ui-color-field__swatch`, which the reference sheet sizes from the field's height so it keeps the same inset from the frame at every `size`, picked or typed) and the colour text (`ui-color-field__value`), written in `format`: `hex` (the default, in upper case: `#AABBCC`), `rgb`, `hsl` or `hsb`, or their alpha forms `hexa`, `rgba`, `hsla` and `hsba` (UIC-COLOR-FIELD-3.1), as CSS colour text (`rgb(51, 102, 153)`, `hsl(210, 50%, 40%)`, `hsb(210, 66.67%, 60%)`). With no colour the swatch is empty and the text is `placeholder` (the provider string `noColor` by default), with `data-placeholder` on the text. The trigger is named by the field label followed by the colour text and described by the field's parts. A disabled field's trigger is disabled; a read-only field's trigger stays focusable, so its colour can be reached and read, but opens no picker and ignores the clearing keys.

Implementation: `src/components/color-field/color-field.tsx`, `labs/reference/color-field.css`
Verification: `src/components/color-field/color-field.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-1.3 - Picker

Pressing the trigger, or Enter or Space on it, shall open a popover (`ui-color-field__popover`, below the trigger's start edge when space allows, flipping above when needed, on the `dropdown` overlay layer with `data-layer="dropdown"` and the z-index of `useLayerZIndex('dropdown')`, [UIC-PORTAL-2.2](PORTAL.md#uic-portal-22---stacking)) holding a dialog (`ui-color-field__dialog`) named by the field label, with focus moved into it: a saturation and brightness area (`ui-color-field__area`) and a hue slider (`ui-color-field__slider` with its `ui-color-field__track`), each with a thumb (`ui-color-field__thumb`) moved by pointer or arrow keys; the format's inputs (UIC-COLOR-FIELD-3.2), for the default `hex` format a hex input (`ui-color-field__hex` around `ui-color-field__input`) named by the provider string `hexColor`; and, unless the field is required, a Clear button (`ui-color-field__clear`, a `Button` named by the provider string `clear`), disabled while there is no colour. In the reference sheet, Clear and the screen picker share a compact footer after the presets, in that keyboard order, with no empty rows between the content and footer. Escape or a press outside closes the picker and returns focus to the trigger. Locking the field (read-only or disabled) closes an open picker, and unlocking it does not reopen it. The area, track and thumbs carry React Aria's inline colour gradients and positions, values the picker draws rather than styles.

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

### UIC-COLOR-FIELD-2.4 - Form value

With `name`, the field shall render a hidden input of that name holding the value in its stored format (empty while there is no colour), so a form submits the colour as a native colour input does; a disabled field submits nothing. A non-empty value that is no colour, such as one loaded from elsewhere, shows no colour and is invalid with the provider's `colorUnreadable` string, so a form does not submit it; a readable value clears the issue.

Implementation: `src/components/color-field/color-field.tsx`
Verification: `src/components/color-field/color-field.test.tsx`, `e2e/color-field.spec.ts`

## UIC-COLOR-FIELD-3 - Formats and channels

### UIC-COLOR-FIELD-3.1 - Alpha

The picker shall offer opacity, an alpha slider (`ui-color-field__slider` with `data-channel="alpha"`, after the hue slider, which carries `data-channel="hue"`) and an Alpha input, whenever the colour it shows has alpha: always with `allowsTransparency`, and otherwise while the colour is translucent (`#33669980`, `rgba()`, `hsla()`, `hsba()`), whether stored, set from outside, typed into the closed field or reached in the picker. Once offered, opacity stays until the picker closes on an opaque colour, so the alpha can go anywhere from 0 to 1, opaque included, without the slider or input going away or losing focus. `allowsTransparency` is the explicit way to offer opacity for an opaque colour, and writes and stores the colour with its alpha in every format (`#AABBCCFF` with its exact alpha byte, `rgba(51, 102, 153, 0.5)` with alpha to two decimals, stored as lowercase `#rrggbbaa` unless `valueFormat` says otherwise). Without it a translucent colour is written and stored with its alpha (`#33669980`, `rgba(51, 102, 153, 0.5)`) and an opaque one without (`#336699`). The alpha slider's track carries React Aria's inline gradient, and the reference sheet draws a checkerboard under it on the slider, so transparency shows against it. While the picker offers no opacity it edits the colour alone: its area, sliders, inputs, preset swatches and eye dropper never change the alpha. The hex input never changes the alpha either, as its six digits hold none, whether or not opacity is offered. A translucent value keeps its exact alpha through every pick, format switch, commit, submission and reopening, so no alpha is silently dropped. Typing a translucent colour into the closed field (UIC-COLOR-FIELD-4.3) stores it with its alpha. The formats are `hex`, `rgb`, `hsl` and `hsb`; alpha follows from the colour and `allowsTransparency`, not from the format.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/color-field/color-field-panel.tsx`, `src/components/color-field/color-values.ts`
Verification: `src/components/color-field/color-field-channels.test.tsx`, `src/components/color-field/color-values.test.ts`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-3.2 - Channel inputs

The picker's inputs (`ui-color-field__channels`) shall follow the format: a hex input for `hex`, and otherwise one number input per channel of the format's colour space (React Aria `ColorField` with `channel`, `ui-color-field__channel` around `ui-color-field__input`): Red, Green and Blue for `rgb`, Hue, Saturation and Lightness for `hsl`, Hue, Saturation and Brightness for `hsb`. While the picker offers opacity (UIC-COLOR-FIELD-3.1) an Alpha input ends them. Each channel input has a visible label (`ui-color-field__channel-label`, a React Aria `Label`), the first letter of its name in the locale (R, G and B; H, S and L or B; A), above the input. The hex input has the visible label `#` only beside the Alpha input, so the two stay aligned; without opacity it has no label row and is named by `aria-label`. The label also holds the whole name (`Hex color` from the provider string `hexColor`, or the channel's name from React Aria, such as `Red`) as hidden text, so the input is named by the whole name, which starts with the visible letter; the hex input is named `Hex color` either way, and its text keeps its `#`. The arrow keys step a channel, and a typed number sets it on Enter or when focus leaves. The vertical wheel over a channel's field, focused or not, steps that channel alone by its step (1 for red, green, blue, hue, saturation, lightness and brightness, 0.01 for alpha) within its range: one step for each wheel notch, up to raise and down to lower, a trackpad's smaller deltas adding up to a step. The picker's colour, the other inputs, the area, the sliders and the trigger's swatch follow, alpha is kept, and the page does not scroll while the wheel is over the field. A zoom gesture (the wheel with Ctrl or Meta) and a mostly horizontal wheel stay the browser's, and the hex input takes no wheel. The picker opens only while the field is editable, so a read-only or disabled field offers neither the inputs nor the wheel.

Implementation: `src/components/color-field/color-field-channels.tsx`, `src/components/color-field/color-values.ts`, `src/utils/use-wheel-steps.ts`
Verification: `src/components/color-field/color-field-channels.test.tsx`, `src/components/color-field/color-values.test.ts`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-3.3 - Format choice

With two or more `formats`, the picker shall start with a format choice (`ui-color-field__format`, a `SegmentedChoice` named by the provider string `colorFormat`) holding a segment per format, labelled with its name in upper case (`HEX`, `RGB`). Switching the format keeps the colour and its alpha. Picking a segment calls `onFormatChange` and, while the format is uncontrolled (starting at `defaultFormat`, `hex` by default), switches the trigger text and the picker's inputs to that format; a controlled `format` changes only when the caller passes a new one.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/color-field/color-field-channels.tsx`, `src/core/strings.ts`
Verification: `src/components/color-field/color-field-channels.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-3.4 - Stored format

`valueFormat` shall choose the text the value is stored as: `hex` in lower case (`#336699`, `#33669980`) and the other formats as CSS colour text (`rgb(51, 102, 153)`, `hsla(210, 50%, 40%, 0.5)`), with alpha as UIC-COLOR-FIELD-3.1 writes it. Without it the value is stored as `hex`. A stored value that is not `hex` is still read in any of the formats, with or without alpha, and hex digits may omit the `#`.

Implementation: `src/components/color-field/color-field.tsx`, `src/components/color-field/color-values.ts`
Verification: `src/components/color-field/color-field-channels.test.tsx`, `src/components/color-field/color-values.test.ts`

## UIC-COLOR-FIELD-4 - Presets, eye dropper and typing

### UIC-COLOR-FIELD-4.1 - Preset swatches

With `swatches`, the picker shall offer those colours as a [swatch picker](COLOR-SWATCH.md) (`ui-color-field__swatches`, also `ui-color-swatch-picker`) of small swatches, named by React Aria (`Color swatches`), whose swatch of the current colour is selected. Picking a swatch sets the value like any change in the picker and leaves the picker open. A colour listed twice is two separate swatches, each pickable.

Implementation: `src/components/color-field/color-field-panel.tsx`, `src/components/color-swatch/color-swatch-picker.tsx`
Verification: `src/components/color-field/color-field-panel.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-4.2 - Eye dropper

With `allowsEyeDropper`, where the browser has the EyeDropper API, the picker shall draw an eye dropper button (`ui-color-field__eye-dropper`, a `Button` with the `eye-dropper` glyph named by the provider string `pickScreenColor`). Pressing it opens the browser's eye dropper; a sampled colour sets the value like any change in the picker, and a dismissed one changes nothing. A sample belongs to the open picker: pressing the button again, closing the picker (which a read-only or disabled field also does) or unmounting the field aborts it through the API's `signal`, and a colour it returns anyway changes nothing, also after the picker reopens. Where the browser has no eye dropper, no button is drawn.

Implementation: `src/components/color-field/color-field-eye-dropper.tsx`, `src/core/glyphs.tsx`, `src/core/strings.ts`
Verification: `src/components/color-field/color-field-eye-dropper.test.tsx`, `src/components/color-field/color-field-eye-dropper-lifetime.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-4.3 - Typing a colour

With `allowsTyping`, the control shall be a group (`ui-color-field__group`) of a trigger button holding only the swatch, named by the provider string `colorPicker` from the label (`Accent picker`), and a React Aria text field (`ui-color-field__entry` around `ui-color-field__input`) that carries the control's id, description and states (the form value is the hidden input of UIC-COLOR-FIELD-2.4, so a form holds the colour once) and shows the colour text in the format, or nothing with `placeholder` as its hint. The input takes the field's `autoComplete`, `inputMode`, `spellCheck` and `enterKeyHint` (UIC-FIELD-8.3). Typed text applies as it is typed: a colour in any CSS form (hex with or without `#`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hsb()`, `hsba()`) sets the value in its stored format at once, so the form value, `onChange` and a submit started while the input has focus all hold the colour on screen, and empty text clears an optional value. Other text leaves the value as it is. Enter, or focus leaving the input, ends the typing: the input then shows the value in its format, and text that is no colour (or empty text in a required field) puts back the value the typing started from. Enter also commits; otherwise the field commits once focus leaves it (UIC-FIELD-1.11), so moving to the swatch button or Tab to the restore button commits nothing. A value replaced from outside while text is typed (a controlled owner's new value, or one that refuses the typed colour) retires the typed text, and the input shows the new value. Escape puts back the value the typing started from and its text; Enter and Escape that an input method composition owns (pressed during it, or the Enter that confirms a candidate, reported with key code 229) are left to the input method and neither apply nor put back the text. A native form reset that a listener cancels (UIC-FIELD-2.6) keeps the typed text and the value it set; one that goes through drops the text and shows the initial value. The field's undo and redo chords work from the input. A read-only or disabled field's input is read-only or disabled and its button disabled.

Implementation: `src/components/color-field/color-field-entry.tsx`, `src/components/color-field/color-field.tsx`, `src/core/strings.ts`
Verification: `src/components/color-field/color-field-entry.test.tsx`, `e2e/color-field.spec.ts`

### UIC-COLOR-FIELD-4.4 - Unreadable drafts

While the typed text of UIC-COLOR-FIELD-4.3 is no colour, the field shall report a draft issue (UIC-FIELD-3.11) with the provider's `colorUnreadable` string, and while it is empty in a required field, the `valueRequired` string; the issue ends when the text is corrected, applied or put back.

Implementation: `src/components/color-field/color-field-entry.tsx`
Verification: `src/components/form/form-validity.test.tsx`, `e2e/form.spec.ts`

## Hooks

| Hook                            | Kind      | Values                                                                                 | Description                                                                       |
| ------------------------------- | --------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `ui-color-field`                | root      |                                                                                        | The field's root (also `ui-field`).                                               |
| `ui-color-field__trigger`       | slot      |                                                                                        | The button that opens the picker; with `allowsTyping`, holding only the swatch.   |
| `ui-color-field__group`         | slot      |                                                                                        | With `allowsTyping`: the swatch button and the text field.                        |
| `ui-color-field__entry`         | slot      |                                                                                        | With `allowsTyping`: the text field around the typed input.                       |
| `ui-color-field__swatch`        | slot      |                                                                                        | The swatch in the trigger (also `ui-color-swatch`).                               |
| `ui-color-field__value`         | slot      |                                                                                        | The colour text, or the placeholder.                                              |
| `ui-color-field__popover`       | slot      |                                                                                        | The picker popover.                                                               |
| `ui-color-field__dialog`        | slot      |                                                                                        | The dialog inside the popover.                                                    |
| `ui-color-field__area`          | slot      |                                                                                        | The saturation and brightness area.                                               |
| `ui-color-field__format`        | slot      |                                                                                        | The format choice (also `ui-segmented-choice`).                                   |
| `ui-color-field__slider`        | slot      |                                                                                        | The hue or alpha slider.                                                          |
| `ui-color-field__track`         | slot      |                                                                                        | A slider's track.                                                                 |
| `ui-color-field__thumb`         | slot      |                                                                                        | A thumb of the area or the slider.                                                |
| `ui-color-field__channels`      | slot      |                                                                                        | Holds the format's inputs.                                                        |
| `ui-color-field__hex`           | slot      |                                                                                        | The hex colour field around its input.                                            |
| `ui-color-field__channel`       | slot      |                                                                                        | A channel's number field around its input.                                        |
| `ui-color-field__channel-label` | slot      |                                                                                        | The visible label above a channel input, its initial, or `#` above the hex input. |
| `ui-color-field__input`         | slot      |                                                                                        | The hex, channel or typed input.                                                  |
| `ui-color-field__eye-dropper`   | slot      |                                                                                        | The eye dropper button (also `ui-button`).                                        |
| `ui-color-field__swatches`      | slot      |                                                                                        | The preset swatches (also `ui-color-swatch-picker`).                              |
| `ui-color-field__clear`         | slot      |                                                                                        | The Clear button (also `ui-button`).                                              |
| `data-placeholder`              | state     | `true`                                                                                 | On the text: no colour is set, so it shows the placeholder.                       |
| `data-layer`                    | attribute | `dropdown`                                                                             | On the popover: its overlay layer; the z-index is set inline from it.             |
| `data-placement`                | state     | `top`, `bottom`, `left`, `right`, `center`                                             | On the popover: the side it opened on (React Aria).                               |
| `data-trigger`                  | state     | `DialogTrigger`                                                                        | On the popover: what opened it (React Aria).                                      |
| `data-entering`                 | state     | `true`                                                                                 | On the popover: opening (React Aria).                                             |
| `data-exiting`                  | state     | `true`                                                                                 | On the popover: closing (React Aria).                                             |
| `data-orientation`              | state     | `horizontal`, `vertical`                                                               | On the slider and its track (React Aria).                                         |
| `data-dragging`                 | state     | `true`                                                                                 | On a thumb and the track: being dragged (React Aria).                             |
| `data-hovered`                  | state     | `true`                                                                                 | On the trigger, a thumb, the track and the input (React Aria).                    |
| `data-pressed`                  | state     | `true`                                                                                 | On the trigger: being pressed (React Aria).                                       |
| `data-focused`                  | state     | `true`                                                                                 | On the trigger, a thumb, the track and the input (React Aria).                    |
| `data-focus-visible`            | state     | `true`                                                                                 | On the trigger, a thumb, the track and the input (React Aria).                    |
| `data-disabled`                 | state     | `true`                                                                                 | On the trigger and the picker parts: disabled (React Aria).                       |
| `data-channel`                  | state     | `hex`, `red`, `green`, `blue`, `hue`, `saturation`, `lightness`, `brightness`, `alpha` | On the hex and channel fields (React Aria) and the sliders: the channel it edits. |
| `data-invalid`                  | state     | `true`                                                                                 | On the hex field and its input: invalid text (React Aria).                        |
| `data-readonly`                 | state     | `true`                                                                                 | On the hex field: read-only (React Aria).                                         |
| `data-required`                 | state     | `true`                                                                                 | On the hex field: required (React Aria).                                          |
