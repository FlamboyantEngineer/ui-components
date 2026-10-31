---
'@flamboyantengineer/ui-components': patch
---

An open `TruncationTooltip` no longer takes an Escape that belongs to an input method's composition: the focused editor receives it and the hint stays open. Escape after the composition closes the hint as before.
