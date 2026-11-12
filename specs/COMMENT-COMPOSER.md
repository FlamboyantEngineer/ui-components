# Comment Composer

`CommentComposer` is a plain-text box for writing a comment: a multi-line [Text Field](TEXT-FIELD.md) with submit and cancel buttons. It is the default composer of a [Comment Thread](COMMENT-THREAD.md) and the default editor of its comments. With `mentions`, `@` picks people from the host's search and they stay in the text as tokens; a host that needs attachments or rich text passes its own composer in its place. Its draft can be controlled, or kept in the provider storage across remounts.

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

## UIC-COMMENT-COMPOSER-2 - Mentions

### UIC-COMMENT-COMPOSER-2.1 - Suggestions

`mentions` shall come from `createCommentMentions({ search, serialize, parse })`, exported from its own entry point, `@flamboyantengineer/ui-components/comment-composer/rich`, because the text box it draws is the [Rich Message Composer](MESSAGE-COMPOSER.md)'s editor, on its optional peers; the package root and the `comment-composer` and `comment-thread` entry points stay without them ([UIC-MESSAGE-COMPOSER-4.1](MESSAGE-COMPOSER.md#uic-message-composer-41---entry-point-and-peers)). With `mentions`, the `ui-comment-composer__field` slot shall be that editor (a `ui-message-composer` element holding the `role="textbox"` input, named by `label`), in place of the `TextField`. Typing `@` at the start of a line or after a space shall ask `search` for the text typed after it, with an `AbortSignal` that aborts once the query changes, the list closes or the composer goes away, and show the people it answers in a listbox (`ui-message-composer__completions`, named by the provider's `suggestions` string) following the combobox pattern: the text box carries `aria-haspopup="listbox"` and `aria-autocomplete="list"`, `aria-controls` while the list is open and `aria-activedescendant` for the active option. Each option shows the person's avatar, name and `description`; while the search is pending the list says so, and a rejected search shows the provider's `actionFailed` string. Each typed character asks again, so the list filters as the reader types.

Implementation: `src/components/comment-composer/rich/comment-mention-field.tsx`, `src/components/message-composer/rich/rich-message-composer.tsx`, `src/components/message-composer/rich/use-rich-completions.ts`
Verification: `src/components/comment-composer/rich/comment-mention-field.test.tsx`, `e2e/comment-composer.spec.ts`

### UIC-COMMENT-COMPOSER-2.2 - Choosing a person

The arrows shall move the active option, wrapping, and Enter or Tab insert it, followed by a space, as one atomic chip (`ui-message-composer__pill` with `data-kind="trigger"`) that shows the person's name; Escape closes the list until the next edit or caret move, without cancelling the draft, and the next Escape cancels as usual. Backspace or Delete next to a chip removes it whole and announces the removal in a status region. Enter while the list is closed breaks the line, and Ctrl+Enter or Command+Enter submits (UIC-COMMENT-COMPOSER-1.2).

Implementation: `src/components/comment-composer/rich/comment-mention-field.tsx`, `src/components/message-composer/rich/rich-content.tsx`
Verification: `src/components/comment-composer/rich/comment-mention-field.test.tsx`, `e2e/comment-composer.spec.ts`

### UIC-COMMENT-COMPOSER-2.3 - Tokens in the text

The draft, `onChange` and `onSubmit` shall hold plain text in which each chip is the token `serialize` writes for its person, by default `serializeMention`'s `@[Name](id)`, which escapes `\`, `]` in the name and `\`, `)` in the id with a backslash. A `defaultValue`, `value` or stored draft is read back with `parse`, by default `parseMentions`, which splits text into `text` runs and `mention` segments (the raw token, `id` and `name`); each mention shows as a chip. `serialize` and `parse` let a host keep its own token format, as long as `parse` reads what `serialize` writes. While disabled, the editor refuses typing and asks `search` nothing; `autoFocus` focuses it on mount.

Implementation: `src/components/comment-composer/comment-mentions.ts`, `src/components/comment-composer/rich/comment-mention-field.tsx`
Verification: `src/components/comment-composer/comment-mentions.test.ts`, `src/components/comment-composer/rich/comment-mention-field.test.tsx`, `e2e/comment-composer.spec.ts`

### UIC-COMMENT-COMPOSER-2.4 - Mention kinds

A `MentionCandidate` shall carry an optional `kind`: `person` (the default), `group`, `assistant` or a kind of the host's own in lower-case letters, digits and hyphens, and a group may carry `count`, its number of members. The suggestion list shows a candidate's `description` followed by the provider's `mentionGroupCount` string for its `count` ("4 members"), joined by a middle dot. `serializeMention` writes a person as `@[Name](id)` and another kind as `@kind[Name](id)`, and throws an `Error` for a kind it could not read back; `parseMentions` reads both, giving each `mention` segment its `mentionKind`. Token text inside a code span (between equal runs of backticks) or after a backslash stays plain text, so a comment can quote a token literally, and the segments always join back into the text.

Implementation: `src/components/comment-composer/comment-mentions.ts`, `src/components/comment-composer/rich/comment-mention-field.tsx`, `src/core/strings/content.ts`
Verification: `src/components/comment-composer/comment-mentions.test.ts`, `src/components/comment-composer/rich/comment-mention-field.test.tsx`

## Hooks

| Hook                           | Kind  | Values | Description                                                                                                        |
| ------------------------------ | ----- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| `ui-comment-composer`          | root  |        | The composer.                                                                                                      |
| `ui-comment-composer__field`   | slot  |        | The multi-line text field (also `ui-text-field`), or with `mentions` the rich editor (also `ui-message-composer`). |
| `ui-comment-composer__actions` | slot  |        | The row of buttons under the text box.                                                                             |
| `ui-comment-composer__cancel`  | slot  |        | The cancel button (also `ui-button`).                                                                              |
| `ui-comment-composer__submit`  | slot  |        | The submit button (also `ui-button`).                                                                              |
| `data-pending`                 | state | `true` | A submit is in progress.                                                                                           |
| `data-disabled`                | state | `true` | The composer refuses typing and submitting.                                                                        |
