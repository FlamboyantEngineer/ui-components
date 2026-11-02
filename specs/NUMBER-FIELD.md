# Number Field

`NumberField` is a [field](FIELD.md) for a number, built on React Aria's `NumberField`. It parses and formats the number for the locale with `Intl.NumberFormat` options (decimals, grouping, currency, percent, units), steps it with buttons and the arrow keys, and reports a value outside its range or off its step. It takes the field's props (`FieldInputProps<number | null>`): an empty field holds `null`, never zero. What a number means (units, currencies, derived values) is the caller's: the field edits a plain number. Literal affixes sit inside its frame as adornments, Shift and Alt step by larger and smaller amounts, and a scrub handle steps the value by dragging. With `display="slider"` the number is picked along a track instead (UIC-NUMBER-FIELD-5), and with `range` the field holds a start and an end, typed into two inputs or picked with two thumbs (UIC-NUMBER-FIELD-8).

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-NUMBER-FIELD-1 - Contract

### UIC-NUMBER-FIELD-1.1 - Field control

`NumberField` shall render a `Field` around a number field element, built with `useFieldControl`, and take the field's props, its own range, step, format and commit props and `placeholder`. Its root element is the field's root, which carries `ui-number-field` beside `ui-field`. The value is a number or `null` while empty; a field given no value, committed value or default starts empty, and Clear empties it. A non-finite number (`NaN`, `Infinity` or `-Infinity`, given as `value`, `defaultValue` or `committedValue`) reads as no value in every radix: the input shows it empty, the field is empty (no `data-filled`; a required field reports the missing value and blocks), the range and step checks pass over it, and the form submits nothing for it. The field reports no change of its own for it.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/field/field-control.ts`
Verification: `src/components/number-field/number-field.test.tsx`

### UIC-NUMBER-FIELD-1.2 - Locale formatting and parsing

`NumberField` shall show its value formatted with `formatOptions` in the `UiProvider` locale ([PROVIDER.md](PROVIDER.md)), and parse typed and pasted text in that locale, so `1.234,5` is a number in German. It refuses characters that cannot belong to a number in that format; text that does not parse goes back to the formatted value on commit, and emptied text gives `null`. The control is a text input (`ui-number-field__input`) with a numeric input mode, never a native number input, and `placeholder` shows while it is empty.

Implementation: `src/components/number-field/number-field.tsx`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-1.3 - Steppers

`NumberField` shall draw a decrement and an increment button (`ui-number-field__decrement` with the `minus` glyph and `ui-number-field__increment` with the `plus` glyph) around the input, inside a group (`ui-number-field__group`). They are named from the field label (`Decrease <label>`, `Increase <label>`), stay out of the tab order, keep focus in the input when pressed with a pointer, and are disabled when the value cannot move further. Arrow Up and Arrow Down step the value from the keyboard, by `step` (1 by default). `hideStepper` leaves the buttons out and publishes `data-hide-stepper` on the root; the keys still step.

Implementation: `src/components/number-field/number-field.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-1.4 - Accessibility

The input shall be named by the field label, described by the field's description, decoration and message, and carry `aria-required` while required and `aria-invalid` with `aria-errormessage` while invalid. A read-only field keeps its value readable and refuses edits and steps; a disabled one is natively disabled.

Implementation: `src/components/number-field/number-field.tsx`
Verification: `src/components/number-field/number-field.test.tsx`

### UIC-NUMBER-FIELD-1.5 - Hooks and caller attributes

`NumberField` shall carry the hooks below on top of the field's, append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the input's id derives from it (`<id>-control`).

Implementation: `src/components/number-field/number-field.tsx`
Verification: `src/components/number-field/number-field.test.tsx`

## UIC-NUMBER-FIELD-2 - Value and validation

### UIC-NUMBER-FIELD-2.1 - Commit

