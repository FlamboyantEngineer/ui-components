---
'@flamboyantengineer/ui-components': minor
---

`FileUpload` abandons offers still waiting for `validate` when it unmounts or becomes disabled or read-only, together with the offers queued behind them, so a closed editor's `onSelect` and `onReject` are never called. Answers reach the callbacks the upload last rendered with. A `validate` promise that rejects now refuses its file with the new rejection reason `unchecked` (counted by the new `rejectedFileUnchecked` string) instead of leaving an unhandled rejection.
