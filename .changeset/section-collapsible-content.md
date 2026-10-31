---
'@flamboyantengineer/ui-components': patch
---

`Section` keeps its content mounted when `collapsible` turns on or off: every section holds its content in `ui-section__panel`, and focus in content that the change hides moves to the trigger.
