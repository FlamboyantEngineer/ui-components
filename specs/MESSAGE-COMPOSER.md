# Message Composer

`MessageComposer` writes a chat message or a comment: a text area that grows with its text and sends on the host's chords, which may differ while a reply runs (by default Enter sends, Shift+Enter breaks the line, and while a reply runs Enter queues and Ctrl+Enter sends at once), with a banner (the message being replied to or edited) and the message's attachments above it, a row of the host's controls below it, aligned at its start and end in any number and order (a "+" menu of the host's actions, the attach and emoji buttons, selects, toggles, a model picker, the send button), which shrink to their icons when the row is cramped, completions such as `@` mentions ([Completion List](COMPLETION-LIST.md)), an edit mode with Save and Cancel, recall of earlier messages with the arrows, a draft kept in the provider's storage, and a pending state that turns Send into Stop while a reply streams, or that queues and sends at once. It sits below a [Chat Transcript](CHAT-TRANSCRIPT.md) or a comment thread.

`RichMessageComposer` is its rich mode, on [ProseMirror](https://prosemirror.net) and `@handlewithcare/react-prosemirror`, which stay optional peer dependencies: it is exported only from its own entry point, `@flamboyantengineer/ui-components/message-composer/rich`, so the package root and `MessageComposer` load without them. It shares the plain composer's frame, sending, attaching, editing, recall and draft, and adds mentions and commands as atomic pills, record references as atomic record chips, Markdown as typed with code blocks, and plain-text paste. It sends Markdown text with the pills' token ranges.

## UIC-MESSAGE-COMPOSER-1 - Composing

### UIC-MESSAGE-COMPOSER-1.1 - Text area

`MessageComposer` shall render a `ui-message-composer` root holding a React Aria text area (`ui-message-composer__input`) with the text, controlled by `value` with `onChange` or starting at `defaultValue`, and the caller's `placeholder` and `maxLength` (a native limit on the characters it holds). The text area grows with its text from `minRows` (1 by default) to `maxRows` (8 by default) rows of its line height, then scrolls; it measures again when its width changes or fonts finish loading. While it measures, the box around the text area keeps its height, so a keystroke never gives a neighbour, such as a transcript above that follows its end, the composer's room for a moment, which would clamp that neighbour's scroll position and stop it following.

Implementation: `src/components/message-composer/message-composer.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/use-composer-state.ts`, `src/utils/use-auto-grow.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.2 - Sending

The send button (`ui-message-composer__action`, a `Button` with the `send` glyph named by the provider string `send`) and the sending chords shall call `onSubmit` with the text and then empty the composer (through `onChange` when it is controlled). `shortcuts` names the chords in [Shortcut](SHORTCUT.md) notation, each action as one chord or a list of chords that all do it (`Ctrl` is Command on macOS): `send` sends while no reply runs, and saves an edit (Enter and Ctrl+Enter by default); `queue` and `sendNow` apply while a reply runs ([UIC-MESSAGE-COMPOSER-3.10](#uic-message-composer-310---queueing-and-sending-now)). Each action takes its default on its own. A key press matches a chord exactly, with no other modifier held, and an Enter no chord takes breaks the line, so Shift+Enter breaks it by default. The first chord of the action that the state's sending uses shows in the button's tooltip and `aria-keyshortcuts`. Blank text is not sent, and the button is disabled (`aria-disabled`, staying focusable so focus survives the switch from Stop), unless `allowsEmptySubmit` is set, as when attachments carry the message. A key that belongs to an input method composition (`isComposing`, or the key code 229 some browsers report as it ends) is left to the input method: it does not send, cancel an edit (Escape) or recall a message (the arrows). Pressing the button keeps focus in the text area. The keys the composer uses have their default prevented and go no further.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/composer-tools.tsx`, `src/components/message-composer/composer-keys.ts`, `src/components/message-composer/use-composer-state.ts`, `src/components/shortcut/shortcut-match.ts`, `src/core/glyphs.tsx`, `src/core/strings/content.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.3 - Pending and stopping

While `isPending`, the root shall publish `data-pending` and the composer sends nothing (unless `allowsPendingSubmit`, [UIC-MESSAGE-COMPOSER-3.8](#uic-message-composer-38---sending-while-a-reply-is-pending)), while the text stays editable for the next message. With `onStop`, the same button becomes Stop (the `stop` glyph, named by the provider string `stop`) and calls `onStop`, so keyboard focus on it stays put; without `onStop` it shows the pending spinner.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/composer-tools.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.4 - Disabled

With `isDisabled`, the root shall publish `data-disabled`, the text area is natively disabled, the send and Cancel buttons and the built-in controls (the "+", attach and emoji buttons, selects and toggles) are disabled, and dropped or pasted files are ignored. An emoji picker open when the composer turns disabled closes for good ([UIC-EMOJI-PICKER-3.1](EMOJI-PICKER.md#uic-emoji-picker-31---popover)), and text or pills a control inserts while disabled are refused, in both the plain and the rich composer.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/rich/rich-message-composer.tsx`, `src/components/message-composer/composer-tools.tsx`, `src/components/message-composer/composer-menu.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`, `src/components/message-composer/composer-menu.test.tsx`, `src/components/message-composer/composer-insert-locking.test.tsx`

### UIC-MESSAGE-COMPOSER-1.5 - Attachments and controls

`attachments` shall render above the text area in `ui-message-composer__attachments`, and the row of controls (`ui-message-composer__footer`) below the text area: `startControls` in `ui-message-composer__start`, then `endControls` in `ui-message-composer__end`, each in its order, followed by the send button unless the host placed it ([UIC-MESSAGE-COMPOSER-6](#uic-message-composer-6---controls)).

Implementation: `src/components/message-composer/composer-frame.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`, `src/components/message-composer/composer-menu.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.6 - Completions

With `completions`, the text area shall autocomplete as a text input does (UIC-COMPLETION-LIST-2.2 to 2.4), with the list (also `ui-message-composer__completions`) opening against the composer's root, above it when there is more room there. While the list is open its keys come first, so Enter inserts a completion instead of sending and the arrows move through the list instead of recalling. `renderCompletion` draws the options' content.

Implementation: `src/components/message-composer/message-composer.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/completion-list/text-completions.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-1.7 - Touch screens

On a device whose primary pointer is coarse (the `(pointer: coarse)` media query, followed as it changes), a bare Enter shall break the line whatever `shortcuts` says, so the on-screen keyboard's Enter key writes several lines and the send button sends; the other chords keep working. When that leaves `send` without a chord, Ctrl+Enter sends, so by default Ctrl+Enter or Cmd+Enter sends and the button's tooltip and `aria-keyshortcuts` show `Ctrl+Enter`. While a reply runs, the default `queue` chord is then the button alone, and Ctrl+Enter sends at once.

Implementation: `src/components/message-composer/composer-keys.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `e2e/message-composer.spec.ts`

## UIC-MESSAGE-COMPOSER-2 - Attributes

### UIC-MESSAGE-COMPOSER-2.1 - Hooks and caller attributes

Both composers shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to their root, and put their `ref`, focus and keyboard handlers on the input (the text area, or the rich composer's text box). The text area's `ref` stays attached across renders: a callback ref is called again only when the caller passes a new one. The caller's key handlers run for the keys the completion list and the composer (UIC-MESSAGE-COMPOSER-1.2, 3.3 to 3.5, 4.3, 4.5) do not use.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/rich/rich-content.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`

### UIC-MESSAGE-COMPOSER-2.2 - Accessibility

The input shall be named by `aria-label`, `aria-labelledby` or else the provider string `message`, and keep its text box role; the send and stop button is named by its command, and the built-in controls by the provider strings `attachFiles`, `insertEmoji`, `composerMenu` (the menu's "+" button), `save` and `cancel`.

Implementation: `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/composer-tools.tsx`, `src/components/message-composer/composer-menu.tsx`, `src/core/strings/content.ts`, `src/core/strings/composer.ts`
Verification: `src/components/message-composer/message-composer.test.tsx`, `src/components/message-composer/composer-menu.test.tsx`, `e2e/message-composer.spec.ts`

## UIC-MESSAGE-COMPOSER-3 - Conversations

### UIC-MESSAGE-COMPOSER-3.1 - Banner

`banner` shall render first in the composer, above the attachments and the input, in `ui-message-composer__banner`, for the message being replied to or edited.

Implementation: `src/components/message-composer/composer-frame.tsx`
Verification: `src/components/message-composer/composer-frame.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-3.2 - Attaching files

`MessageComposerAttachButton`, placed among the controls, shall render an attach button (`ui-message-composer__attach`, the `attach` glyph, named by the provider string `attachFiles`) that opens the system file chooser for several files, and the composer's `onAttach` receives the chosen files; without `onAttach` it renders nothing. A "+" menu item can open the chooser instead, through the `attachFiles` helper ([UIC-MESSAGE-COMPOSER-5.3](#uic-message-composer-53---actions)). Files dragged onto the composer and dropped there, and files pasted into the input, reach `onAttach` too, instead of the input: while a drag that carries files is over the composer, its root publishes `data-drop-target`. Drags and pastes of text are left to the input. The caller renders the attached files in `attachments`.

Implementation: `src/components/message-composer/composer-tools.tsx`, `src/components/message-composer/use-file-drop.ts`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/rich/rich-editor.tsx`, `src/core/glyphs.tsx`, `src/core/strings/composer.ts`
Verification: `src/components/message-composer/composer-frame.test.tsx`, `src/components/message-composer/composer-menu.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-3.3 - Edit mode

While `editValue` is set, the composer shall edit that message: the input shows it in place of the draft (starting again from each new `editValue` object, so a host restarts the edit for another message with equal words by passing a new object), the root publishes `data-editing`, the action button becomes Save (the `save` glyph, named by the provider string `save`) with the same chord, and a Cancel button before it (`ui-message-composer__cancel`, named by the provider string `cancel`) and Escape call `onCancel`. Saving calls `onSubmit` with the edited message and leaves the draft as it was; clearing `editValue` shows the draft again. The completion list's Escape comes first.

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

With `persistKey`, the uncontrolled draft (its text and the rich composer's tokens, stored as the message's JSON so both composers read it) shall be kept in the provider's storage under that key as the reader writes: the draft itself changes with each keystroke, while storage hears of it once typing pauses for `DRAFT_WRITE_DELAY` (300 ms) and at once when focus leaves the input, the key changes, the composer unmounts or the page hides ([UIC-PROVIDER-6.3](PROVIDER.md#uic-provider-63---delayed-writes)), so typing makes no storage write per key press. The composer starts from the stored draft (else `defaultValue`), reads the draft of a new key when the key changes, and stores the emptied draft after sending. A stored value that is not a message is ignored. Editing leaves the stored draft alone. The rich composer's undo history, selection and completion state belong to the draft's owner, its `persistKey`, the provider's storage and the message being edited: another owner starts them afresh even when its text equals the text shown, so undo never brings back another draft's text, while renders under the same owner keep them.

Implementation: `src/components/message-composer/use-composer-state.ts`, `src/components/message-composer/composer-message.ts`, `src/core/provider.tsx`
Verification: `src/components/message-composer/use-composer-state.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-3.7 - Emoji

`MessageComposerEmojiButton`, placed among the controls, shall render an emoji button (`ui-message-composer__emoji`, the `emoji` glyph, named by the provider string `insertEmoji`) that opens an [Emoji Picker](EMOJI-PICKER.md) in a popover. The chosen emoji (a custom emoji as its `:shortcode:`) replaces the input's selection, and once the picker has closed and given focus back to the button, focus returns to the input with the caret after the emoji.

Implementation: `src/components/message-composer/composer-tools.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/rich/rich-content.tsx`, `src/utils/use-focus-handback.ts`, `src/core/strings/composer.ts`
Verification: `src/components/message-composer/composer-frame.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-3.8 - Sending while a reply is pending

With `allowsPendingSubmit`, a pending composer shall send as it does when not pending (the `queue` chords and the button), for a host that queues the message until the reply ends. Its one action button is then Send (without the pending spinner) while there is something to send, and Stop (with `onStop`) while there is not, so keyboard focus on it stays put as it switches.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/rich/rich-message-composer.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`

### UIC-MESSAGE-COMPOSER-3.9 - Accepting a message

`onSubmit` may return a promise that settles once the host accepts the message or refuses it. While it is pending, the root publishes `data-submitting`, the action button is disabled (`aria-disabled`, staying focusable) and the composer sends nothing more from the same draft, however often the reader presses it or the chord; the text stays editable. Once the promise resolves, the draft empties (through `onChange` when it is controlled) unless the reader has changed it since, even back to the words sent: those words are a newer message. When it rejects, or `onSubmit` throws, the message stays, the composer may send again, and `onSubmitError` receives the error (without `onSubmitError` the error is rethrown). With `persistKey`, a message belongs to the draft it was sent from, which the key and the provider's storage adapter name together (a controlled draft, held by the host, only by its key): under another key or another adapter the composer is not held, even where that draft holds the same text, and once the message is accepted the draft that is shown now empties only if it is the one the message was sent from and still holds that message; otherwise only the stored draft it was sent from empties, in the adapter it was sent from, if it still holds that message. A composer that unmounts while its message waits settles the same way, emptying only that stored draft. A refusal keeps every draft and still goes to `onSubmitError`. An `onSubmit` that returns nothing is accepted at once. An edit settles the same way, and stays for the host to end.

Implementation: `src/utils/use-draft-submission.ts`, `src/components/message-composer/use-composer-state.ts`, `src/components/message-composer/composer-frame.tsx`
Verification: `src/components/message-composer/use-submission.test.tsx`

### UIC-MESSAGE-COMPOSER-3.10 - Queueing and sending now

While `isPending`, the composer shall answer to the `queue` and `sendNow` chords of `shortcuts` instead of `send` (an edit still saves with `send`): `queue` (Enter by default) sends through `onSubmit` as [UIC-MESSAGE-COMPOSER-3.8](#uic-message-composer-38---sending-while-a-reply-is-pending) says, for the host to queue, and `sendNow` (Ctrl+Enter by default) calls `onSubmitNow` with the message, for a host that stops the reply and sends the message ahead of its queue. A chord in both lists queues. `onSubmitNow` sends while pending even without `allowsPendingSubmit`, settles as `onSubmit` does ([UIC-MESSAGE-COMPOSER-3.9](#uic-message-composer-39---accepting-a-message)) and empties the composer; it sends nothing blank (unless `allowsEmptySubmit`), while editing, while disabled or while a sent message waits for acceptance. Without `onSubmitNow`, the `sendNow` chords send as `queue` does. Once no reply runs, only `send` sends.

Implementation: `src/components/message-composer/composer-keys.ts`, `src/components/message-composer/use-composer-state.ts`, `src/utils/use-draft-submission.ts`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/rich/rich-message-composer.tsx`
Verification: `src/components/message-composer/message-composer.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

## UIC-MESSAGE-COMPOSER-4 - Rich mode

### UIC-MESSAGE-COMPOSER-4.1 - Entry point and engine

`RichMessageComposer` shall be exported only from `@flamboyantengineer/ui-components/message-composer/rich`, with its prop and message types; only modules under `src/components/message-composer/rich/` import ProseMirror and `@handlewithcare/react-prosemirror`, so neither the package root nor `MessageComposer` loads them and applications without the rich mode install none of them. `Chat`, which composes the rich mode, is likewise exported only from its own entry point ([UIC-CHAT-1.1](CHAT.md#uic-chat-11---entry-point)). No public declaration exposes their types. The host stylesheet gives the input ProseMirror's required rules, as the reference partial does.

Only four entry points reach the optional peers (`@handlewithcare/react-prosemirror`, `react-reconciler` and the `prosemirror-*` packages): `/rich-text-editor`, `/message-composer/rich`, `/chat` and `/comment-composer/rich`, whose comment mentions draw the rich editor alone (`RichMessageField`, the editor without the composer's frame, keys or sending; [UIC-COMMENT-COMPOSER-2.1](COMMENT-COMPOSER.md#uic-comment-composer-21---suggestions)); the package root, `/core` and every other entry point reach none. `prosemirror-view` is the only exact peer (and development) version because `@handlewithcare/react-prosemirror` itself requires that exact version; the pins move together with the React view.

Implementation: `src/components/message-composer/rich/index.ts`, `src/components/message-composer/rich/rich-message-composer.tsx`, `package.json`, `README.md`
Verification: `src/components/message-composer/message-composer.test.tsx`, `test/package.test.ts`

### UIC-MESSAGE-COMPOSER-4.2 - Rich text box

`RichMessageComposer` shall render the plain composer's frame (UIC-MESSAGE-COMPOSER-1.2 to 1.5, 1.7, 3.1 to 3.7) around an editable multi-line text box (`ui-message-composer__input`, role `textbox`, `aria-multiline="true"`, named as UIC-MESSAGE-COMPOSER-2.2 says) that publishes React Aria's `data-focused`, `data-focus-visible`, `data-hovered` and `data-disabled`, and grows from `minRows` to `maxRows` rows of its line height, then scrolls. Its value is a message, `{ text, tokens }`: Markdown text with a line per paragraph, code blocks between backtick fences (three, or one more than the longest run of backticks in the code, so a fence inside the code never closes the block, however many runs the code holds; reading, a line of at least the opening fence's backticks closes it, as in CommonMark, and an opener no line closes stays text; reading takes time linear in the text's lines and tokens, however many fences stay open), and pills as their text (`@`or`/`and the label), with each pill's range, kind, id and label in`tokens`; it is controlled by `value`with`onChange`or starts at`defaultValue`, and `editValue`is a message too. While the text box is empty its first line carries`ui-message-composer\_\_placeholder`and`data-placeholder`with`placeholder`, which the text box also exposes as `aria-placeholder`. With `isDisabled`the text box is not editable and carries`aria-disabled`.

Implementation: `src/components/message-composer/rich/rich-message-composer.tsx`, `src/components/message-composer/rich/rich-editor.tsx`, `src/components/message-composer/rich/rich-content.tsx`, `src/components/message-composer/rich/composer-schema.ts`, `src/components/message-composer/rich/composer-markdown.ts`
Verification: `src/components/message-composer/rich/rich-message-composer.test.tsx`, `src/components/message-composer/rich/composer-markdown.test.ts`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-4.3 - Pills

Mentions, commands, record references and host trigger entries ([UIC-MESSAGE-COMPOSER-4.13](#uic-message-composer-413---host-triggers)) shall sit in the text as atomic pills (`ui-message-composer__pill`, `data-kind` `mention`, `command`, `reference` or `trigger`): inline nodes that cannot be edited inside, that the caret steps over, whose text (`@Maria Santos`, `/summarize`) assistive technology reads as their label; a reference's pill holds its record chip ([UIC-MESSAGE-COMPOSER-4.9](#uic-message-composer-49---record-references)). Undo and redo restore and remove pills like any other edit. Backspace right after a pill, or Delete right before it, removes the whole pill at once and announces "Maria Santos removed" (the provider string `removedFromMessage`) in a polite status.

Implementation: `src/components/message-composer/rich/composer-schema.ts`, `src/components/message-composer/rich/composer-pill.tsx`, `src/components/message-composer/rich/composer-commands.ts`, `src/components/message-composer/rich/rich-content.tsx`, `src/core/strings/composer.ts`
Verification: `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-4.4 - Mention and command completions

With `mentions` (`{ id, label, description?, src?, initials?, colorKey? }`) or `commands` (`{ id, label, description? }`), typing `@` or `/` at the start of a line or after a space, outside a code block, shall open the composer's completion list (`ui-message-composer__completions`, against the root as UIC-MESSAGE-COMPOSER-1.6 says) with the mentions or the commands whose label matches the query typed after the trigger (UIC-COMPLETION-LIST-2.1, keeping a label equal to the query; all of them for an empty query), mentions drawn as a `UserIdentity` and commands as `/label` with their description. It opens only while the text box has focus. Its keys follow UIC-COMPLETION-LIST-2.3 without Ctrl+Space: the arrows move the active option, wrapping, Enter or Tab insert it as a pill followed by a space in place of the trigger and query once the list is on screen (UIC-COMPLETION-LIST-2.8), and Escape closes the list until the next edit, caret move or Tab. The text box autocompletes from a list (`aria-autocomplete`, `aria-haspopup`, and while open `aria-controls` and `aria-activedescendant`). A chosen command is sent as a command token for the host to act on.

Implementation: `src/components/message-composer/rich/use-rich-completions.ts`, `src/components/message-composer/rich/rich-content.tsx`
Verification: `src/components/message-composer/rich/rich-message-composer.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-4.5 - Code blocks

Typing ``` at the start of a line shall turn it into a code block (`ui-message-composer\_\_code-block`, a `pre`), which Backspace right after typing turns back into the backticks. In a code block, Enter and Shift+Enter add a line and keep every space, and only a sending chord with Ctrl or Cmd (Ctrl+Enter by default) sends; the Down arrow at the end of the last code block leaves it for a new line below, where the chord sends again; Backspace in an empty code block turns it back into a line. Pills and completions do not occur in code.

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

### UIC-MESSAGE-COMPOSER-4.9 - Record references

A token of kind `reference` shall stand for a record the host names: `id` is its opaque identity, `label` the text the reference shows (in the message's text, without a trigger character), and the optional `recordType` the host's kind or scope for it. The composer neither reads nor fetches the record. Its pill draws a [Record Label](RECORD-LABEL.md) chip whose identifier is the label, with what `getReference({ id, label, recordType })` returns for it each time it draws (its name, icon, link, kind, version, state, preview, or that it is missing or restricted, as [UIC-RECORD-LABEL-11](RECORD-LABEL.md#uic-record-label-11---contract) says); without `getReference`, or when it returns nothing, the chip shows only the label. A link reaches the record through the provider's link renderer, and the editor leaves presses and keys in the chip to it. While the composer is editable the chip has its remove button, which removes the reference and returns focus to the text box. References mix with text and other pills on any line, and a message of references alone is not blank. The message's tokens carry each reference's `id`, `label` and `recordType` through `onChange`, `onSubmit`, a failed send ([UIC-MESSAGE-COMPOSER-3.9](#uic-message-composer-39---accepting-a-message)), `editValue` and the stored draft ([UIC-MESSAGE-COMPOSER-3.6](#uic-message-composer-36---draft)), which ignores a stored message whose tokens have another kind or a `recordType` that is not text. In a code block, or in the plain composer, a reference goes in as its label. Copying from the text box copies the reference's label as plain text.

Implementation: `src/components/message-composer/composer-message.ts`, `src/components/message-composer/rich/composer-pill.tsx`, `src/components/message-composer/rich/composer-schema.ts`, `src/components/message-composer/rich/composer-markdown.ts`, `src/components/message-composer/rich/rich-editor.tsx`
Verification: `src/components/message-composer/rich/composer-pill.test.tsx`, `src/components/message-composer/rich/composer-markdown.test.ts`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-4.10 - Inserting from outside the composer

`handleRef` shall receive a `MessageComposerHandle` for the host's own controls, such as a "+" button beside a record in a sidebar. `insertToken({ kind, id, label, recordType? })` adds the token to the draft as a pill (a record reference as its chip, UIC-MESSAGE-COMPOSER-4.9), in one transaction that is an undo step of its own, without replacing anything: at the caret, or where the caret was when the text box lost focus; after the selection when there is one, keeping the selected text; at the end of the draft when the text box has had no caret since the draft was shown (on mount, after sending, recalling or a change of `persistKey`); and on a new line after a code block when the caret is in one. A space separates the pill from a word right before it, and one follows it unless a space does already. The text box then takes focus with the caret after the pill, and `onChange` reports the message. It returns `inserted`, or changes nothing and returns why: `disabled` with `isDisabled`, `editing` while `editValue` is set, `submitting` while a sent message waits for the host to accept it (UIC-MESSAGE-COMPOSER-3.9), or `unavailable` when the editor is not mounted. While a reply is pending the pill goes in as typing does. `getDraft()` returns the draft as it is now, `{ text, tokens }`, also while another message is being edited, so a host can tell which tokens the draft holds, and `getValue()` returns what the text box shows now: the message being edited while `editValue` is set, else the draft; removing a pill reports through `onChange` like any edit.

Implementation: `src/components/message-composer/rich/use-composer-handle.ts`, `src/components/message-composer/rich/composer-commands.ts`, `src/components/message-composer/rich/rich-content.tsx`
Verification: `src/components/message-composer/rich/use-composer-handle.test.tsx`

### UIC-MESSAGE-COMPOSER-4.11 - Selection and ranges

Both composers shall put `inputId` on their text box, apart from the root's `id`. The rich composer shall measure selections and ranges as `{ start, end }` offsets in the shown message's `text`, in UTF-16 code units, over the Markdown as sent: a line break between lines, a code block's fence lines, and each pill's whole raw text. A token is atomic: no caret stands inside it. A selection over the whole document (Ctrl or Cmd+A) measures as the whole text, from 0 to its length, whatever its first and last blocks are. The handle (UIC-MESSAGE-COMPOSER-4.10) adds the following:

- `getSelection()` returns the selection, or the caret as a collapsed range. It keeps the last selection while focus is in a menu or another control, and returns `null` without a mounted editor.
- `setSelection(range)` selects a range without taking focus. An end inside a pill moves out of it: the start to the pill's start, the end to its end, and a caret to the nearer side.
- `replaceRange(range, content)` replaces a range of the draft with plain text, or with a fragment `{ text, tokens }` whose tokens lie in the fragment's own text. A pill the range cuts is replaced whole. Fragment tokens outside the fragment or overlapping one another are dropped. A token on a line of a code block stays text. The replacement is one transaction and one undo step of its own. Undo restores the text and the tokens. Afterwards the caret stands after the new content, the text box takes focus and `onChange` reports the message.
- `replaceSelection(content)` does the same in place of the selection, or of the selection the text box had when it lost focus.
- `focus()` focuses the text box and keeps its selection.

`replaceRange` and `replaceSelection` change nothing and return why: `disabled`, `editing`, `submitting` or `unavailable`, as `insertToken` does. They return `invalid` for a range outside the text or out of order. Otherwise they return `applied`. `setSelection` returns only `applied`, `invalid` or `unavailable`.

`onSelectionChange` shall hear the selection in the same offsets whenever it moves: by the reader, an edit, the handle or a new value.

A value from outside (a controlled value that differs from the shown text, a host's projection of it, a recalled entry or a sent message) shall keep the selection's place in the text. Text before the change keeps its offset, text after it moves with the text, and a caret at the end stays at the end. A caret at an insertion follows the inserted text, and a caret inside text the value rewrote keeps its offset there. The history still starts afresh. Another draft owner (`persistKey`, storage or `editValue`) starts afresh with the caret at the end.

Implementation: `src/components/message-composer/rich/composer-offsets.ts`, `src/components/message-composer/rich/composer-edits.ts`, `src/components/message-composer/rich/use-composer-handle.ts`, `src/components/message-composer/rich/rich-editor.tsx`, `src/components/message-composer/rich/rich-content.tsx`, `src/components/message-composer/use-message-composer.ts`
Verification: `src/components/message-composer/rich/composer-edits.test.ts`, `src/components/message-composer/rich/composer-selection.test.tsx`, `e2e/message-composer-ranges.spec.ts`

### UIC-MESSAGE-COMPOSER-4.12 - Interceptable paste

With `onPaste`, pasted text (not files) shall go first to `onPaste({ text, range })`, with the range it replaces as UIC-MESSAGE-COMPOSER-4.11 measures it. The composer acts on the answer:

- `undefined`, or a handler that throws: the composer pastes the plain text itself (UIC-MESSAGE-COMPOSER-4.7).
- `null`: the paste is refused and nothing changes.
- A fragment `{ text, tokens }`: the fragment replaces the range, as `replaceRange` does.
- A promise: the plain text goes in at once, and the composer keeps the pasted text's range through later edits. A fragment the promise resolves to then replaces that text, as an undo step of its own that keeps the reader's selection where it maps. Undo brings back the pasted text.

A late answer changes nothing when any of these holds:

- The promise resolves to `null` or `undefined`, or rejects. A rejection is handled, never unhandled.
- The pasted text was changed or removed.
- The draft's owner changed, or a message was sent, recalled or edited.
- A value from outside replaced the document.
- The composer is disabled or submitting.
- The composer unmounted.

So a late answer never writes into another draft or conversation. However the promise settles, the composer stops keeping that paste's range, without an undo step of its own, so a long-lived draft holds no record of pastes that have settled.

Implementation: `src/components/message-composer/rich/composer-paste.ts`, `src/components/message-composer/rich/rich-editor.tsx`, `src/components/message-composer/rich/composer-commands.ts`
Verification: `src/components/message-composer/rich/composer-selection.test.tsx`, `src/components/message-composer/rich/composer-paste.test.ts`, `e2e/message-composer-ranges.spec.ts`

### UIC-MESSAGE-COMPOSER-4.13 - Host triggers

`triggers` shall add the host's own vocabularies beside `@` mentions and `/` commands. A trigger has these fields:

- `id`: the vocabulary's stable identity.
- `character`: the one character that opens it.
- `getCompletions(query, { signal })`: answers with entries at once or through a promise.
- `allowsSpaces` (optional): lets the query hold spaces.
- `getIcon(token)` (optional): the icon for its token chips.
- `label` (optional): names its list. The provider's `suggestions` string names it otherwise.

An entry has these fields:

- `id`: its opaque identity.
- `label`: shown in the list and on the chip.
- `text` (optional): the raw text the token stands for. It defaults to the character and the label.
- `description`, `icon` and `recordType` (optional).

A trigger whose character is `@` or `/` takes that character from `mentions` or `commands`. The vocabularies otherwise share one draft.

Typing a trigger's character at the start of a line or after a space, outside code, shall open the composer's completion list (UIC-MESSAGE-COMPOSER-4.4) for the query typed after it, up to the caret. The query ends at a pill, and at a space unless the trigger allows spaces.

The composer asks the source only while the list is wanted: the text box has focus and the list is not dismissed. It asks again whenever the query, the trigger (or its array) or the draft's owner changes, and when the list is wanted again after Escape (the next edit, caret move or Tab) or a return of focus, even for the same query. Each time, it aborts the `signal` of the question before. Escape, focus leaving the text box and unmounting abort the current question too, and its late answer never shows, not even once the list reopens. Pressing an option keeps focus, so the chosen entry stays. The answer is handled as follows:

- A synchronous answer shows at once.
- While a later answer is on its way, the list shows only the provider's `loading` string for that query, never an older query's options.
- An answer for a query that is no longer current is ignored, so answers arriving out of order never show. So is an answer that arrives after the caret left the query, the list was dismissed, focus left or the composer unmounted.
- A rejection or a synchronous throw shows the provider's `actionFailed` string, and nothing goes unhandled.
- An empty answer shows `noResults`.

While the list shows no option, Enter and Tab wait (so Enter does not send) and Escape closes the list. With options, the list's keys are those of UIC-MESSAGE-COMPOSER-4.4. Home, End and the side arrows stay with the caret, and moving the caret off the query closes the list. Pressing an option keeps the caret.

The chosen entry replaces the character and the query with a token, followed by a space: `kind` `trigger`, the trigger's `id` as `trigger`, the entry's `id` and `label`, and `recordType` when it has one. The token's range in the message's text covers the entry's raw `text`. Its pill (`data-kind="trigger"`, `data-trigger` the trigger's id) shows the trigger's icon (`ui-message-composer__pill-icon`) and the label, and stays atomic. Copying and sending use the raw text.

A stored or controlled message reads a `trigger` token back with the raw text its range covers. The list draws an entry's icon and description (UIC-COMPLETION-LIST-1.1). `mentions`, `commands`, record references and the plain composer's `completions` are unchanged.

Implementation: `src/components/message-composer/rich/composer-triggers.ts`, `src/components/message-composer/rich/use-rich-completions.ts`, `src/components/message-composer/rich/rich-content.tsx`, `src/components/message-composer/rich/composer-pill.tsx`, `src/components/message-composer/rich/composer-schema.ts`, `src/components/message-composer/rich/composer-markdown.ts`, `src/components/message-composer/composer-message.ts`
Verification: `src/components/message-composer/rich/composer-triggers.test.tsx`, `e2e/message-composer-ranges.spec.ts`

### UIC-MESSAGE-COMPOSER-4.14 - Field focus on mount

`RichMessageField` with `autoFocus` shall focus its editable once, as soon as the editor's view exists, even when the view mounts its editable after the field's own mount effects (a field opened on demand, or inside a host that renders it a render late). Without `autoFocus` it leaves focus where it is.

Implementation: `src/components/message-composer/rich/rich-message-composer.tsx`, `src/components/message-composer/rich/rich-content.tsx`
Verification: `src/components/message-composer/rich/rich-message-field.test.tsx`, `e2e/comment-composer.spec.ts`

## UIC-MESSAGE-COMPOSER-5 - Menu

### UIC-MESSAGE-COMPOSER-5.1 - Menu button

`MessageComposerMenuButton` (`sections`, `filterable?`), placed among either composer's controls, shall render a "+" button (`ui-message-composer__menu-button`, a `Button` with the `plus` glyph named by the provider string `composerMenu`). It is a menu button ([UIC-MENU-4.1](MENU.md#uic-menu-41---menu-trigger)) that opens the menu (`ui-message-composer__menu`, a [Menu](MENU.md) in a `MenuPopover`) above the composer, against its root and aligned with its start, as its completion list opens ([UIC-MESSAGE-COMPOSER-1.6](#uic-message-composer-16---completions)), or below it when there is no room above; Escape or a press outside closes it and focus returns to the button. Each of `sections` (`{ id, title, items }`) is a group under its `title` heading, holding its items in order, and the menu scrolls when it is taller than its room. The button is disabled with the composer, and the composer becoming disabled closes its open menu. Section and item ids are unique within the menu.

Implementation: `src/components/message-composer/composer-menu.tsx`, `src/components/message-composer/composer-controls.ts`, `src/core/glyphs.tsx`, `src/core/strings/composer.ts`, `labs/reference/message-composer.css`
Verification: `src/components/message-composer/composer-menu.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-5.2 - Items

Each item (`{ id, label, description?, icon?, shortcut?, isDisabled?, disabledReason?, isSelected?, onSelectedChange?, items?, onAction? }`) shall draw as a menu item ([UIC-MENU-2.1](MENU.md#uic-menu-21---anatomy)): its `icon` (an imported icon component or rendered element), its `label`, its `description` as a note after the label, and its `shortcut` as a hint for a key the host handles itself, its accessible name holding them all. An item with `items` opens a submenu of those items ([UIC-MENU-4.5](MENU.md#uic-menu-45---submenus)), also `ui-message-composer__menu`. With `isDisabled`, an item stays listed and reachable by the arrow keys but refuses activation ([UIC-MENU-2.6](MENU.md#uic-menu-26---focusable-disabled-items)), and shows `disabledReason`, when given, in place of its description, so a reader hears or sees why it is unavailable.

Implementation: `src/components/message-composer/composer-menu.tsx`
Verification: `src/components/message-composer/composer-menu.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-5.3 - Actions

Choosing an item shall call its `onAction` with the composer's helpers, then close the menu with every open submenu. `insertText(text)` inserts the text at the caret in place of the selection. `insertPill({ kind, id, label, recordType? })` inserts a mention, command or record reference followed by a space: in the rich composer as a pill ([UIC-MESSAGE-COMPOSER-4.3](#uic-message-composer-43---pills), [UIC-MESSAGE-COMPOSER-4.9](#uic-message-composer-49---record-references)), sent as a token, and in a code block or the plain composer as its text (`@label`, `/label`, `label`). After either, once the menu has closed and given focus back to its button, focus returns to the input with the caret after the insertion. `attachFiles()` opens the system file chooser for several files and hands the chosen files to `onAttach` ([UIC-MESSAGE-COMPOSER-3.2](#uic-message-composer-32---attaching-files)). `focusInput()` moves focus to the input once the menu has closed.

Implementation: `src/components/message-composer/composer-menu.tsx`, `src/components/message-composer/use-message-composer.ts`, `src/components/message-composer/rich/rich-message-composer.tsx`, `src/components/message-composer/rich/rich-content.tsx`, `src/components/message-composer/rich/composer-commands.ts`, `src/components/message-composer/use-file-drop.ts`
Verification: `src/components/message-composer/composer-menu.test.tsx`, `src/components/message-composer/rich/rich-message-composer.test.tsx`, `src/components/message-composer/rich/composer-pill.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-5.4 - Toggles

An item with `isSelected` (true or false) shall be a toggle the host controls, such as a plan mode: a check item ([UIC-MENU-2.7](MENU.md#uic-menu-27---check-items), `menuitemcheckbox` with `aria-checked`) among the other items. Choosing it calls `onSelectedChange` with the new state, then `onAction`, and keeps the menu open, so the reader can flip several.

Implementation: `src/components/message-composer/composer-menu.tsx`
Verification: `src/components/message-composer/composer-menu.test.tsx`, `e2e/message-composer.spec.ts`

### UIC-MESSAGE-COMPOSER-5.5 - Search

With `filterable` (off by default), the menu shall lead with a search field ([UIC-MENU-5.1](MENU.md#uic-menu-51---filterable-menu)), focused when the menu opens, that keeps the items whose label or description contains the typed text, ignoring case and accents, and hides the sections it leaves empty; while nothing matches it shows the provider's `noResults` string.

Implementation: `src/components/message-composer/composer-menu.tsx`
Verification: `src/components/message-composer/composer-menu.test.tsx`, `e2e/message-composer.spec.ts`

## UIC-MESSAGE-COMPOSER-6 - Controls

### UIC-MESSAGE-COMPOSER-6.1 - Entry point

`MessageComposerMenuButton`, `MessageComposerAttachButton`, `MessageComposerEmojiButton`, `MessageComposerSendButton`, `MessageComposerSelect`, `MessageComposerToggle`, `useMessageComposerControls` and their types shall be exported from the package root and from `@flamboyantengineer/ui-components/message-composer`, and serve both composers, plain and rich. Each takes the caller's `className`, `id` and `data-*` attributes on its button.

Implementation: `src/components/message-composer/index.ts`, `src/index.ts`
Verification: `src/components/message-composer/composer-controls.test.tsx`

### UIC-MESSAGE-COMPOSER-6.2 - Placing controls

`startControls` and `endControls` shall take any nodes, so a host places any number of controls in any order at the start or the end of the row: the built-in ones of this spec, a [Chat Model Picker](CHAT-MODEL-PICKER.md) or its own. Both groups render, empty or not, so a stylesheet can push the end group to the end of the row. The "+", attach, emoji and send buttons act on the composer around them: placed outside a composer's controls they throw an `Error` naming themselves.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/composer-controls.ts`
Verification: `src/components/message-composer/composer-controls.test.tsx`

### UIC-MESSAGE-COMPOSER-6.3 - Send button

The row shall end with the send button (Cancel before it while editing, [UIC-MESSAGE-COMPOSER-3.3](#uic-message-composer-33---edit-mode)) unless the host places `MessageComposerSendButton` among either group's controls: the button then renders there, Cancel before it, and the composer adds none of its own. It behaves as UIC-MESSAGE-COMPOSER-1.2, 1.3, 3.8 and 3.9 say wherever it sits.

Implementation: `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/composer-tools.tsx`, `src/components/message-composer/composer-controls.ts`
Verification: `src/components/message-composer/composer-controls.test.tsx`, `e2e/message-composer-controls.spec.ts`

### UIC-MESSAGE-COMPOSER-6.4 - Compact row

The composer shall be compact while its row cannot hold its controls: it becomes compact when the row's content is wider than the row, and stays compact until the row is again as wide as the content was then, so dropping labels cannot undo itself. The row and both groups are measured as they resize. While compact, the root publishes `data-compact`, and the select, the toggle and the model picker show their icon alone as an icon-only button named and hinted by their label, so every control keeps an icon to show. A control without an icon to show (a toggle with no `icon`, a select whose current option has none) keeps its visible label while compact rather than becoming an empty button. A control keeps its element and focus as the composer turns compact and back. The reference stylesheet keeps the row on one line while it is not compact, so the overflow can be measured, and lets it wrap while it is.

Implementation: `src/components/message-composer/composer-controls.ts`, `src/components/message-composer/composer-frame.tsx`, `labs/reference/message-composer.css`
Verification: `src/components/message-composer/composer-controls.test.tsx`, `e2e/message-composer-controls.spec.ts`

### UIC-MESSAGE-COMPOSER-6.5 - A host's own controls

`useMessageComposerControls()` shall return `{ isCompact, isDisabled }` for the composer around the calling control, so a host's own control drops its label while the row is compact and refuses interaction while the composer is disabled; outside a composer both are false.

Implementation: `src/components/message-composer/composer-controls.ts`
Verification: `src/components/message-composer/composer-controls.test.tsx`, `e2e/message-composer-controls.spec.ts`

### UIC-MESSAGE-COMPOSER-6.6 - Render cost

Typing shall render no control in the row again until what the controls read changes: whether the composer is compact, disabled, editing or pending, whether it has something to send, the chord that sends, and whether the host passes `onAttach`, `onCancel` and `onStop`. The composer's actions and the host's callbacks the controls call keep their identity and call the latest render's. The row is measured once at mount and then as it or either group resizes, never on a keystroke, and the rich composer sets its input's row limits when `minRows` or `maxRows` change or the input resizes.

Implementation: `src/components/message-composer/composer-controls.ts`, `src/components/message-composer/composer-frame.tsx`, `src/components/message-composer/rich/rich-content.tsx`
Verification: `src/components/message-composer/composer-render-cost.test.tsx`, `e2e/message-composer-controls.spec.ts`

## UIC-MESSAGE-COMPOSER-7 - Select

### UIC-MESSAGE-COMPOSER-7.1 - Trigger

`MessageComposerSelect` shall render a small `ghost` [Button](BUTTON.md) (`ui-message-composer__select`) showing the current option's `icon`, its `label` and a `chevron-down` glyph, named by the provider string `composerSelectTrigger` from the select's `label` and the option's ("Approval: Ask first"); while the composer is compact, the icon alone ([UIC-MESSAGE-COMPOSER-6.4](#uic-message-composer-64---compact-row)). It reports its menu in `aria-haspopup` and `aria-expanded`, and is disabled with `isDisabled` or with the composer; becoming disabled closes its open menu, whose options then choose nothing, and enabled again it leaves the menu closed. Without options it renders nothing.

Implementation: `src/components/message-composer/composer-select.tsx`, `src/core/strings/composer.ts`
Verification: `src/components/message-composer/composer-select.test.tsx`, `e2e/message-composer-controls.spec.ts`

### UIC-MESSAGE-COMPOSER-7.2 - Menu

Pressing the trigger shall open a menu (`ui-message-composer__select-menu`, also `ui-menu`) in a [Menu Popover](MENU.md#uic-menu-43---popover) above the trigger's start, flipping below when there is no room, labelled by the trigger: one single-selection item per option, in order, with its `icon`, `label` and `description`, the current one checked. An option with `isDisabled` shows its `disabledReason` in place of its description, stays reachable by the arrow keys with `aria-disabled="true"` and cannot be chosen. Choosing an option closes the menu, returning focus to the trigger.

Implementation: `src/components/message-composer/composer-select.tsx`
Verification: `src/components/message-composer/composer-select.test.tsx`, `e2e/message-composer-controls.spec.ts`

### UIC-MESSAGE-COMPOSER-7.3 - State

The choice shall follow the controlled pair convention ([UIC-COMPOSITION-5](COMPOSITION.md#uic-composition-5---controlled-state)): `value` with `onChange`, or uncontrolled from `defaultValue`. The current option is the one the value names, else the first available option, else the first. Choosing an option other than the current one calls `onChange` with its id.

Implementation: `src/components/message-composer/composer-select.tsx`
Verification: `src/components/message-composer/composer-select.test.tsx`

## UIC-MESSAGE-COMPOSER-8 - Toggle

### UIC-MESSAGE-COMPOSER-8.1 - Toggle button

`MessageComposerToggle` shall render a small `ghost` toggle [Button](BUTTON.md) (`ui-message-composer__toggle`) showing its `icon` and `label`, or its icon alone named and hinted by its label while the composer is compact. It is pressed (`aria-pressed`, `data-selected`) while the mode is on, controlled by `isSelected` with `onChange` or uncontrolled from `defaultSelected` (off by default); a press flips it and calls `onChange` with the new state. It is disabled with `isDisabled` or with the composer.

Implementation: `src/components/message-composer/composer-toggle.tsx`
Verification: `src/components/message-composer/composer-toggle.test.tsx`, `e2e/message-composer-controls.spec.ts`

## Hooks

| Hook                               | Kind      | Values                                       | Description                                                           |
| ---------------------------------- | --------- | -------------------------------------------- | --------------------------------------------------------------------- |
| `ui-message-composer`              | root      |                                              | The composer's frame.                                                 |
| `ui-message-composer__banner`      | slot      |                                              | The line above everything else: the message replied to or edited.     |
| `ui-message-composer__attachments` | slot      |                                              | The attachments above the text.                                       |
| `ui-message-composer__input`       | slot      |                                              | The text area, or the rich composer's editable text box.              |
| `ui-message-composer__placeholder` | slot      |                                              | Rich: the empty text box's first line, which shows the placeholder.   |
| `ui-message-composer__pill`        | slot      |                                              | Rich: a mention, command, record reference or host token in the text. |
| `ui-message-composer__pill-icon`   | slot      |                                              | Rich: a host token's icon, before its label (also `ui-icon`).         |
| `ui-message-composer__code-block`  | slot      |                                              | Rich: a code block (`pre`).                                           |
| `ui-message-composer__footer`      | slot      |                                              | The row of controls below the text.                                   |
| `ui-message-composer__start`       | slot      |                                              | The controls at the start of the row.                                 |
| `ui-message-composer__end`         | slot      |                                              | The controls at the end of the row, then the send button.             |
| `ui-message-composer__menu-button` | slot      |                                              | The "+" button that opens the menu (also `ui-button`).                |
| `ui-message-composer__menu`        | slot      |                                              | The menu the "+" button opens and its submenus (also `ui-menu`).      |
| `ui-message-composer__attach`      | slot      |                                              | The attach button (also `ui-button`).                                 |
| `ui-message-composer__emoji`       | slot      |                                              | The emoji button (also `ui-button`).                                  |
| `ui-message-composer__select`      | slot      |                                              | A select's trigger (also `ui-button`).                                |
| `ui-message-composer__select-menu` | slot      |                                              | The menu a select opens (also `ui-menu`).                             |
| `ui-message-composer__toggle`      | slot      |                                              | A toggle (also `ui-button`).                                          |
| `ui-message-composer__cancel`      | slot      |                                              | The Cancel button of edit mode (also `ui-button`).                    |
| `ui-message-composer__action`      | slot      |                                              | The send, stop or save button (also `ui-button`).                     |
| `ui-message-composer__completions` | slot      |                                              | The completion list's popover (also `ui-completion-list`).            |
| `data-pending`                     | state     | `true`                                       | On the root: a reply is on its way.                                   |
| `data-editing`                     | state     | `true`                                       | On the root: the composer edits a message.                            |
| `data-drop-target`                 | state     | `true`                                       | On the root: a drag carrying files is over the composer.              |
| `data-submitting`                  | state     | `true`                                       | On the root: a sent message waits for the host to accept it.          |
| `data-compact`                     | state     | `true`                                       | On the root: the row is too narrow, controls show their icon alone.   |
| `data-disabled`                    | state     | `true`                                       | On the root, and on the input (React Aria): disabled.                 |
| `data-focused`                     | state     | `true`                                       | On the input: focused (React Aria).                                   |
| `data-focus-visible`               | state     | `true`                                       | On the input: focused from the keyboard (React Aria).                 |
| `data-hovered`                     | state     | `true`                                       | On the input: under the pointer (React Aria).                         |
| `data-kind`                        | attribute | `mention`, `command`, `reference`, `trigger` | On a pill: what it stands for.                                        |
| `data-trigger`                     | attribute |                                              | On a `trigger` pill: the id of the host trigger it came from.         |
| `data-placeholder`                 | attribute |                                              | On the placeholder line: the placeholder text.                        |
