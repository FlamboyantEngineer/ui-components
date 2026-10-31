---
'@flamboyantengineer/ui-components': patch
---

The message composers no longer re-render their controls (including a host's own controls and the model picker) or measure their row on every keystroke: the controls' context keeps its identity until what they show changes, the row is measured at mount and on resize, and the rich composer sets its row limits only when `minRows`, `maxRows` or the input's size change.
