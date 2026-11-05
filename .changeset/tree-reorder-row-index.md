---
'@flamboyantengineer/ui-components': patch
---

`Tree` reordering and the move helpers (`resolveTreeMove`, `resolveTreeDrop`, `resolveTreeDropMany`, `resolveTreeKeyboardMove`) index a rows snapshot once and reuse it for every move checked against it, so starting a drag in a large tree checks its targets in time proportional to the rows instead of their square.
