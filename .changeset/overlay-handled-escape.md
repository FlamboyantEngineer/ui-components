---
'@flamboyantengineer/ui-components': patch
---

`Modal` (blocking, floating and anchored), `Drawer` and `Popover` stay open when their content handles Escape with `preventDefault`, such as an editor cancelling its draft; the next Escape closes them as before.