`NumberField` shall keep the text being typed apart from its value: the text becomes the value, through `onChange`, when the input loses focus (Tab reads it just before focus moves), when Enter is pressed and on each step, and commits, through `onCommit`, on Enter, on each step and when focus leaves the field (UIC-FIELD-1.11), so Tab from typed text reaches the restore button. Intermediate text such as `-` or `1.` never becomes a value. A value set from outside the input (a controlled value, restore, undo or a menu action) replaces the text without being clamped or snapped during render, so the displayed number remains the value being validated. A snapping commit on blur or Enter also corrects an unchanged external value.

Implementation: `src/components/number-field/number-field.tsx`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-2.2 - Range and step

`minValue`, `maxValue` and `step` shall bound the value. `commitBehavior` (`NumberFieldCommitBehavior`) chooses what a commit does: by default (`snap`) a committed value is clamped into the range and snapped to the nearest step; a value already on the step grid, however large (up to the safe integers), stays exactly itself. With `commitBehavior="validate"` it is kept as typed, and the field reports a value below the minimum, above the maximum or off the step (counted from the minimum, or from zero) as an error with the provider strings `rangeUnderflow`, `rangeOverflow` and `stepMismatch`, given the bound formatted like the value. Any value outside the rules, a controlled one included, reports the same way, before the caller's `validate`. Snapping uses the minimum as its origin (zero without a minimum), keeps the result on a valid step at an off-step maximum, and preserves decimal and scientific-notation precision.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/number-field/snap-number-value.ts`, `src/core/strings.ts`
Verification: `src/components/number-field/number-field.test.tsx`, `src/components/number-field/snap-number-value.test.ts`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-2.3 - Field behaviour

`NumberField` shall show each validation status (invalid, warning and pending), show dirty state with a restore button, undo and redo with the field's chords, and offer the field menu, whose Clear empties the value and Set to default puts the default back.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/field/field.tsx`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

## UIC-NUMBER-FIELD-3 - Affixes and fast steps

### UIC-NUMBER-FIELD-3.1 - Literal affixes

