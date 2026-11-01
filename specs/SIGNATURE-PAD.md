# Signature Pad

`SignaturePad` is a [field](FIELD.md) for a signature. The reader draws it with a mouse, a pen or a touch on an SVG canvas, as smoothed strokes with Undo stroke and Clear, or types their name instead, the keyboard alternative to drawing. The value is plain data: a drawn signature (`DrawnSignature`: SVG path data per stroke in a drawing space) or a typed one (`TypedSignature`: the name), and `null` while empty. It takes the field's props (`FieldInputProps<SignatureValue | null>`), so it has a label and layout, a description, validation, dirty state and restore, undo and redo, and the field menu. `formatSignatureSvg` and `formatSignatureDataUrl` turn a drawing into standalone SVG markup or a `data:` URL, to store, to show through [Svg Markup](SVG-MARKUP.md) or as an image.

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-SIGNATURE-PAD-1 - Contract

### UIC-SIGNATURE-PAD-1.1 - Field control

`SignaturePad` shall render a `Field` around its controls, built with `useFieldControl`. Its root element is the field's root, which carries `ui-signature-pad` beside `ui-field` and publishes the mode shown in `data-mode` (`draw` or `type`). A field given no value, committed value or default starts empty (`null`), and Clear empties it.

Implementation: `src/components/signature-pad/signature-pad.tsx`, `labs/reference/signature-pad.css`
Verification: `src/components/signature-pad/signature-pad.test.tsx`, `e2e/signature-pad.spec.ts`

### UIC-SIGNATURE-PAD-1.2 - Drawing area

In the draw mode, the field's control shall be the drawing area (`ui-signature-pad__surface`, role `img`), named by the field label (`aria-labelledby`, or `aria-label` in the `control-only` layout) and described first by its stroke count (the provider string `signatureStrokes`: "Drawing area, empty", "Drawing area, 2 strokes"), then by the field's description, decoration and message, with `aria-invalid` while invalid. It is focusable from script but not in the tab order (`tabIndex="-1"`), so a restore or a blocked form submit moves focus to it without adding a tab stop that the keyboard cannot use. It holds the canvas (`ui-signature-pad__canvas`), an `<svg>` whose `viewBox` is the drawing space and which fills the area, and one path per stroke (`ui-signature-pad__stroke`), unfilled in `currentColor` with round caps and joins and a stroke width that does not scale with the area.

Implementation: `src/components/signature-pad/signature-surface.tsx`, `src/core/strings/field.ts`
Verification: `src/components/signature-pad/signature-pad.test.tsx`, `e2e/signature-pad.spec.ts`

### UIC-SIGNATURE-PAD-1.3 - Form value

With `name`, a form shall submit the value as JSON text under that name through one hidden input (empty text while empty); a disabled field submits nothing. The name also shows the nearest form's external errors for it (UIC-FIELD-3.9).

Implementation: `src/components/signature-pad/signature-pad.tsx`
Verification: `src/components/signature-pad/signature-pad.test.tsx`

### UIC-SIGNATURE-PAD-1.4 - Read-only and disabled

A read-only or disabled field shall show its signature and refuse every change: the drawing area ignores the pointer, Undo stroke and Clear are disabled, the name input is natively read-only or disabled and the mode choice is read-only or disabled. Becoming read-only or disabled during a stroke shall release capture, clear the live path and drawing state, and abandon the stroke without changing or committing the signature. Unlocking requires a new press.

Implementation: `src/components/signature-pad/signature-pad.tsx`, `src/components/signature-pad/signature-surface.tsx`
Verification: `src/components/signature-pad/signature-pad.test.tsx`

### UIC-SIGNATURE-PAD-1.5 - Hooks and caller attributes

`SignaturePad` shall carry the hooks below on top of the field's, append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the control's id derives from it (`<id>-control`).

Implementation: `src/components/signature-pad/signature-pad.tsx`
Verification: `src/components/signature-pad/signature-pad.test.tsx`

## UIC-SIGNATURE-PAD-2 - Drawing

### UIC-SIGNATURE-PAD-2.1 - Strokes

Pressing the primary button of a mouse, a pen or a touch on the canvas shall start a stroke, capture the pointer and publish `data-drawing` on the drawing area; each move adds its position, mapped from the canvas box to the drawing space and kept inside it, and the stroke shows as it is drawn. Releasing the pointer ends the stroke: its path joins the drawing, which becomes the value and is committed. A cancelled pointer drops the stroke, and so does anything that changes what it was drawn against while it is under way: a value replaced from outside (in the same drawing space or another), a restore, a clear, an accepted form reset (even of an empty pad), or the pad turning read-only or disabled; the dropped stroke reports no change or commit, and a reset a listener cancels keeps it. An equal value given again keeps the stroke. Other buttons and a second pointer during a stroke are ignored, and the canvas takes no touch gesture (`touch-action: none`), so drawing never scrolls the page. A new drawing's space is 600 by 200; a drawing keeps its own space, so strokes added to a stored signature line up with it.

Implementation: `src/components/signature-pad/signature-surface.tsx`, `src/components/signature-pad/signature-pad.tsx`
Verification: `src/components/signature-pad/signature-pad.test.tsx`, `e2e/signature-pad.spec.ts`

### UIC-SIGNATURE-PAD-2.2 - Smoothing

A stroke's path data shall start at its first position, run as quadratic curves through the midpoints between the following positions and end with a line to the last one, which smooths the jitter of a hand-drawn line. Positions closer than 1.5 units to the previous kept one are dropped (the last position is always kept, so a short stroke whose points all stay near the first still ends at its last position), coordinates are rounded to one decimal, and a stroke of one position, or one that ends exactly where it started with every point near it, is a zero-length line, which the round cap draws as a dot.

