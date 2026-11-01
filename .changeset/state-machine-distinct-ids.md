---
'@flamboyantengineer/ui-components': patch
---

`StateMachineView` keeps a state and a transition that share an id apart, and numeric and text ids apart: selecting, moving or removing a state no longer selects or removes a transition with the same id, and every callback still reports the caller's own ids.
