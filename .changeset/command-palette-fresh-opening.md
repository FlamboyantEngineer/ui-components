---
'@flamboyantengineer/ui-components': patch
---

`CommandPalette` starts each opening from `defaultInputValue` even when it reopens before its exit animation ends, and its chord reopens a palette that is still leaving instead of being swallowed by it.
