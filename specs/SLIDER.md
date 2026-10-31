# Slider

`Slider` is a [field](FIELD.md) for a number picked along a track, and `RangeSlider` one for a range (a start and an end), both built on React Aria's `Slider`, `SliderTrack`, `SliderFill`, `SliderThumb` and `SliderOutput`. They take the field's props (`FieldInputProps<number>` and `FieldInputProps<[number, number]>`) but `isRequired` and `emptyValue`: a slider always holds a value, so it is never required and never cleared. They share their parts: a track with a fill, optional marks with labels, one thumb per value and a value output. The colour sliders of a [Color Field](COLOR-FIELD.md) are a different control.

## UIC-SLIDER-1 - Contract

### UIC-SLIDER-1.1 - Field control

`Slider` shall render a `Field` around a slider group (`ui-slider__box`, role `group`), built with `useFieldControl`. Its root element is the field's root, which carries `ui-slider` beside `ui-field`. The value is a number: a field given no value, committed value or default starts at the minimum. While a thumb moves, by a drag or a key press, each new value goes through `onChange`; when the drag or key press ends the field commits (`onCommit`) and calls `onChangeEnd` with the value.

Implementation: `src/components/slider/slider.tsx`, `src/components/slider/slider-parts.tsx`, `labs/reference/slider.css`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-1.2 - Range, step and format

`minValue` (0 by default), `maxValue` (100 by default) and `step` (1 by default) shall bound the value, which the slider keeps within the range and on the step. `formatOptions` (`Intl.NumberFormat` options) shall format the value in the `UiProvider` locale ([PROVIDER.md](PROVIDER.md)), in the value output and in each thumb's `aria-valuetext`.

Implementation: `src/components/slider/slider.tsx`, `src/components/slider/slider-parts.tsx`
Verification: `src/components/slider/slider.test.tsx`

### UIC-SLIDER-1.3 - Track, fill and thumb

The slider shall draw a track (`ui-slider__track`) holding the fill (`ui-slider__fill`) and one thumb per value (`ui-slider__thumb`). The slider positions the thumb along the track and sizes the fill with functional inline styles: the fill runs from the minimum, or from `fillOffset` (so a slider around zero fills from 0), to the value. Pressing the track moves the nearest thumb to the press, and dragging a thumb or the track moves it with the pointer. A drag maps the pointer's travel onto the track's length, so a stylesheet keeps that length steady while a thumb moves: the reference sheet reserves the restore button's place, which shows once the value differs from the committed one, and gives the output a fixed width.

Implementation: `src/components/slider/slider.tsx`, `src/components/slider/slider-parts.tsx`, `labs/reference/slider.css`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-1.4 - Value label

`valueLabel` shall choose where the value shows and publish it as `data-value-label` on the root: `output` (the default) draws a value output (`ui-slider__output`, an `<output>` for the thumbs that does not announce itself) before the track, with the formatted value or range; `thumb` draws each thumb's formatted value in `ui-slider__thumb-label` inside the thumb, hidden from assistive technology, which the reference sheet shows above the thumb while it is hovered, focused or dragged; `none` draws neither.

Implementation: `src/components/slider/slider-parts.tsx`, `labs/reference/slider.css`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-1.5 - Marks

`marks` shall draw one `ui-slider__mark` per entry inside the track, at its `value`, positioned with functional inline styles (`inset-inline-start` as a percentage of the track, or `bottom` on a vertical slider), with its `label` in `ui-slider__mark-label`. A mark within the filled part publishes `data-in-range`. Marks are a visual scale, hidden from assistive technology: each thumb reports its own value. Pressing a mark's label presses the track there.

Implementation: `src/components/slider/slider-parts.tsx`, `labs/reference/slider.css`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-1.6 - Orientation and size

`orientation` (`horizontal` by default, or `vertical`) shall lay the track out along that axis, publish `data-orientation` on the box, the track, the fill and the output, and turn the thumb's drag and arrow keys to that axis. `size` (`xs`, `sm`, `md` by default, `lg`) is the field's size (UIC-FIELD-1.10), which also sizes the track and thumb.

Implementation: `src/components/slider/slider.tsx`, `src/components/slider/slider-parts.tsx`, `labs/reference/slider.css`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-1.7 - Hooks and caller attributes

The sliders shall carry the hooks below on top of the field's, append the caller's `className` to their root and forward caller `data-*` attributes to it. A caller `id` goes on the root; the group's id derives from it (`<id>-control`) and each thumb input's from the group's (`<id>-control-0`, `<id>-control-1`). `aria-details` names an element with details about the slider; the sliders take no other props than the field's and those this spec lists.

Implementation: `src/components/slider/slider.tsx`, `src/components/slider/range-slider.tsx`
Verification: `src/components/slider/slider.test.tsx`

## UIC-SLIDER-2 - Accessibility and keyboard

### UIC-SLIDER-2.1 - Names and descriptions

The group shall carry the field label as its `aria-label`, because each thumb is named after the group's own name. Each thumb holds a visually hidden native range input (role `slider`) named by the field label (UIC-SLIDER-4.4 for a range), described by the field's description, decoration and message, and reporting its formatted value in `aria-valuetext`. While invalid, each input carries `aria-invalid="true"` and `aria-errormessage` naming the message.

Implementation: `src/components/slider/slider-parts.tsx`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-2.2 - Keyboard and states

