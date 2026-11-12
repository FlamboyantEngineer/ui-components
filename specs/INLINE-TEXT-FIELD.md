# Inline Text Field

`InlineTextField` is a one-line text field for short text edited where it is read, such as an image caption, that is safe to place inside a host that listens for keys itself: a rich-text editor's `contenteditable="false"` node view, a canvas or a grid cell. It is always editable (unlike [Inline Edit](INLINE-EDIT.md), which swaps a read view for an editor), renders no portal, never takes focus on mount, and keeps its keys and clipboard events from the host. It draws no label: the caller names it with `aria-label` or `aria-labelledby`.

## UIC-INLINE-TEXT-FIELD-1 - Editing in place

### UIC-INLINE-TEXT-FIELD-1.1 - Field

`InlineTextField` shall render a `ui-inline-text-field` text `<input>` showing a draft of `value`, with the caller's `placeholder`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`, `id`, `className`, `data-*` attributes, `onFocus`, `onBlur` and `ref`. It renders no portal or overlay and takes focus on mount only with `autoFocus`. `data-dirty` marks a draft that differs from `value`.

Implementation: `src/components/inline-text-field/inline-text-field.tsx`
Verification: `src/components/inline-text-field/inline-text-field.test.tsx`, `e2e/inline-text-field.spec.ts`

### UIC-INLINE-TEXT-FIELD-1.2 - Committing

Enter shall call `onCommit` with the draft, changed or not, so a host can move focus back to its document; focus leaving the field calls it only when the draft differs from `value` and is not the draft Enter has just committed, so a host that moves focus inside `onCommit` receives one commit. Enter that confirms an input method candidate commits nothing.

Implementation: `src/components/inline-text-field/inline-text-field.tsx`, `src/utils/is-composing-key.ts`
Verification: `src/components/inline-text-field/inline-text-field.test.tsx`, `e2e/inline-text-field.spec.ts`

### UIC-INLINE-TEXT-FIELD-1.3 - Cancelling

Escape shall put the draft back to `value` and call `onCancel`, so leaving the field afterwards commits nothing, even when the host moves focus inside `onCancel` before the field renders the restored text.

Implementation: `src/components/inline-text-field/inline-text-field.tsx`
Verification: `src/components/inline-text-field/inline-text-field.test.tsx`, `e2e/inline-text-field.spec.ts`

### UIC-INLINE-TEXT-FIELD-1.4 - New values

A new `value` shall replace the draft while the reader has not changed it; a changed draft is kept until it is committed or cancelled.

Implementation: `src/components/inline-text-field/inline-text-field.tsx`
Verification: `src/components/inline-text-field/inline-text-field.test.tsx`

### UIC-INLINE-TEXT-FIELD-1.5 - Contained events

Key (`keydown`, `keypress`, `keyup`), clipboard (`paste`, `cut`, `copy`) and `drop` events shall stop at the field's element, through native listeners, so a host listening on an ancestor, such as a rich-text editor that selects its whole document on Ctrl+A or Cmd+A, deletes its node on Backspace or reads the clipboard as markup, never receives them. Select all therefore selects only the field's text, and a paste arrives as the input's plain text. Tab still reaches the host, for its focus order.

Implementation: `src/components/inline-text-field/inline-text-field.tsx`
Verification: `src/components/inline-text-field/inline-text-field.test.tsx`, `e2e/inline-text-field.spec.ts`

### UIC-INLINE-TEXT-FIELD-1.6 - Read only

`isReadOnly` shall make the input read only, publish `data-readonly` and commit or cancel nothing.

Implementation: `src/components/inline-text-field/inline-text-field.tsx`
Verification: `src/components/inline-text-field/inline-text-field.test.tsx`

## Hooks

| Hook                   | Kind  | Values | Description                                 |
| ---------------------- | ----- | ------ | ------------------------------------------- |
| `ui-inline-text-field` | root  |        | The `<input>`.                              |
| `data-dirty`           | state | `true` | The draft differs from the committed value. |
| `data-readonly`        | state | `true` | The field is read only.                     |
