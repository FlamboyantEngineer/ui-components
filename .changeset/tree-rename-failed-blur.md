---
'@flamboyantengineer/ui-components': patch
---

`Tree`: leaving a rename field whose draft `onRename` rejected no longer submits the same draft again. The field keeps its draft and error until Enter retries, the draft changes, or Escape abandons it; a rename that leaving the field submitted and that fails keeps the field open without taking focus back.
