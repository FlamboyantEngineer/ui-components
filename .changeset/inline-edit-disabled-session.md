---
'@flamboyantengineer/ui-components': patch
---

Disabling an InlineEdit while its editor is open freezes the editor: it keeps the draft but saves nothing until enabled again, a save already running finishes, and a queued one does not start. `renderEditor` receives `isDisabled`.
