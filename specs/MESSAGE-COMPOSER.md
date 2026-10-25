# Message Composer

`MessageComposer` writes a chat message or a comment: a text area that grows with its text and sends on Enter (Shift+Enter breaks the line) or on Ctrl+Enter, with the message's attachments above it, the caller's tools and a send button below it, completions such as `@` mentions ([Completion List](COMPLETION-LIST.md)), and a pending state that turns Send into Stop while a reply streams. It sits below a [Chat Transcript](CHAT-TRANSCRIPT.md) or a comment thread.

## UIC-MESSAGE-COMPOSER-1 - Composing

### UIC-MESSAGE-COMPOSER-1.1 - Text area

`MessageComposer` shall render a `ui-message-composer` root holding a React Aria text area (`ui-message-composer__input`) with the text, controlled by `value` with `onChange` or starting at `defaultValue`, and the caller's `placeholder` and `maxLength` (a native limit on the characters it holds). The text area grows with its text from `minRows` (1 by default) to `maxRows` (8 by default) rows of its line height, then scrolls.

Implementation: `src/components/message-composer/message-composer.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/utils/use-auto-grow.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.2 - Sending

The send button (`ui-message-composer__action`, an `Button` with the `send` glyph named by the provider string `send`) and the submit chord shall call `onSubmit` with the text and then empty the composer (through `onChange` when it is controlled). With `submitShortcut="Enter"` (the default) Enter sends and Shift+Enter breaks the line; with `Ctrl+Enter`, Ctrl+Enter or Cmd+Enter sends and Enter breaks the line. The chord shows in the button's tooltip and `aria-keyshortcuts`. Blank text is not sent, and the button is disabled (`aria-disabled`, staying focusable so focus survives the switch from Stop), unless `allowsEmptySubmit` is set, as when attachments carry the message. The submit chord never breaks the line, and an Enter that confirms an input method composition does not send. Pressing the button keeps focus in the text area.

Implementation: `src/components/message-composer/message-composer.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/core/glyphs.tsx`, `src/core/content-strings.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.3 - Pending and stopping

While `isPending`, the root shall publish `data-pending` and the composer sends nothing, while the text stays editable for the next message. With `onStop`, the same button becomes Stop (the `stop` glyph, named by the provider string `stop`) and calls `onStop`, so keyboard focus on it stays put; without `onStop` it shows the pending spinner.

Implementation: `src/components/message-composer/message-composer.tsx`, `src/components/message-composer/use-message-composer.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.4 - Disabled

With `isDisabled`, the root shall publish `data-disabled`, the text area is natively disabled, and the button is disabled.

Implementation: `src/components/message-composer/message-composer.tsx`, `src/components/message-composer/use-message-composer.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`

### UIC-MESSAGE-COMPOSER-1.5 - Attachments and tools

`attachments` shall render above the text area in `ui-message-composer__attachments`, and `toolbar` before the button in `ui-message-composer__toolbar`, inside the row below the text area (`ui-message-composer__footer`).

Implementation: `src/components/message-composer/message-composer.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.6 - Completions

With `completions`, the text area shall autocomplete as a text input does (UIC-COMPLETION-LIST-2.2 to 2.4), with the list (also `ui-message-composer__completions`) opening against the composer's root, above it when there is more room there. While the list is open its keys come first, so Enter inserts a completion instead of sending. `renderCompletion` draws the options' content.

Implementation: `src/components/message-composer/message-composer.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/completion-list/text-completions.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

## UIC-MESSAGE-COMPOSER-2 - Attributes

### UIC-MESSAGE-COMPOSER-2.1 - Hooks and caller attributes

`MessageComposer` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root, and put its `ref`, focus and keyboard handlers on the text area. The caller's key handlers run for the keys the completion list and the submit chord do not use.

Implementation: `src/components/message-composer/message-composer.tsx`, `src/components/message-composer/use-message-composer.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`

### UIC-MESSAGE-COMPOSER-2.2 - Accessibility

The text area shall be named by `aria-label`, `aria-labelledby` or else the provider string `message`, and keep its text box role; the send and stop button is named by its command.

Implementation: `src/components/message-composer/use-message-composer.ts`, `src/core/content-strings.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

## Hooks

| Hook                               | Kind  | Values | Description                                                |
| ---------------------------------- | ----- | ------ | ---------------------------------------------------------- |
| `ui-message-composer`              | root  |        | The composer's frame.                                      |
| `ui-message-composer__attachments` | slot  |        | The attachments above the text.                            |
| `ui-message-composer__input`       | slot  |        | The text area.                                             |
| `ui-message-composer__footer`      | slot  |        | The row below the text: the tools and the button.          |
| `ui-message-composer__toolbar`     | slot  |        | The caller's tools.                                        |
| `ui-message-composer__action`      | slot  |        | The send or stop button (also `ui-button`).                |
| `ui-message-composer__completions` | slot  |        | The completion list's popover (also `ui-completion-list`). |
| `data-pending`                     | state | `true` | On the root: a reply is on its way.                        |
| `data-disabled`                    | state | `true` | On the root, and on the text area (React Aria): disabled.  |
| `data-focused`                     | state | `true` | On the text area: focused (React Aria).                    |
| `data-focus-visible`               | state | `true` | On the text area: focused from the keyboard (React Aria).  |
| `data-hovered`                     | state | `true` | On the text area: under the pointer (React Aria).          |
