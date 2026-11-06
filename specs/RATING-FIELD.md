# Rating Field

`RatingField` is a field that rates with glyphs, in whole or half steps up to a maximum: a radio group, so the arrow keys step through the ratings and a form submits the picked one, with the hover preview, custom glyphs and the field contract (validation, dirty state, restore, undo, Clear). `Rating`, in the same family, shows a score such as an average of reviews as glyphs filled up to it, fractions included, read as one image.

## UIC-RATING-FIELD-1 - Rating field

### UIC-RATING-FIELD-1.1 - Field control

`RatingField` shall render a `Field` around a radio group (`ui-rating-field__group`, role `radiogroup`, named by the field label), built with `useFieldControl`. Its root is the field's root, which carries `ui-rating-field` beside `ui-field` and publishes `data-step` (`whole` or `half`). The group holds one `ui-rating-field__item` per glyph, each holding a decorative empty glyph (`ui-rating-field__glyph`), a decorative filled glyph over it (`ui-rating-field__fill`) and its radios (`ui-rating-field__radio`, a `<label>` around a visually hidden native radio). The value is the picked rating, a number, or `null` while there is none; picking a radio sets its rating and commits it.

Implementation: `src/components/rating-field/rating-field.tsx`, `src/components/rating-field/rating-glyphs.tsx`, `labs/reference/rating-field.css`
Verification: `src/components/rating-field/rating-field.test.tsx`, `e2e/rating-field.spec.ts`

### UIC-RATING-FIELD-1.2 - Range and step

`maxValue` (5 by default, rounded to a whole number of at least 1) shall set the highest rating and the number of glyphs. `step` is `1` (the default: one radio per glyph, from 1 to the maximum) or `0.5` (two radios per glyph, its half and the whole glyph, from 0.5 to the maximum; a half radio publishes `data-half`). Each item publishes `data-fill` (`full`, `partial` or `empty`) for the shown value, and a partial item publishes `--ui-rating-fill`, the filled share of its glyph, which the stylesheet clips the filled glyph to from the inline start.

Implementation: `src/components/rating-field/rating-field.tsx`, `src/components/rating-field/rating-glyphs.tsx`, `labs/reference/rating-field.css`
Verification: `src/components/rating-field/rating-field.test.tsx`, `e2e/rating-field.spec.ts`

### UIC-RATING-FIELD-1.3 - Given values

A value shall pick the radio it rounds to at the step, bounded to the maximum; zero, a value that rounds below one step, and a non-finite number pick none and show every glyph empty, as `null` does. Such a value counts as empty for the required check.

Implementation: `src/components/rating-field/rating-field.tsx`
Verification: `src/components/rating-field/rating-field.test.tsx`

### UIC-RATING-FIELD-1.4 - Form value

With `name`, a form shall submit the picked rating under that name, and nothing while none is picked.

Implementation: `src/components/rating-field/rating-field.tsx`
Verification: `src/components/rating-field/rating-field.test.tsx`

### UIC-RATING-FIELD-1.5 - Glyphs

`icon` shall set the glyph every position draws (a star by default), and `emptyIcon` a different glyph for the empty layer, such as an outlined shape beside a filled one. Both layers are hidden from assistive technology. The reference sheet outlines the empty glyph and fills the filled one, so a rating reads by shape as well as colour.

Implementation: `src/components/rating-field/rating-glyphs.tsx`, `labs/reference/rating-field.css`
Verification: `src/components/rating-field/rating-field.test.tsx`, `e2e/rating-field.spec.ts`

### UIC-RATING-FIELD-1.6 - Hooks and caller attributes

`RatingField` shall carry the hooks below, append the caller's `className` to its root and forward caller `data-*` attributes and `id` to it.

Implementation: `src/components/rating-field/rating-field.tsx`
Verification: `src/components/rating-field/rating-field.test.tsx`

## UIC-RATING-FIELD-2 - Interaction and accessibility

### UIC-RATING-FIELD-2.1 - Hover preview

Hovering a radio with a mouse or pen shall show its rating on the glyphs and publish `data-previewing` on the group, while the radios keep the picked rating; leaving it shows the picked rating again. Touch and keyboard do not preview: they pick. A read-only or disabled field previews nothing.

Implementation: `src/components/rating-field/rating-field.tsx`
Verification: `src/components/rating-field/rating-field.test.tsx`, `e2e/rating-field.spec.ts`

### UIC-RATING-FIELD-2.2 - Names and keyboard

The group and its radios shall publish React Aria's `data-invalid`, `data-required`, `data-readonly` and `data-disabled`, and each radio `data-selected`, `data-hovered`, `data-pressed`, `data-focused` and `data-focus-visible`. Each radio shall be named by the provider's `ratingValue` text for its rating (`3 out of 5`, `2.5 out of 3`). Tab enters the group as one stop, on the picked rating or on the lowest while none is picked; the arrow keys step to the next or previous rating and pick it, Right and Left mirrored in right-to-left locales, and the glyphs fill from the inline start.

Implementation: `src/components/rating-field/rating-field.tsx`, `src/core/strings/field.ts`, `labs/reference/rating-field.css`
Verification: `src/components/rating-field/rating-field.test.tsx`, `e2e/rating-field.spec.ts`

### UIC-RATING-FIELD-2.3 - Disabled and read-only

A disabled field shall disable every radio. A read-only field keeps its radios focusable and its rating shown, refuses every pick, and its group carries `aria-readonly="true"`.