`startAdornment` and `endAdornment` shall render the caller's content in `ui-number-field__start` and `ui-number-field__end`, inside the group, around the input and within the step buttons, so a literal the locale formats cannot produce (`$ 1,000 /mo`) frames the number without becoming part of its text. The locale's own formats (currency, units, grouping such as the `en-IN` lakh) stay `formatOptions`' and the locale's. Content that renders nothing (`null`, `undefined`, a boolean or an empty string) counts as absent; `0` counts as content. The content may hold controls, such as a `Button` that switches the unit: buttons and checkboxes there are free of the field's step-button slots, need no `slot` and take none of the steppers' props, in the decimal and the radix field alike. `endAdornmentPlacement` (`NumberFieldAdornmentPlacement`) places the end adornment: at the frame's trailing edge, before the increment button (`edge`, the default), or right after the number (`value`), as a unit that reads with it (`1,250 kg`). With `value` the root publishes `data-adornment-placement="value"` and the input sits in `ui-number-field__value` beside `ui-number-field__sizer`, a copy of the text the input shows (the typed text while editing, the placeholder while empty) hidden from assistive technology, so a stylesheet can make the input as wide as its text: the adornment then follows the number as it is typed, stepped or replaced, and the free room falls after it. The reference sheet stacks the input and the sizer in one grid cell, both in the input's type, so the sizer measures the text as drawn. The reference sheet draws an adornment's text in the number's font, size, weight, figures and colour, centred on the same line box as the input's text so the two share a baseline, in every size and state, with about a space (`0.25em`) between the number and a unit after it, so `50 mm` reads as one quantity; controls placed in an adornment keep their own type. The lab draws negative, decimal, long, read-only, disabled and German-formatted values with a unit after the number and at the edge, at `xs`, `sm`, `md` and `lg`. Units stay the caller's: the field names none.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/number-field/number-field-parts.tsx`, `src/utils/free-controls.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`, `e2e/number-field-displays.spec.ts`

### UIC-NUMBER-FIELD-3.2 - Modifier steps

With `largeStep`, Shift with Arrow Up or Arrow Down shall step the value by `largeStep`; with `smallStep`, Alt with the arrows steps it by `smallStep`. A modified step starts from the number the input shows, parsed in the locale as the plain arrows read it, even while that text is not yet committed; text that is empty or not yet a number steps as an empty value. Each step keeps the value within `minValue` and `maxValue`, rounds it to the precision of the value and the step, prevents the key's default and commits. Scientific notation retains its decimal precision; values finer than the platform's fixed-decimal limit retain their arithmetic result instead of throwing. An empty value steps up to the minimum and down to the maximum (zero without one), as the plain arrow keys do. A read-only or disabled field refuses the steps, and without the matching prop a modified arrow does nothing. A modified arrow that belongs to an input method composition (`isComposing`, or key code 229) is the input method's: it neither steps nor commits, and neither does Enter. The decrement and increment buttons follow the same rules: pressed with Shift or Alt, by pointer or by Enter or Space, a button steps once by `largeStep` or `smallStep` (Shift wins when both are held), from the number the input shows, and commits; React Aria's own step and press-and-hold repeat are left out of that press, so the step is never applied twice. Without the matching prop, or while read-only or disabled, a modified press does nothing; a plain press keeps stepping by `step`. This holds in every base.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/number-field/number-field-parts.tsx`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`

### UIC-NUMBER-FIELD-3.3 - Scrub handle

`showScrubber` shall draw a scrub handle (`ui-number-field__scrubber`, holding the `scrub` glyph, a double arrow pointing both ways along the line, hidden from assistive technology, which steps with the arrow keys) after the decrement button. The reference sheet makes it as wide as the frame is tall less its border, with an `ew-resize` cursor, and darkens it under the pointer. Pressing it with the primary pointer button and dragging sideways steps the value once every 4 pixels toward the end of the line (rightward in left-to-right text, leftward in right-to-left text) by `step`, or by `largeStep` with Shift and `smallStep` with Alt, within the range; the field's value follows the drag through `onChange` and commits once when the drag ends. The handle captures the pointer and opts out of touch panning (`touch-action: none`). A read-only or disabled field refuses the drag. Becoming read-only or disabled releases capture and abandons an active scrub without a commit; unlocking requires a new press. Only the pointer that pressed the handle moves or ends the scrub. A cancelled scrub (`pointercancel` or lost capture) puts back the value it started from, through `onChange`, and commits nothing. A value the host sets during the scrub, other than the one the scrub last set, wins: the scrub is abandoned without a further change or a commit. The vertical wheel over the handle steps the value too, one step a notch (up raises it, a trackpad's smaller deltas adding up to a step), by `step`, or by `largeStep` with Shift and `smallStep` with Alt, within the range, and commits each step as an arrow key does; steps that come faster than the field renders build on each other. The page does not scroll while the wheel is over the handle. A zoom gesture (the wheel with Ctrl or Meta) and a mostly sideways wheel stay the browser's, except a sideways wheel with Shift held, which some platforms report for Shift and a mouse wheel. A read-only or disabled field leaves the wheel to the page. In the reference sheet the step buttons and the handle scale with the frame, their glyphs take the icon size of the field's size (12 pixels at `xs` and `sm`, 14 at `md`, 16 at `lg`) and the adornments in the number's type (UIC-NUMBER-FIELD-3.1); the lab draws each display choice (step buttons, the handle alone, a unit at the edge, a unit after the number) at `xs`, `sm`, `md` and `lg`.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/number-field/number-field-parts.tsx`, `src/core/glyphs.tsx`, `src/utils/use-wheel-steps.ts`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-field.test.tsx`, `e2e/number-field.spec.ts`, `e2e/number-field-displays.spec.ts`

### UIC-NUMBER-FIELD-3.4 - Typed units

`units` (`NumberFieldUnits`) shall let a decimal field read quantities typed in other units and keep its value in its own: `unit` names the value's unit (`mm`), and `conversions` maps each other unit a reader may type to how many of `unit` one of it makes (`{ cm: 10, m: 1000, in: 25.4 }`); only such proportional conversions are read, so units with an offset (temperatures) are the caller's. The field names no units of its own. With `units` the field types into a text input with the spinbutton role (as in a nondecimal base, UIC-NUMBER-FIELD-4.1) and shows `unit` as its end adornment unless `endAdornment` is given, at the edge or after the number as `endAdornmentPlacement` says. Typed or pasted text reads as a number in the locale (its decimal sign, with or without its grouping, the minus sign or a hyphen, and an exponent), optionally followed by one of the units, with or without spaces between them (`5cm`, `5 cm`, `0,25 m` in French); a unit matches exactly, or else in any case, the longest first, and a number alone is in `unit`. When the typing ends (Enter, Tab, focus leaving the input) the quantity times its unit's conversion, rounded to 15 significant digits so `0.1 m` reads `100`, becomes the value, snapped or validated by `commitBehavior` and the range and step as any typed number, and the input shows it in `unit`, formatted by `formatOptions` (`5cm` becomes `50`, with `mm` after it); the value, `onChange`, `onCommit` and the form value are always the number in `unit`, and assistive technology reads the value with its unit (`50 mm`). Steps start from the typed quantity. Text that is not a number, or that ends in a unit the field does not read (`5 km`), never becomes the value: it stays in the input, the field reports the provider string `quantityUnreadable` with the units it reads in a locale list (`Enter a number in mm, cm, or m.`) as an error that blocks the form, and the value keeps what it was until the text is corrected or the value is replaced from outside (restore, undo, a controlled value), which also replaces the text. Empty text empties the value.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/number-field/unit-number.ts`, `src/components/number-field/number-codecs.ts`, `src/components/number-field/text-number-control.tsx`, `src/core/strings/field.ts`
Verification: `src/components/number-field/unit-number.test.ts`, `src/components/number-field/number-field-units.test.tsx`, `e2e/number-field-displays.spec.ts`

