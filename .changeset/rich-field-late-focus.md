---
'@flamboyantengineer/ui-components': patch
---

`RichMessageField` with `autoFocus` focuses its editable once the editor's view exists, so a field whose editable mounts after its own effects (such as a comment composer with mentions opened on demand) takes focus.
