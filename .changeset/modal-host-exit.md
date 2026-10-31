---
'@flamboyantengineer/ui-components': patch
---

A controller modal that closes runs its exit and `onExitComplete` before `ModalHost` removes it, while its result still settles at once. A host torn down with the modal open runs no exit.
