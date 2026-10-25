# Message Composer

`MessageComposer` writes a chat message or a comment: a text area that grows with its text and sends on Enter (Shift+Enter breaks the line) or on Ctrl+Enter, with a banner (the message being replied to or edited) and the message's attachments above it, the attach and emoji buttons, the caller's tools and a send button below it, completions such as `@` mentions ([Completion List](COMPLETION-LIST.md)), an edit mode with Save and Cancel, recall of earlier messages with the arrows, a draft kept in the provider's storage, and a pending state that turns Send into Stop while a reply streams. It sits below a [Chat Transcript](CHAT-TRANSCRIPT.md) or a comment thread.

`RichMessageComposer` is its rich mode, on [ProseMirror](https://prosemirror.net) and `@handlewithcare/react-prosemirror`, which stay optional peer dependencies: it is exported only from its own entry point, `@flamboyantengineer/ui-components/message-composer/rich`, so the package root and `MessageComposer` load without them. It shares the plain composer's frame, sending, attaching, editing, recall and draft, and adds mentions and commands as atomic pills, Markdown as typed with code blocks, and plain-text paste. It sends Markdown text with the pills' token ranges.

## UIC-MESSAGE-COMPOSER-1 - Composing

### UIC-MESSAGE-COMPOSER-1.1 - Text area

`MessageComposer` shall render a `ui-message-composer` root holding a React Aria text area (`ui-message-composer__input`) with the text, controlled by `value` with `onChange` or starting at `defaultValue`, and the caller's `placeholder` and `maxLength` (a native limit on the characters it holds). The text area grows with its text from `minRows` (1 by default) to `maxRows` (8 by default) rows of its line height, then scrolls.

Implementation: `src/components/message-composer/message-composer.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/use-composer-state.ts`, `src/utils/use-auto-grow.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.2 - Sending

The send button (`ui-message-composer__action`, an `IconButton` with the `send` glyph named by the provider string `send`) and the submit chord shall call `onSubmit` with the text and then empty the composer (through `onChange` when it is controlled). With `submitShortcut="Enter"` (the default) Enter sends and Shift+Enter breaks the line; with `Ctrl+Enter`, Enter breaks the line. Ctrl+Enter or Cmd+Enter sends with either chord. The chord shows in the button's tooltip and `aria-keyshortcuts`. Blank text is not sent, and the button is disabled (`aria-disabled`, staying focusable so focus survives the switch from Stop), unless `allowsEmptySubmit` is set, as when attachments carry the message. The submit chord never breaks the line, and a key that belongs to an input method composition (including the Enter some browsers report with key code 229 as it ends) does not send. Pressing the button keeps focus in the text area. The keys the composer uses have their default prevented and go no further.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/composer-tools.tsx`, `src/components/message-composer/composer-keys.ts`, `src/components/message-composer/use-composer-state.ts`, `src/core/glyphs.tsx`, `src/core/content-strings.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.3 - Pending and stopping

While `isPending`, the root shall publish `data-pending` and the composer sends nothing, while the text stays editable for the next message. With `onStop`, the same button becomes Stop (the `stop` glyph, named by the provider string `stop`) and calls `onStop`, so keyboard focus on it stays put; without `onStop` it shows the pending spinner.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/composer-tools.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.4 - Disabled

With `isDisabled`, the root shall publish `data-disabled`, the text area is natively disabled, the send, attach, emoji and Cancel buttons are disabled, and dropped or pasted files are ignored.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/use-message-composer.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`

### UIC-MESSAGE-COMPOSER-1.5 - Attachments and tools

`attachments` shall render above the text area in `ui-message-composer__attachments`, and `toolbar` before the button in `ui-message-composer__toolbar`, after the built-in attach and emoji buttons, inside the row below the text area (`ui-message-composer__footer`). The toolbar renders only when it holds a tool.

Implementation: `src/components/message-composer/composer-frame.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.6 - Completions

With `completions`, the text area shall autocomplete as a text input does (UIC-COMPLETION-LIST-2.2 to 2.4), with the list (also `ui-message-composer__completions`) opening against the composer's root, above it when there is more room there. While the list is open its keys come first, so Enter inserts a completion instead of sending and the arrows move through the list instead of recalling. `renderCompletion` draws the options' content.

Implementation: `src/components/message-composer/message-composer.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/completion-list/text-completions.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.7 - Touch screens

On a device whose primary pointer is coarse (the `(pointer: coarse)` media query, followed as it changes), Enter and Shift+Enter shall break the line and Ctrl+Enter or Cmd+Enter send, whatever `submitShortcut` says, so the on-screen keyboard's Enter key writes several lines and the send button sends; the button's tooltip and `aria-keyshortcuts` show `Ctrl+Enter`.

Implementation: `src/components/message-composer/composer-keys.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

## UIC-MESSAGE-COMPOSER-2 - Attributes

### UIC-MESSAGE-COMPOSER-2.1 - Hooks and caller attributes

Both composers shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to their root, and put their `ref`, focus and keyboard handlers on the input (the text area, or the rich composer's text box). The caller's key handlers run for the keys the completion list and the composer (UIC-MESSAGE-COMPOSER-1.2, 3.3 to 3.5, 4.3, 4.5) do not use.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/rich/rich-content.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`

### UIC-MESSAGE-COMPOSER-2.2 - Accessibility

The input shall be named by `aria-label`, `aria-labelledby` or else the provider string `message`, and keep its text box role; the send and stop button is named by its command, and the built-in tools by the provider strings `attachFiles`, `insertEmoji`, `save` and `cancel`.

Implementation: `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/composer-tools.tsx`, `src/core/content-strings.ts`, `src/core/composer-strings.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

## UIC-MESSAGE-COMPOSER-3 - Conversations

### UIC-MESSAGE-COMPOSER-3.1 - Banner

`banner` shall render first in the composer, above the attachments and the input, in `ui-message-composer__banner`, for the message being replied to or edited.

Implementation: `src/components/message-composer/composer-frame.tsx`
Verification: `src/components/message-composer/composer-frame.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-3.2 - Attaching files

With `onAttach`, the toolbar shall start with an attach button (`ui-message-composer__attach`, the `attach` glyph, named by the provider string `attachFiles`) that opens the system file chooser for several files, and `onAttach` receives the chosen files. Files dragged onto the composer and dropped there, and files pasted into the input, reach `onAttach` too, instead of the input: while a drag that carries files is over the composer, its root publishes `data-drop-target`. Drags and pastes of text are left to the input. The caller renders the attached files in `attachments`.

Implementation: `src/components/message-composer/composer-tools.tsx`, `src/components/message-composer/use-file-drop.ts`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/rich/rich-editor.tsx`, `src/core/glyphs.tsx`, `src/core/composer-strings.ts`
Verification: `src/components/message-composer/composer-frame.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-3.3 - Edit mode

While `editValue` is set, the composer shall edit that message: the input shows it in place of the draft (starting again from each new `editValue`), the root publishes `data-editing`, the action button becomes Save (the `save` glyph, named by the provider string `save`) with the same chord, and a Cancel button before it (`ui-message-composer__cancel`, named by the provider string `cancel`) and Escape call `onCancel`. Saving calls `onSubmit` with the edited message and leaves the draft as it was; clearing `editValue` shows the draft again. The completion list's Escape comes first.

Implementation: `src/components/message-composer/use-composer-state.ts`, `src/components/message-composer/composer-keys.ts`, `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/composer-tools.tsx`
Verification: `src/components/message-composer/use-composer-state.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-3.4 - Editing the last message

With `onEditLast`, the Up arrow (without modifiers) in an empty composer that is not editing shall call `onEditLast`, so the host can start editing the reader's last message; elsewhere the arrows move the caret.

Implementation: `src/components/message-composer/use-composer-state.ts`, `src/components/message-composer/composer-keys.ts`
Verification: `src/components/message-composer/use-composer-state.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-3.5 - Recalling earlier messages

With `history` (the reader's earlier messages, oldest first) and without `onEditLast`, the Up arrow in an empty composer shall show the newest entry with the caret at its end, and each further Up an older one, staying on the oldest; Down shows newer entries and, past the newest, empties the composer again. The arrows recall only while the composer is empty or shows a recalled entry the reader has not changed: once the reader edits it, the arrows move the caret. A recalled entry becomes the draft (through `onChange`), and the rich composer reads it as Markdown text without pills.

Implementation: `src/components/message-composer/use-composer-state.ts`, `src/components/message-composer/composer-keys.ts`
Verification: `src/components/message-composer/use-composer-state.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-3.6 - Draft

With `persistKey`, the uncontrolled draft (its text and the rich composer's tokens, stored as the message's JSON so both composers read it) shall be kept in the provider's storage under that key as the reader writes: the composer starts from the stored draft (else `defaultValue`), reads the draft of a new key when the key changes, and stores the emptied draft after sending. A stored value that is not a message is ignored. Editing leaves the stored draft alone.

Implementation: `src/components/message-composer/use-composer-state.ts`, `src/components/message-composer/composer-message.ts`, `src/core/provider.tsx`
Verification: `src/components/message-composer/use-composer-state.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-3.7 - Emoji

With `showEmojiPicker`, the toolbar shall hold an emoji button (`ui-message-composer__emoji`, the `emoji` glyph, named by the provider string `insertEmoji`) that opens an [Emoji Picker](EMOJI-PICKER.md) in a popover. The chosen emoji (a custom emoji as its `:shortcode:`) replaces the input's selection, and once the picker has closed and given focus back to the button, focus returns to the input with the caret after the emoji.

Implementation: `src/components/message-composer/composer-tools.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/rich/rich-content.tsx`, `src/utils/use-focus-handback.ts`, `src/core/composer-strings.ts`
Verification: `src/components/message-composer/composer-frame.test.tsx`, `e2e/message-composer.spec.ts`

## UIC-MESSAGE-COMPOSER-4 - Rich mode

### UIC-MESSAGE-COMPOSER-4.1 - Entry point and engine

`RichMessageComposer` shall be exported only from `@flamboyantengineer/ui-components/message-composer/rich`, with its prop and message types; only modules under `src/components/message-composer/rich/` import ProseMirror and `@handlewithcare/react-prosemirror`, so neither the package root nor `MessageComposer` loads them and applications without the rich mode install none of them. No public declaration exposes their types. The host stylesheet gives the input ProseMirror's required rules, as the reference partial does.

Implementation: `src/components/message-composer/rich/index.ts`, `src/components/message-composer/rich/rich-message-composer.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`

### UIC-MESSAGE-COMPOSER-4.2 - Rich text box

`RichMessageComposer` shall render the plain composer's frame (UIC-MESSAGE-COMPOSER-1.2 to 1.5, 1.7, 3.1 to 3.7) around an editable multi-line text box (`ui-message-composer__input`, role `textbox`, `aria-multiline="true"`, named as UIC-MESSAGE-COMPOSER-2.2 says) that publishes React Aria's `data-focused`, `data-focus-visible`, `data-hovered` and `data-disabled`, and grows from `minRows` to `maxRows` rows of its line height, then scrolls. Its value is a message, `{ text, tokens }`: Markdown text with a line per paragraph, code blocks between ``` fences, and pills as their text (`@`or`/`and the label), with each pill's range, kind, id and label in`tokens`; it is controlled by `value`with`onChange`or starts at`defaultValue`, and `editValue`is a message too. While the text box is empty its first line carries`ui-message-composer\_\_placeholder`and`data-placeholder`with`placeholder`, which the text box also exposes as `aria-placeholder`. With `isDisabled`the text box is not editable and carries`aria-disabled`.

Implementation: `src/components/message-composer/rich/rich-message-composer.tsx`, `src/components/message-composer/rich/rich-editor.tsx`, `src/components/message-composer/rich/rich-content.tsx`, `src/components/message-composer/rich/composer-schema.ts`, `src/components/message-composer/rich/composer-markdown.ts`
Verification: `src/components/message-composer/rich/rich-message-composer.test.tsx`, `src/components/message-composer/rich/composer-markdown.test.ts`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-4.3 - Pills

Mentions and commands shall sit in the text as atomic pills (`ui-message-composer__pill`, `data-kind` `mention` or `command`): inline nodes that cannot be edited inside, that the caret steps over, whose text (`@Maria Santos`, `/summarize`) assistive technology reads as their label. Backspace right after a pill, or Delete right before it, removes the whole pill at once and announces "Maria Santos removed" (the provider string `removedFromMessage`) in a polite status.

Implementation: `src/components/message-composer/rich/composer-schema.ts`, `src/components/message-composer/rich/composer-commands.ts`, `src/components/message-composer/rich/rich-content.tsx`, `src/core/composer-strings.ts`
Verification: `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-4.4 - Mention and command completions

With `mentions` (`{ id, label, description?, src?, initials?, colorKey? }`) or `commands` (`{ id, label, description? }`), typing `@` or `/` at the start of a line or after a space, outside a code block, shall open the composer's completion list (`ui-message-composer__completions`, against the root as UIC-MESSAGE-COMPOSER-1.6 says) with the mentions or the commands whose label matches the query typed after the trigger (UIC-COMPLETION-LIST-2.1, keeping a label equal to the query; all of them for an empty query), mentions drawn as a `UserIdentity` and commands as `/label` with their description. It opens only while the text box has focus. Its keys follow UIC-COMPLETION-LIST-2.3 without Ctrl+Space: the arrows move the active option, wrapping, Enter or Tab insert it as a pill followed by a space in place of the trigger and query, and Escape closes the list until the next edit or caret move. The text box autocompletes from a list (`aria-autocomplete`, `aria-haspopup`, and while open `aria-controls` and `aria-activedescendant`). A chosen command is sent as a command token for the host to act on.

Implementation: `src/components/message-composer/rich/use-rich-completions.ts`, `src/components/message-composer/rich/rich-content.tsx`
Verification: `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-4.5 - Code blocks

Typing ``` at the start of a line shall turn it into a code block (`ui-message-composer\_\_code-block`, a `pre`), which Backspace right after typing turns back into the backticks. In a code block, Enter and Shift+Enter add a line and keep every space; Ctrl+Enter or Cmd+Enter sends; the Down arrow at the end of the last code block leaves it for a new line below, where the chord sends again; Backspace in an empty code block turns it back into a line. Pills and completions do not occur in code.

Implementation: `src/components/message-composer/rich/composer-commands.ts`, `src/components/message-composer/rich/rich-content.tsx`
Verification: `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-4.6 - Markdown shortcuts

The composer shall have no toolbar and no formatting: the text is Markdown as typed. Ctrl+B (Cmd+B) wraps the selection in `**` and Ctrl+I (Cmd+I) in `_`, keeping the wrapped text selected, or puts a pair around the caret; in a code block they do nothing. Ctrl+Z (Cmd+Z) undoes and Ctrl+Shift+Z or Ctrl+Y redoes.

Implementation: `src/components/message-composer/rich/composer-commands.ts`
Verification: `src/components/message-composer/rich/rich-message-composer.test.tsx`

### UIC-MESSAGE-COMPOSER-4.7 - Paste

Pasted text shall go in as the clipboard's plain text, keeping every space, tab and line: in a code block as one run, elsewhere a line per paragraph. Pasted HTML becomes that plain text, without its formatting. Pasted files go to `onAttach` (UIC-MESSAGE-COMPOSER-3.2).

Implementation: `src/components/message-composer/rich/composer-commands.ts`, `src/components/message-composer/rich/rich-editor.tsx`
Verification: `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-4.8 - Sending

The send button and the submit chord (UIC-MESSAGE-COMPOSER-1.2 and 1.7) shall call `onSubmit` with the message, `{ text, tokens }`, and then empty the composer. During an input method composition the composer leaves every key to it (the Enter that confirms it never sends); otherwise keys go first to the open completion list, then Enter alone adds a line in a code block, then the composer's keys (the chord, Escape, the recall arrows, the pill keys), then the editor's own keys and the caller's handlers. Before each key the composer reads a selection change the editor has not heard of yet, so a key pressed right after a caret move acts at the new caret.

Implementation: `src/components/message-composer/rich/rich-content.tsx`, `src/components/message-composer/composer-keys.ts`
Verification: `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

## Hooks

| Hook                               | Kind      | Values               | Description                                                         |
| ---------------------------------- | --------- | -------------------- | ------------------------------------------------------------------- |
| `ui-message-composer`              | root      |                      | The composer's frame.                                               |
| `ui-message-composer__banner`      | slot      |                      | The line above everything else: the message replied to or edited.   |
| `ui-message-composer__attachments` | slot      |                      | The attachments above the text.                                     |
| `ui-message-composer__input`       | slot      |                      | The text area, or the rich composer's editable text box.            |
| `ui-message-composer__placeholder` | slot      |                      | Rich: the empty text box's first line, which shows the placeholder. |
| `ui-message-composer__pill`        | slot      |                      | Rich: a mention or command in the text.                             |
| `ui-message-composer__code-block`  | slot      |                      | Rich: a code block (`pre`).                                         |
| `ui-message-composer__footer`      | slot      |                      | The row below the text: the tools and the buttons.                  |
| `ui-message-composer__toolbar`     | slot      |                      | The attach and emoji buttons and the caller's tools.                |
| `ui-message-composer__attach`      | slot      |                      | The attach button (also `ui-icon-button`).                          |
| `ui-message-composer__emoji`       | slot      |                      | The emoji button (also `ui-icon-button`).                           |
| `ui-message-composer__cancel`      | slot      |                      | The Cancel button of edit mode (also `ui-icon-button`).             |
| `ui-message-composer__action`      | slot      |                      | The send, stop or save button (also `ui-icon-button`).              |
| `ui-message-composer__completions` | slot      |                      | The completion list's popover (also `ui-completion-list`).          |
| `data-pending`                     | state     | `true`               | On the root: a reply is on its way.                                 |
| `data-editing`                     | state     | `true`               | On the root: the composer edits a message.                          |
| `data-drop-target`                 | state     | `true`               | On the root: a drag carrying files is over the composer.            |
| `data-disabled`                    | state     | `true`               | On the root, and on the input (React Aria): disabled.               |
| `data-focused`                     | state     | `true`               | On the input: focused (React Aria).                                 |
| `data-focus-visible`               | state     | `true`               | On the input: focused from the keyboard (React Aria).               |
| `data-hovered`                     | state     | `true`               | On the input: under the pointer (React Aria).                       |
| `data-kind`                        | attribute | `mention`, `command` | On a pill: what it stands for.                                      |
| `data-placeholder`                 | attribute |                      | On the placeholder line: the placeholder text.                      |
