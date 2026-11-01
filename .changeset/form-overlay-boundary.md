---
'@flamboyantengineer/ui-components': patch
---

`Form` ignores the submit of another form that React passes through it, such as a dialog's, and takes no props from a form around it. Modal, Drawer, Popover, HoverCard and menu popover bodies start a fresh field scope, so their fields no longer block, reveal or count in the form around the overlay.
