---
'@flamboyantengineer/ui-components': patch
---

A floating or retained `Modal` and a `Field` with `autoFocus` read the element focused before they open or mount from their portal container's document, so in a popup window or frame focus returns to, or is compared with, the element focused there.