Implementation: `src/components/rating-field/rating-field.tsx`
Verification: `src/components/rating-field/rating-field.test.tsx`

## UIC-RATING-FIELD-3 - Field behaviour

### UIC-RATING-FIELD-3.1 - Validation, dirty state, restore and Clear

A required field with no rating shall be invalid (UIC-FIELD-3.1). `RatingField` shows dirty state with a restore button, which puts back the committed rating and focuses its radio, undoes and redoes with the field's chords, and offers the field menu, whose Clear removes the rating.

Implementation: `src/components/rating-field/rating-field.tsx`, `src/components/field/field.tsx`
Verification: `src/components/rating-field/rating-field.test.tsx`, `e2e/rating-field.spec.ts`

## UIC-RATING-FIELD-4 - Rating

### UIC-RATING-FIELD-4.1 - One image named by the score

`Rating` shall render a `<span>` (`ui-rating`) with `role="img"`, named by the provider's `ratingValue` text for its score (`4.3 out of 5`), or `ratingNone` (`No rating`) for `null` or a non-finite number; its glyphs are decorative, so a reader hears the score once. `valueLabel`, plain text, replaces the spoken score (`4.3 out of 5, 120 reviews`), and `aria-label` or `aria-labelledby` name it instead. It takes no tab stop and handles no input.

Implementation: `src/components/rating-field/rating.tsx`, `src/core/strings/field.ts`
Verification: `src/components/rating-field/rating.test.tsx`, `e2e/rating-field.spec.ts`

### UIC-RATING-FIELD-4.2 - Fractional fill

The score shall be bounded between 0 and `maxValue` (5 by default), and `maxValue` glyph positions (`ui-rating__item`, with `ui-rating__glyph` and `ui-rating__fill`) publish `data-fill` and, when partial, `--ui-rating-fill`, the filled share to a tenth of a percent, so 4.3 fills four glyphs and 30% of the fifth. A rating without a score publishes `data-empty`.

Implementation: `src/components/rating-field/rating.tsx`, `src/components/rating-field/rating-glyphs.tsx`, `labs/reference/rating-field.css`
Verification: `src/components/rating-field/rating.test.tsx`, `e2e/rating-field.spec.ts`

### UIC-RATING-FIELD-4.3 - Size, glyphs and caller attributes

`size` shall publish `data-size` (`sm`, `md` by default, `lg`), and `icon` and `emptyIcon` set the glyphs as on the field. `Rating` appends the caller's `className` and forwards `id`, `ref` (its `<span>`) and caller `data-*` attributes to its root.

Implementation: `src/components/rating-field/rating.tsx`
Verification: `src/components/rating-field/rating.test.tsx`

## Hooks

| Hook                     | Kind      | Values                     | Description                                                     |
| ------------------------ | --------- | -------------------------- | --------------------------------------------------------------- |
| `ui-rating-field`        | root      |                            | The rating field, beside `ui-field`.                            |
| `ui-rating-field__group` | slot      |                            | The radio group.                                                |
| `ui-rating-field__item`  | slot      |                            | One glyph position and its radios.                              |
| `ui-rating-field__glyph` | slot      |                            | The decorative empty glyph.                                     |
| `ui-rating-field__fill`  | slot      |                            | The decorative filled glyph, clipped to the position's share.   |
| `ui-rating-field__radio` | slot      |                            | One rating's `<label>` around its hidden radio.                 |
| `ui-rating`              | root      |                            | The read-only rating (`role="img"`).                            |
| `ui-rating__item`        | slot      |                            | One glyph position of a read-only rating.                       |
| `ui-rating__glyph`       | slot      |                            | A read-only rating's decorative empty glyph.                    |
| `ui-rating__fill`        | slot      |                            | A read-only rating's decorative filled glyph.                   |
| `data-step`              | attribute | `whole`, `half`            | Whole glyphs only, or halves too.                               |
| `data-fill`              | attribute | `full`, `partial`, `empty` | How much of a position the shown value fills.                   |
| `data-half`              | state     | `true`                     | The radio rates half a glyph.                                   |
| `data-previewing`        | state     | `true`                     | The glyphs show a hovered rating instead of the picked one.     |
| `data-empty`             | state     | `true`                     | A read-only rating has no score.                                |
| `data-size`              | attribute | `xs`, `sm`, `md`, `lg`     | A radio's field size, or a read-only rating's glyph size.       |
| `--ui-rating-fill`       | property  |                            | The filled share of a partial position, as a percentage.        |
| `data-orientation`       | attribute | `horizontal`               | On the group: the arrow-key axis (React Aria).                  |
| `data-selected`          | state     | `true`                     | On a radio: picked (React Aria).                                |
| `data-hovered`           | state     | `true`                     | On a radio: under the pointer (React Aria).                     |
| `data-pressed`           | state     | `true`                     | On a radio: being pressed (React Aria).                         |
| `data-focused`           | state     | `true`                     | On a radio: its input has focus (React Aria).                   |
| `data-focus-visible`     | state     | `true`                     | On a radio: its input has keyboard focus (React Aria).          |
| `data-invalid`           | state     | `true`                     | On the group and its radios: invalid (React Aria).              |
| `data-required`          | state     | `true`                     | On the group and its radios: a rating is required (React Aria). |
| `data-readonly`          | state     | `true`                     | On the group and its radios: read-only (React Aria).            |
| `data-disabled`          | state     | `true`                     | On the group and its radios: disabled (React Aria).             |
