---
'@flamboyantengineer/ui-components': patch
---

`Form` shows its fields' validation once per native validation pass, on the pass's first `invalid` event, instead of once for every invalid control, so a blocked submit of a large form stays proportional to its size.
