---
'@flamboyantengineer/ui-components': minor
---

State changes keep the layout. A pending `Button` keeps its icons and label in place beside `ui-button__spinner`, so a stylesheet can draw the spinner over them and the button keeps its size; host stylesheets that relied on the icons leaving should hide them under `[data-pending]`. A disabled `JsonEditor` keeps its Format button, disabled, instead of dropping it. The reference stylesheet reserves each field's message line and restore button place, marks selected and current items without a weight change, and checks that no state rule sizes or places a box.
