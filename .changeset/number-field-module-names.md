---
'@flamboyantengineer/ui-components': patch
---

`NumberField` internals: decimal mode's commit rules use the public `NumberFieldCommitBehavior` type instead of an identical private one, and the modules are named by what they implement (the base-ten number control, and the decimal value field and stepper). No API or behaviour change.