## UIC-NUMBER-FIELD-4 - Number bases

### UIC-NUMBER-FIELD-4.1 - Radix input

`radix` is 10 by default, or 2, 8 or 16. Decimal input retains locale formatting and fractional precision. Nondecimal input edits safe integers, accepts an optional matching prefix and either case, and displays 0b, 0o or 0x after the sign. A malformed entry or fraction restores the previous formatted value on commit. Empty input is null. Changing the base preserves the numeric value.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/number-field/text-number-control.tsx`, `src/components/number-field/radix-number.ts`
Verification: `src/components/number-field/radix-number.test.ts`, `src/components/number-field/number-radix.test.tsx`, `e2e/number-radix.spec.ts`

### UIC-NUMBER-FIELD-4.2 - Numeric behavior and units

Each base preserves numeric values, range and step behavior, modifier stepping, scrubbing, disabled/read-only state, validation, restore and field history. In every base the plain arrows and steppers step by `step` onto the step grid and stop at the last reachable step below `maxValue`, as in a decimal field; a modified arrow steps by its configured step and does nothing without one. The group publishes `data-focus-within` in every base, so the reference frame shows keyboard focus alike. Nondecimal spinbuttons report the numeric value and formatted value text to assistive technology and submit the decimal numeric value under `name`. External fractional or unsafe values remain visible and invalid. `startAdornment` and `endAdornment` combine units with every base; Intl format options apply to decimal input.

Implementation: `src/components/number-field/number-field.tsx`, `src/components/number-field/text-number-control.tsx`
Verification: `src/components/number-field/number-radix.test.tsx`, `e2e/number-radix.spec.ts`

## UIC-NUMBER-FIELD-5 - Slider display

### UIC-NUMBER-FIELD-5.1 - Field control

`display="slider"` shall draw the number as a slider: a `Field` around a slider group (`ui-number-field__slider`, role `group`) built on React Aria's `Slider`, `SliderTrack`, `SliderFill`, `SliderThumb` and `SliderOutput`, with `useFieldControl`. Its root is the field's root, which carries `ui-number-field` beside `ui-field` and publishes `data-display="slider"`. Its props are `NumberSliderFieldProps`: the field's props (`FieldInputProps<number>`) but `isRequired` and `emptyValue`, since a slider always holds a value and is never required or cleared, plus the range, step, format and the track props this section lists; the number input's own props (steppers, adornments, scrubber, units, radix) do not apply. The value is a number: a field given no value, committed value or default starts at the minimum. The colour sliders of a [Color Field](COLOR-FIELD.md) are a different control. While a thumb moves, by a drag or a key press, each new value goes through `onChange`; when the drag or key press ends the field commits (`onCommit`) and calls `onChangeEnd` with the value.

Implementation: `src/components/number-field/number-slider.tsx`, `src/components/number-field/number-slider-parts.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-5.2 - Range, step and format

