---
'@flamboyantengineer/ui-components': patch
---

`Timeline` discards a drag's draft dates when the dragged item leaves the chart mid-gesture (a switch to the table view, a collapsed group or a removed item), so returning to the chart shows the source dates and the next edit starts from them instead of the abandoned preview.
