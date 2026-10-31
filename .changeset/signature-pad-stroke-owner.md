---
'@flamboyantengineer/ui-components': patch
---

`SignaturePad` drops a stroke under way when its value is replaced, restored or cleared, or its form is reset, instead of adding it to the new drawing on release. A reset a listener cancels, and an equal value given again, keep the stroke.