`minValue` (0 by default), `maxValue` (100 by default) and `step` (1 by default) shall bound the value, which the slider keeps within the range and on the step. The field holds one normalized value, the one the thumbs, output, ARIA values and form inputs show, so validation, dirty state, restore and every callback see it too: a given `value`, `defaultValue` or `committedValue` is snapped to the nearest step from the minimum (rounded to the step's decimals, `0.1 + 0.2` reading `0.3`), clamped into the range (above the last step, the last step; `Infinity` the last step and `-Infinity` the minimum), `NaN` read as the minimum, and a range's ends are put in order. A given or held value off the grid (as when the bounds or the step change) moves onto it as a change (`onChange`), not a commit, so an owner can take the value on screen. `snapToStep(value, grid)` and `normalizeSliderValue(value, grid)` give that value. `formatOptions` (`Intl.NumberFormat` options) shall format the value in the `UiProvider` locale ([PROVIDER.md](PROVIDER.md)), in the value output and in each thumb's `aria-valuetext`.

Implementation: `src/components/number-field/number-slider.tsx`, `src/components/number-field/number-slider-parts.tsx`, `src/components/number-field/slider-values.ts`
Verification: `src/components/number-field/number-slider.test.tsx`

### UIC-NUMBER-FIELD-5.3 - Track, fill and thumb

The slider shall draw a track (`ui-number-field__track`) holding the fill (`ui-number-field__fill`) and one thumb per value (`ui-number-field__thumb`). The slider positions the thumb along the track and sizes the fill with functional inline styles: the fill runs from the minimum, or from `fillOffset` (so a slider around zero fills from 0), to the value. Pressing the track moves the nearest thumb to the press, and dragging a thumb or the track moves it with the pointer. A drag maps the pointer's travel onto the track's length, so a stylesheet keeps that length steady while a thumb moves: the reference sheet reserves the restore button's place, which shows once the value differs from the committed one, and gives the output a fixed width.

Implementation: `src/components/number-field/number-slider.tsx`, `src/components/number-field/number-slider-parts.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-5.4 - Value label

`valueLabel` shall choose where the value shows and publish it as `data-value-label` on the root: `output` (the default) draws a value output (`ui-number-field__output`, an `<output>` for the thumbs that does not announce itself) before the track, with the formatted value or range; `input` draws a number input per value before the track (`ui-number-field__endpoints`, UIC-NUMBER-FIELD-8.5) that edits it, named like its thumb, while the thumbs keep the field's control and its form value; `thumb` draws each thumb's formatted value in `ui-number-field__thumb-label` inside the thumb, hidden from assistive technology, which the reference sheet shows above the thumb while it is hovered, focused or dragged; `none` draws neither.

Implementation: `src/components/number-field/number-slider-parts.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-5.5 - Marks

`marks` shall draw one `ui-number-field__mark` per entry inside the track, at its `value`, positioned with functional inline styles (`inset-inline-start` as a percentage of the track, or `bottom` on a vertical slider), with its `label` in `ui-number-field__mark-label`. A mark within the filled part publishes `data-in-range`. Marks are a visual scale, hidden from assistive technology: each thumb reports its own value. Pressing a mark's label presses the track there.

Implementation: `src/components/number-field/number-slider-parts.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-5.6 - Orientation and size

`orientation` (`horizontal` by default, or `vertical`) shall lay the track out along that axis, publish `data-orientation` on the box, the track, the fill and the output, and turn the thumb's drag and arrow keys to that axis. A horizontal slider follows the direction of the `UiProvider` locale, as React Aria reads it: in a right-to-left locale the minimum sits at the right end, the fill grows leftward, a thumb sits at its value measured from the right, Arrow Left raises the value and Arrow Right lowers it, and a drag toward the left raises it. The locale, not the DOM's `dir`, sets this direction, so a right-to-left region sets both (a provider with a right-to-left locale around content with `dir="rtl"`); a vertical slider is the same in both directions. `size` (`xs`, `sm`, `md` by default, `lg`) is the field's size (UIC-FIELD-1.10), which also sizes the track and thumb. The Number Field lab draws the slider display and ranges beside the number input, in every field state at `xs`, `sm`, `md` and `lg`.

Implementation: `src/components/number-field/number-slider.tsx`, `src/components/number-field/number-slider-parts.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-5.7 - Hooks and caller attributes

The slider display shall carry the hooks below on top of the field's, append the caller's `className` to their root and forward caller `data-*` attributes to it. A caller `id` goes on the root; the group's id derives from it (`<id>-control`) and each thumb input's from the group's (`<id>-control-0`, `<id>-control-1`). `aria-details` names an element with details about the slider; it takes no other props than the field's and those this spec lists.

Implementation: `src/components/number-field/number-slider.tsx`
Verification: `src/components/number-field/number-slider.test.tsx`

## UIC-NUMBER-FIELD-6 - Accessibility and keyboard

### UIC-NUMBER-FIELD-6.1 - Names and descriptions

The group shall carry the field label as its `aria-label`, because each thumb is named after the group's own name. Each thumb holds a visually hidden native range input (role `slider`) named by the field label (UIC-NUMBER-FIELD-8.4 for a range), described by the field's description, decoration and message, and reporting its formatted value in `aria-valuetext`. While invalid, each input carries `aria-invalid="true"` and `aria-errormessage` naming the message.

Implementation: `src/components/number-field/number-slider-parts.tsx`, `src/components/number-field/number-slider.tsx`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-6.2 - Keyboard and states

Tab shall reach each thumb in order. Arrow Right and Arrow Up shall step the focused thumb's value up and Arrow Left and Arrow Down down by `step` (mirrored for Right and Left in right-to-left locales); Shift with an arrow, Page Up and Page Down step by a page, a tenth of the range rounded to a multiple of the step; Home and End move to the lowest and highest value the thumb may take. Each thumb publishes `data-focused`, `data-focus-visible` (keyboard focus only), `data-hovered` and `data-dragging` while it is dragged.

Implementation: `src/components/number-field/number-slider-parts.tsx`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-6.3 - Disabled and read-only

A disabled slider (`isDisabled`, or a disabled `Fieldset` around it) shall disable its thumb inputs natively, leave the tab order and publish `data-disabled` on the box, the track, the fill, the output and the thumbs. A read-only slider keeps its thumbs focusable and its value readable but refuses every change: its thumbs do not move and `onChange`, `onCommit` and `onChangeEnd` are not called.

Implementation: `src/components/number-field/number-slider-parts.tsx`, `src/components/field/field-state.ts`
Verification: `src/components/number-field/number-slider.test.tsx`

## UIC-NUMBER-FIELD-7 - Field behaviour

### UIC-NUMBER-FIELD-7.1 - Validation, dirty state and undo

The slider display shall show each validation status from `validate` (invalid, warning and pending), show dirty state with a restore button that puts the committed value back and focuses the first thumb, undo and redo with the field's chords pressed on a thumb, and offer the field menu, whose Set to default puts the default back.

Implementation: `src/components/number-field/number-slider.tsx`, `src/components/field/field.tsx`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-7.2 - Forms

With `name`, a form shall submit a slider's value under that name. A range takes `startName` and `endName` instead and submits each end once under its own name. Errors a [Form](FORM.md) gives in `validationErrors` under `startName` or `endName` belong to the field ([UIC-FIELD-3.9](FIELD.md#uic-field-39---external-errors)): it shows them, they block the form's submission, and each clears once its own end changes, while the other end's error stays until a new errors object or its own end changes. The field's control reference is the first thumb's input, so a form's submit validation focuses it and the native behavior's custom validity (UIC-FIELD-3.10) blocks a native submit through it.

Implementation: `src/components/number-field/number-slider-parts.tsx`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

## UIC-NUMBER-FIELD-8 - Range

### UIC-NUMBER-FIELD-8.1 - Two thumbs

`range` shall make the field hold a range, a start and an end (`NumberRange`, `[number, number]`), with `NumberRangeFieldProps`: the slider display's props, but `name`, plus `startName`, `endName` and `minStepsBetweenThumbs`. Its root publishes `data-range`. With `display="slider"` it renders the slider's parts with two thumbs, so every slider rule applies to it. A field given no value, committed value or default starts at the whole range, the fill runs between the thumbs and the output shows the formatted range.

Implementation: `src/components/number-field/number-slider.tsx`, `src/components/number-field/number-slider-parts.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-8.2 - Thumbs never cross

Each thumb of a range shall stop at the other one, by drag, track press and keyboard alike: the start never passes the end and the end never passes the start.

Implementation: `src/components/number-field/number-slider.tsx`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-8.3 - Minimum distance

`minStepsBetweenThumbs` (0 by default) shall keep that many steps between the thumbs: the thumb that moves stops that far from the other, within the range. `keepThumbsApart(next, previous, bounds)` gives the range after a move from the previous one, holding back the thumb that moved, and keeps a change that moves both thumbs as it is. Thumbs already closer than that (a value set from outside, or the range's end) never jump apart: a move that brings them closer is refused and one that moves them apart is kept as it is. The spaced range is snapped onto the grid (UIC-NUMBER-FIELD-5.2), so a fractional step gives `0.2`, not `0.19999999999999998`.

Implementation: `src/components/number-field/number-slider.tsx`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-8.4 - Thumb names

The start thumb shall be named by the provider string `rangeMinimum` and the end thumb by `rangeMaximum`, each followed by the field label (`Minimum Price`, `Maximum Price`).

Implementation: `src/components/number-field/number-slider.tsx`, `src/core/strings/field.ts`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

### UIC-NUMBER-FIELD-8.5 - Range inputs

A range without `display="slider"` (`display="field"`, the default) shall draw no track: its control is a start and an end number input (`ui-number-field__endpoints` holding a `ui-number-field__endpoint` per end, React Aria's `NumberField` around a `ui-number-field__input`) with a dash between them (`ui-number-field__separator`, hidden from assistive technology). Each input is named like its thumb (UIC-NUMBER-FIELD-8.4), described by the field's description and message, formats and parses its end in the locale with `formatOptions`, and steps it with the arrow keys within the range and on the step. A typed end takes effect on Enter, when focus leaves the input and on each arrow step, and commits; the range keeps its ends in order and `minStepsBetweenThumbs` steps apart, as the thumbs do (UIC-NUMBER-FIELD-8.3). The start input is the field's control and submits under `startName`, the end input under `endName`. Read-only inputs refuse edits and disabled ones leave the tab order. The same inputs edit the value before the track with `valueLabel="input"` (UIC-NUMBER-FIELD-5.4), where the thumbs submit it.

Implementation: `src/components/number-field/number-endpoints.tsx`, `src/components/number-field/number-slider.tsx`, `labs/reference/number-field.css`
Verification: `src/components/number-field/number-slider.test.tsx`, `e2e/number-field-slider.spec.ts`

## Hooks

| Hook                           | Kind      | Values                             | Description                                                                                  |
| ------------------------------ | --------- | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `ui-number-field`              | root      |                                    | The field's root (also `ui-field`).                                                          |
| `ui-number-field__box`         | slot      |                                    | The React Aria number field element.                                                         |
| `ui-number-field__group`       | slot      |                                    | The group around the input and the step buttons.                                             |
| `ui-number-field__decrement`   | slot      |                                    | The decrement button.                                                                        |
| `ui-number-field__scrubber`    | slot      |                                    | The scrub handle.                                                                            |
| `ui-number-field__start`       | slot      |                                    | The start adornment.                                                                         |
| `ui-number-field__value`       | slot      |                                    | With the end adornment after the number: the input and sizer.                                |
| `ui-number-field__input`       | slot      |                                    | The text input.                                                                              |
| `ui-number-field__sizer`       | slot      |                                    | A hidden copy of the input's text, beside it in the value.                                   |
| `ui-number-field__end`         | slot      |                                    | The end adornment.                                                                           |
| `ui-number-field__increment`   | slot      |                                    | The increment button.                                                                        |
| `ui-number-field__slider`      | slot      |                                    | The slider display's React Aria slider (role `group`).                                       |
| `ui-number-field__output`      | slot      |                                    | The slider's value output.                                                                   |
| `ui-number-field__track`       | slot      |                                    | The slider's track.                                                                          |
| `ui-number-field__fill`        | slot      |                                    | The filled part of the track.                                                                |
| `ui-number-field__mark`        | slot      |                                    | A mark on the track.                                                                         |
| `ui-number-field__mark-label`  | slot      |                                    | A mark's label.                                                                              |
| `ui-number-field__thumb`       | slot      |                                    | A thumb, holding its hidden range input.                                                     |
| `ui-number-field__thumb-label` | slot      |                                    | A thumb's value, with `valueLabel="thumb"`.                                                  |
| `ui-number-field__endpoints`   | slot      |                                    | A range's start and end inputs, or the inputs before a track.                                |
| `ui-number-field__endpoint`    | slot      |                                    | One value's React Aria number field, around its input.                                       |
| `ui-number-field__separator`   | slot      |                                    | The dash between a range's inputs.                                                           |
| `data-hide-stepper`            | state     | `true`                             | On the root: the step buttons are left out.                                                  |
| `data-adornment-placement`     | attribute | `value`                            | On the root: the end adornment follows the number.                                           |
| `data-invalid`                 | state     | `true`                             | On the box, the group and the input: invalid (React Aria).                                   |
| `data-required`                | state     | `true`                             | On the box: a value is required (React Aria).                                                |
| `data-readonly`                | state     | `true`                             | On the box and the group: read-only (React Aria).                                            |
| `data-disabled`                | state     | `true`                             | On the box, the group, the input, the buttons and the slider's parts (React Aria).           |
| `data-hovered`                 | state     | `true`                             | On the group, the input, the buttons, the track, the fill and a thumb: hovered (React Aria). |
| `data-focus-within`            | state     | `true`                             | On the group: focus is inside it (React Aria).                                               |
| `data-focused`                 | state     | `true`                             | On the input, the buttons and a thumb: focused (React Aria).                                 |
| `data-focus-visible`           | state     | `true`                             | On the group, the input, the buttons and a thumb (React Aria).                               |
| `data-pressed`                 | state     | `true`                             | On the buttons: being pressed (React Aria).                                                  |
| `data-radix`                   | attribute | `2`, `8`, `10`, `16`               | Number base on root.                                                                         |
| `data-display`                 | attribute | `slider`                           | On the root: the slider display.                                                             |
| `data-range`                   | state     | `true`                             | On the root: the field holds a range.                                                        |
| `data-size`                    | attribute | `xs`, `sm`, `md`, `lg`             | On the root: the field's size, also the slider's track and thumb.                            |
| `data-value-label`             | attribute | `output`, `input`, `thumb`, `none` | On a slider display's root: where the value shows.                                           |
| `data-orientation`             | attribute | `horizontal`, `vertical`           | On the slider, the track, the fill and the output (React Aria).                              |
| `data-in-range`                | state     | `true`                             | On a mark within the filled part.                                                            |
| `data-dragging`                | state     | `true`                             | On a thumb being dragged (React Aria).                                                       |
