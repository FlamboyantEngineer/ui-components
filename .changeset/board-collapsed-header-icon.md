---
'@flamboyantengineer/ui-components': minor
---

A collapsed `Board` column's header now compresses to its collapse toggle, drawn with the column's icon (or its chevron without one), at an expanded header's height. The title and count stay visually hidden and show in the toggle's tooltip, the column actions return on expand, and the toggle takes the Alt+Arrow column moves. `ExpandToggle` takes an `icon` drawn in place of its chevron, a `tooltip`, `onKeyDown` and `render`.
