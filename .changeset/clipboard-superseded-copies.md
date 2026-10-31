---
'@flamboyantengineer/ui-components': minor
---

`copyText` and `copyRichText` take a `signal`: once aborted, a refused asynchronous write no longer falls back to a selection copy. `useClipboard` withdraws each copy when a newer one starts, on reset and on unmount, so an older refused copy can no longer overwrite newer text, and `CopyButton` announces only its latest copy.
