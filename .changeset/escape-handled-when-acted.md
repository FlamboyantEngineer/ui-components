---
'@flamboyantengineer/ui-components': patch
---

`FormulaBar`'s reference box leaves Escape to the surface around it when there is nothing to drop, and while an input method composes. Ending a chat reply and closing a code editor hover tip mark their Escape handled, so a `Modal` or `Drawer` around them stays open until the next Escape.
