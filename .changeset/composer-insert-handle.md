---
'@flamboyantengineer/ui-components': minor
---

Let a host's own controls insert tokens into a composer's draft. `RichMessageComposer` takes `handleRef`, which receives `insertToken` (a pill at the caret, or where the caret was before focus left, else at the end, as one undo step, then focus) and `getDraft`; insertion reports `inserted`, or refuses with `disabled`, `editing`, `submitting` or `unavailable`. `Chat` takes `composerHandleRef`, a handle bound to the shown conversation whose `insertToken` also refuses with `other-conversation`, and `onDraftChange`, which reports the conversation's draft as it loads and after each edit so the host can skip tokens already in it.
