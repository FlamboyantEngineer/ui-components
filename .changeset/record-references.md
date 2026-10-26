---
'@flamboyantengineer/ui-components': minor
---

Add inline record references to the rich composer and Chat. `MessageComposerToken` and `ChatTextToken` take the kind `reference`, with the record's opaque `id`, the `label` the reference shows and an optional host `recordType`. `RichMessageComposer`, `ChatParts` and `Chat` take `getReference`, a `RecordLabelResolver` that returns the record's current `RecordLabelPresentation` (name, icon, link, kind, version, state, preview, or missing or restricted) by its id; references draw as atomic `RecordLabel` chips in the editor (with a remove button) and in messages, in the new `reference` value of `data-kind` on `ui-message-composer__pill` and `ui-chat-parts__token`. The menu's `insertPill` inserts references, and references keep their identity through sending, a refused send, editing, quoting and the stored draft. `RecordLabelReference`, `RecordLabelPresentation` and `RecordLabelResolver` are exported.
