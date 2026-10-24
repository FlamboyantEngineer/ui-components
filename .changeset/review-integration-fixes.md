---
'@flamboyantengineer/ui-components': patch
---

- `Button` and `IconButton`: `aria-keyshortcuts` hydrates in the server's notation and then switches to the reader's platform, so server-rendered markup no longer mismatches on macOS.
- `MediaViewer`: pressing the shown item's thumbnail no longer calls `onSelectionChange`.