Tab shall reach each thumb in order. Arrow Right and Arrow Up shall step the focused thumb's value up and Arrow Left and Arrow Down down by `step` (mirrored for Right and Left in right-to-left locales); Shift with an arrow, Page Up and Page Down step by a page, a tenth of the range rounded to a multiple of the step; Home and End move to the lowest and highest value the thumb may take. Each thumb publishes `data-focused`, `data-focus-visible` (keyboard focus only), `data-hovered` and `data-dragging` while it is dragged.

Implementation: `src/components/slider/slider-parts.tsx`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-2.3 - Disabled and read-only

A disabled slider (`isDisabled`, or a disabled `Fieldset` around it) shall disable its thumb inputs natively, leave the tab order and publish `data-disabled` on the box, the track, the fill, the output and the thumbs. A read-only slider keeps its thumbs focusable and its value readable but refuses every change: its thumbs do not move and `onChange`, `onCommit` and `onChangeEnd` are not called.

Implementation: `src/components/slider/slider-parts.tsx`, `src/components/field/field-state.ts`
Verification: `src/components/slider/slider.test.tsx`

## UIC-SLIDER-3 - Field behaviour

### UIC-SLIDER-3.1 - Validation, dirty state and undo

The sliders shall show each validation status from `validate` (invalid, warning and pending), show dirty state with a restore button that puts the committed value back and focuses the first thumb, undo and redo with the field's chords pressed on a thumb, and offer the field menu, whose Set to default puts the default back.

Implementation: `src/components/slider/slider.tsx`, `src/components/slider/range-slider.tsx`, `src/components/field/field.tsx`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-3.2 - Forms

With `name`, a form shall submit each thumb's value under that name, the start before the end for a range. The field's control reference is the first thumb's input, so a form's submit validation focuses it and the native behavior's custom validity (UIC-FIELD-3.10) blocks a native submit through it.

Implementation: `src/components/slider/slider-parts.tsx`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

## UIC-SLIDER-4 - Range slider

### UIC-SLIDER-4.1 - Two thumbs

`RangeSlider` shall render the slider's parts with two thumbs for its value, a start and an end (`[number, number]`). Its root carries `ui-range-slider` beside `ui-slider` and `ui-field`, so every slider rule applies to it. A field given no value, committed value or default starts at the whole range, the fill runs between the thumbs and the output shows the formatted range.

Implementation: `src/components/slider/range-slider.tsx`, `src/components/slider/slider-parts.tsx`, `labs/reference/slider.css`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-4.2 - Thumbs never cross

Each thumb of a range shall stop at the other one, by drag, track press and keyboard alike: the start never passes the end and the end never passes the start.

Implementation: `src/components/slider/range-slider.tsx`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-4.3 - Minimum distance

`minStepsBetweenThumbs` (0 by default) shall keep that many steps between the thumbs: the thumb that moves stops that far from the other, within the range. `keepThumbsApart(next, previous, bounds)` gives the range after a move from the previous one, holding back the thumb that moved, and keeps a change that moves both thumbs as it is. Thumbs already closer than that (a value set from outside, or the range's end) never jump apart: a move that brings them closer is refused and one that moves them apart is kept as it is.

Implementation: `src/components/slider/range-slider.tsx`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

### UIC-SLIDER-4.4 - Thumb names

The start thumb shall be named by the provider string `rangeMinimum` and the end thumb by `rangeMaximum`, each followed by the field label (`Minimum Price`, `Maximum Price`).

Implementation: `src/components/slider/range-slider.tsx`, `src/core/strings/field.ts`
Verification: `src/components/slider/slider.test.tsx`, `e2e/slider.spec.ts`

## Hooks

| Hook                     | Kind      | Values                    | Description                                                              |
| ------------------------ | --------- | ------------------------- | ------------------------------------------------------------------------ |
| `ui-slider`              | root      |                           | The field's root (also `ui-field`).                                      |
| `ui-range-slider`        | root      |                           | A range slider's root (also `ui-slider` and `ui-field`).                 |
| `ui-slider__box`         | slot      |                           | The React Aria slider (role `group`).                                    |
| `ui-slider__output`      | slot      |                           | The value output.                                                        |
| `ui-slider__track`       | slot      |                           | The track.                                                               |
| `ui-slider__fill`        | slot      |                           | The filled part of the track.                                            |
| `ui-slider__mark`        | slot      |                           | A mark on the track.                                                     |
| `ui-slider__mark-label`  | slot      |                           | A mark's label.                                                          |
| `ui-slider__thumb`       | slot      |                           | A thumb, holding its hidden range input.                                 |
| `ui-slider__thumb-label` | slot      |                           | A thumb's value, with `valueLabel="thumb"`.                              |
| `data-size`              | attribute | `xs`, `sm`, `md`, `lg`    | On the root: track and thumb size.                                       |
| `data-value-label`       | attribute | `output`, `thumb`, `none` | On the root: where the value shows.                                      |
| `data-orientation`       | attribute | `horizontal`, `vertical`  | On the box, the track, the fill and the output (React Aria).             |
| `data-in-range`          | state     | `true`                    | On a mark within the filled part.                                        |
| `data-dragging`          | state     | `true`                    | On a thumb being dragged (React Aria).                                   |
| `data-hovered`           | state     | `true`                    | On the track, the fill and a thumb: under the pointer (React Aria).      |
| `data-focused`           | state     | `true`                    | On a thumb whose input has focus (React Aria).                           |
| `data-focus-visible`     | state     | `true`                    | On a thumb whose input has keyboard focus (React Aria).                  |
| `data-disabled`          | state     | `true`                    | On the box, the track, the fill, the output and the thumbs (React Aria). |
