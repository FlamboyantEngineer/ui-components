---
'@flamboyantengineer/ui-components': minor
---

Let a host run the full `Chat` with its own controls and asynchronous sending:

- **Quote in assistant chats:** `onReply` now offers Reply (which a host can name Quote through the provider strings) on finished messages with text in assistant chats.
- **Composer controls:** `composerToolbar` places the host's controls before the model picker, and the composer's tools wrap in a narrow composer. `Chat` forwards `allowsEmptySubmit`, `submitShortcut`, `minRows` and `maxRows`.
- **Asynchronous sending:** `onSend`, `onReply` and `onEdit` may return a promise. The composer keeps the message, its tokens and the quote until the host accepts it, sends it only once meanwhile, keeps them for another try when it rejects, and reports the error through `onSendError`. The message settles in the conversation it was sent from.
- **Composers:** `MessageComposer` and `RichMessageComposer` accept a promise from `onSubmit`, publish `data-submitting` while it is pending, and report failures through `onSubmitError`.