Implementation: `src/components/signature-pad/signature-path.ts`
Verification: `src/components/signature-pad/signature-path.test.ts`

### UIC-SIGNATURE-PAD-2.3 - Undo stroke and Clear

The draw mode shall end with Undo stroke and Clear buttons (in `ui-signature-pad__actions`, named by the provider strings `undoStroke` and `clear`). Undo stroke removes the last stroke and Clear removes them all, each committing the result; a drawing left with no stroke is `null`. Both are disabled while the drawing is empty.

Implementation: `src/components/signature-pad/signature-surface.tsx`, `src/core/strings/field.ts`
Verification: `src/components/signature-pad/signature-pad.test.tsx`, `e2e/signature-pad.spec.ts`

### UIC-SIGNATURE-PAD-2.4 - Standalone output

`formatSignatureSvg(drawing)` shall return SVG markup of the drawing: its space as the `viewBox`, `width` and `height`, and one path per stroke, unfilled, in `currentColor`, three units wide with round caps and joins, so inlined markup takes the text colour and an image draws in black. Path data is escaped, so no value can break out of its attribute. `formatSignatureDataUrl(drawing)` returns the markup as a `data:image/svg+xml` URL.

Implementation: `src/components/signature-pad/signature-path.ts`
Verification: `src/components/signature-pad/signature-path.test.ts`, `e2e/signature-pad.spec.ts`

## UIC-SIGNATURE-PAD-3 - Typing

### UIC-SIGNATURE-PAD-3.1 - Choosing how to sign

With `allowsTyping` (the default), the field shall start with a [Segmented Choice](SEGMENTED-CHOICE.md) (`ui-signature-pad__modes`) named by the provider string `signatureMethod`, between Draw and Type (`signatureDraw`, `signatureType`). The mode shown follows the value: a drawn value shows the draw mode and a typed value the type mode; an empty field shows the mode of the value it last held or the mode last chosen, Draw at first. Choosing the other mode while the field holds a value of the current one empties and commits it. Without `allowsTyping` there is no choice and an empty field shows the draw mode, also when typing is turned off while an empty field shows the type mode; a typed value the field already holds keeps showing in the type mode until it is cleared, so turning typing off never erases a saved signature.

Implementation: `src/components/signature-pad/signature-pad.tsx`, `src/core/strings/field.ts`
Verification: `src/components/signature-pad/signature-pad.test.tsx`, `e2e/signature-pad.spec.ts`

### UIC-SIGNATURE-PAD-3.2 - Typed name

In the type mode, the field's control shall be a text input (`ui-signature-pad__input`) named by the field label, described by its description and message, with `aria-required` and `aria-invalid` as the field sets them, the `name` autofill hint and the provider string `signatureTypePlaceholder` as its hint. Typing sets a typed signature with the text as typed; blank text sets `null`. Enter, or focus leaving the field (UIC-FIELD-1.11), commits the value, so Tab from the edited input reaches the restore button without committing. An Enter an input method composition owns (pressed during it, or the Enter that confirms a candidate, reported with key code 229) is left to the input method and commits nothing.

Implementation: `src/components/signature-pad/signature-pad.tsx`, `src/core/strings/field.ts`
Verification: `src/components/signature-pad/signature-pad.test.tsx`, `e2e/signature-pad.spec.ts`

### UIC-SIGNATURE-PAD-3.3 - Field behaviour

`SignaturePad` shall show each validation status (a required field is invalid while empty: no value, typed text that is blank or a drawing with no stroke, whether typed, drawn or given as `value`, `defaultValue` or `committedValue`; such a value stays as given, it is never replaced by `null` unasked), show dirty state with a restore button, undo and redo with the field's chords from its controls, and offer the field menu, whose Clear empties the signature.

Implementation: `src/components/signature-pad/signature-pad.tsx`, `src/components/field/field.tsx`
Verification: `src/components/signature-pad/signature-pad.test.tsx`, `e2e/signature-pad.spec.ts`

## Hooks

| Hook                        | Kind  | Values         | Description                                                         |
| --------------------------- | ----- | -------------- | ------------------------------------------------------------------- |
| `ui-signature-pad`          | root  |                | The field's root (also `ui-field`).                                 |
| `ui-signature-pad__modes`   | slot  |                | The choice between drawing and typing (also `ui-segmented-choice`). |
| `ui-signature-pad__surface` | slot  |                | The drawing area (role `img`).                                      |
| `ui-signature-pad__canvas`  | slot  |                | The `<svg>` canvas inside the drawing area.                         |
| `ui-signature-pad__stroke`  | slot  |                | One stroke's `<path>`.                                              |
| `ui-signature-pad__actions` | slot  |                | Holds Undo stroke and Clear.                                        |
| `ui-signature-pad__input`   | slot  |                | The typed name's `<input>`.                                         |
| `data-mode`                 | state | `draw`, `type` | On the root: the mode shown.                                        |
| `data-drawing`              | state | `true`         | On the drawing area: a stroke is being drawn.                       |
| `data-invalid`              | state | `true`         | On the input: invalid (React Aria).                                 |
| `data-disabled`             | state | `true`         | On the input: disabled (React Aria).                                |
| `data-hovered`              | state | `true`         | On the input: under the pointer (React Aria).                       |
| `data-focused`              | state | `true`         | On the input: focused (React Aria).                                 |
| `data-focus-visible`        | state | `true`         | On the input: focused from the keyboard (React Aria).               |
