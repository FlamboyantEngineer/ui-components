# Comment Composer

`CommentComposer` is a plain-text box for writing a comment: a multi-line [Text Field](TEXT-FIELD.md) with submit and cancel buttons. It is the default composer of a [Comment Thread](COMMENT-THREAD.md) and the default editor of its comments; a host that needs mentions, attachments or rich text passes its own composer in their place. Its draft can be controlled, or kept in the provider storage across remounts.

## UIC-COMMENT-COMPOSER-1 - Contract

### UIC-COMMENT-COMPOSER-1.1 - Parts

`CommentComposer` shall render a `ui-comment-composer` element holding a multi-line `TextField` in the `ui-comment-composer__field` slot, growing from two rows with its text, then a `ui-comment-composer__actions` element with the cancel button when it applies ([UIC-COMMENT-COMPOSER-1.4](#uic-comment-composer-14---cancelling)) and a primary submit `Button` in `ui-comment-composer__submit`. The text box is named by `label`, by default the provider's `addComment` string, with no visible label, and hinted by `placeholder`, by default the label. The submit button reads `submitLabel`, by default the provider's `comment` string, publishes the `Ctrl+Enter` shortcut, and is disabled while the draft is blank.

Implementation: `src/components/comment-composer/comment-composer.tsx`, `src/core/strings/content.ts`
Verification: `src/components/comment-composer/comment-composer.test.tsx`, `e2e/comment-composer.spec.ts`

### UIC-COMMENT-COMPOSER-1.2 - Submitting

Pressing the submit button, or Ctrl+Enter or Command+Enter in the composer, shall call `onSubmit` once with the draft trimmed, then clear the draft. Enter alone starts a new line. A blank draft submits nothing. A key that belongs to an input method composition (pressed while composing, or reported with key code 229) shall neither submit nor cancel ([UIC-COMMENT-COMPOSER-1.4](#uic-comment-composer-14---cancelling)): the composer leaves it to the input method and to the surface around it, so an enclosing dialog does not close on it either.

Implementation: `src/components/comment-composer/comment-composer.tsx`, `src/utils/is-composing-key.ts`
Verification: `src/components/comment-composer/comment-composer.test.tsx`, `src/components/comment-composer/comment-composer-keys.test.tsx`, `e2e/comment-composer.spec.ts`

### UIC-COMMENT-COMPOSER-1.3 - Pending submits

When `onSubmit` returns a promise, the composer shall be pending until it settles: the root carries `data-pending`, the submit button shows its spinner and refuses presses, the chord submits nothing and there is no cancel. The text box stays editable. When the promise resolves, the composer shall clear the draft only if it is still the one submitted and still belongs to the same owner: text typed since stays, and where the key or the storage adapter changed, or the composer unmounted, only the stored draft it was submitted from clears, if it still holds that text, while the draft shown now is left alone and is not pending. A throw or a rejection keeps the draft, for the host to report the failure.

Implementation: `src/components/comment-composer/comment-composer.tsx`, `src/utils/use-draft-submission.ts`
Verification: `src/components/comment-composer/comment-composer.test.tsx`, `src/components/comment-composer/comment-composer-submit.test.tsx`, `e2e/comment-composer.spec.ts`

### UIC-COMMENT-COMPOSER-1.4 - Cancelling

A ghost `Button` in `ui-comment-composer__cancel`, reading the provider's `cancel` string, shall show while the draft is not blank, or always with `onCancel`, unless the composer is disabled or pending. Pressing it, or Escape in the composer while it shows, shall clear the draft and call `onCancel`. Escape with nothing to cancel is left to the surface around the composer, such as an overlay that closes on it.

Implementation: `src/components/comment-composer/comment-composer.tsx`
Verification: `src/components/comment-composer/comment-composer.test.tsx`, `e2e/comment-composer.spec.ts`

### UIC-COMMENT-COMPOSER-1.5 - Draft

The draft shall be controlled by `value` with `onChange`, which reports every edit; uncontrolled, it starts at `defaultValue` (empty by default). With `persistKey`, an uncontrolled draft is read from and written to the provider storage under that key ([UIC-PROVIDER-6.1](PROVIDER.md#uic-provider-61---storage-adapter)), so a composer mounted again resumes it.

Implementation: `src/components/comment-composer/comment-composer.tsx`
Verification: `src/components/comment-composer/comment-composer.test.tsx`, `e2e/comment-composer.spec.ts`

### UIC-COMMENT-COMPOSER-1.6 - Disabled

With `isDisabled`, the root shall carry `data-disabled`, the text box and the submit button shall be disabled and there is no cancel button, so nothing is typed, submitted or cancelled; Escape leaves the draft as it is.

Implementation: `src/components/comment-composer/comment-composer.tsx`
Verification: `src/components/comment-composer/comment-composer.test.tsx`, `e2e/comment-composer.spec.ts`

### UIC-COMMENT-COMPOSER-1.7 - Accessibility, hooks and caller attributes

The text box shall be the composer's only labelled control besides its buttons, and focus on mount with `autoFocus`. The composer shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its root.

Implementation: `src/components/comment-composer/comment-composer.tsx`
Verification: `src/components/comment-composer/comment-composer.test.tsx`, `e2e/comment-composer.spec.ts`

## Hooks

| Hook                           | Kind  | Values | Description                                       |
| ------------------------------ | ----- | ------ | ------------------------------------------------- |
| `ui-comment-composer`          | root  |        | The composer.                                     |
| `ui-comment-composer__field`   | slot  |        | The multi-line text field (also `ui-text-field`). |
| `ui-comment-composer__actions` | slot  |        | The row of buttons under the text box.            |
| `ui-comment-composer__cancel`  | slot  |        | The cancel button (also `ui-button`).             |
| `ui-comment-composer__submit`  | slot  |        | The submit button (also `ui-button`).             |
| `data-pending`                 | state | `true` | A submit is in progress.                          |
| `data-disabled`                | state | `true` | The composer refuses typing and submitting.       |
