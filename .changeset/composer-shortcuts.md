---
'@flamboyantengineer/ui-components': minor
---

The composers send on the host's chords, which can depend on whether a reply runs: `shortcuts={{ send, queue, sendNow }}` takes any chord in Shortcut notation, one or a list, for each action. `send` works while idle and saves edits (Enter and Ctrl+Enter by default). While a reply runs, `queue` sends through `onSubmit` for the host to queue (Enter by default), and `sendNow` sends through the new `onSubmitNow` (Ctrl+Enter by default). `shortcuts` replaces `submitShortcut`, and `MessageComposerSubmitShortcut` gives way to `MessageComposerShortcuts` and `MessageComposerChords`. `Chat` takes `shortcuts` and `onSendNow`, and the Up arrow in its empty composer edits the newest queued message first. `useChatController` adds `sendNow` and `props.onSendNow`, which stop the running reply and send the message ahead of the queue.
