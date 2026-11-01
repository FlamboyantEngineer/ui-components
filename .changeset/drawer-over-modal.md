---
'@flamboyantengineer/ui-components': minor
---

A `Drawer` opened from inside a `Modal` (or another overlay that stacks higher) now takes that overlay's layer and paints above it, and so does a `DockPanel`'s overlay drawer in a modal. `Drawer` gains a `layer` prop to set its layer explicitly.
