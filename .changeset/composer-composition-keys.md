---
'@flamboyantengineer/ui-components': patch
---

`MessageComposer` leaves Escape and the recall arrows to the input method while a composition owns them, including the key code 229 some browsers report as it ends, as it already did for the sending chords.
