---
'@flamboyantengineer/ui-components': minor
---

Rich-text engines are shared. `RichTextEngineHost` renders a caller-held editor state with React node and mark views, passes every transaction through a `dispatchTransaction(tr, view, commit)` body that commits it or drops it, and reports commits through `afterCommit`, `onMounted`, `onSelectionChange`, `onUpdated` and `onUnmounted`; `RichTextEngineContent` renders its document (`ui-rich-text-engine-content`). `createRichTextHeadlessEngine` runs the same contract with no rendered document, on the server too, and `withoutReactKeys` moves a state from a rendered engine to a headless one. `RichTextEditor` now renders through the host.
