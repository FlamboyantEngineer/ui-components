---
'@flamboyantengineer/ui-components': patch
---

`ViewSwitcher` dialogs now run the current handler for their view, and close when the handler or the view goes away or a deletion would remove the last view, instead of running the callback captured when they opened.
