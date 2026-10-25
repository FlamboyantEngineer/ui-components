---
'@flamboyantengineer/ui-components': minor
---

Give `MessageComposer` the features a chat needs, and a rich mode.

- `RichMessageComposer` (new, from its own entry point `@flamboyantengineer/ui-components/message-composer/rich`, so the root and the plain composer still load without the optional ProseMirror peers): mentions (`@`, from `mentions`) and commands (`/`, from `commands`) chosen from the completion list and shown as atomic pills that one Backspace removes (and announces); Markdown as typed without a toolbar, with ``` opening a code block where Enter adds lines, Ctrl/Cmd+B and +I wrapping the selection in `**` and `_`, and plain-text paste that keeps spacing. Its value and `onSubmit` carry `{ text, tokens }`: Markdown text and each pill's range, kind, id and label. Types: `MessageComposerMessage`, `MessageComposerToken`, `MessageComposerTokenKind`, `MessageComposerMention`, `MessageComposerCommand`, `RichMessageComposerProps`.
- Both composers: `banner` above the input; `onAttach` with an attach button, file drops (`data-drop-target`) and pasted files; `editValue` with Save and Cancel (`onCancel`, Escape) and `data-editing`; `onEditLast` on Up in an empty composer; `history` recalled with Up and Down while the composer is empty or shows an unchanged recall; `persistKey` keeping the draft (and its tokens) in the provider storage; `showEmojiPicker` inserting the chosen emoji at the caret. Ctrl/Cmd+Enter now sends with either chord, and on a touch screen Enter breaks the line.
- New hooks: `ui-message-composer__banner`, `__placeholder`, `__pill` (`data-kind`), `__code-block`, `__attach`, `__emoji`, `__cancel`, `data-editing`, `data-drop-target`, `data-placeholder`. New glyph `attach`; new strings `attachFiles`, `insertEmoji`, `removedFromMessage`.
