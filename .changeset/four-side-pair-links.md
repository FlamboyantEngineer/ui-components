---
'@flamboyantengineer/ui-components': minor
---

FourSidePropertyStrip links each opposite pair on its own. `linked`, `defaultLinked` and `onLinkedChange` now take the list of linked pairs (`BoxAxis`: `vertical`, `horizontal`, or `LogicalBoxAxis`: `block`, `inline`) instead of a boolean, and with `link="pairs"` each bracket has its own toggle, named after its sides (`linkSides` now takes the group). With `link="all"` the sides are linked while both pairs are. Linked state moves from the row's `data-linked` to the linked cells and brackets, and the decorative `__glyph` is gone. The reference sheet rounds the bracket bends more and draws linked toggles as an accent glyph on no background.
