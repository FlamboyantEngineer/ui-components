---
'@flamboyantengineer/ui-components': patch
---

DateTimeField and RelativeDateField keep four-digit years when they write a floating date and time, so editing `0099-04-20T12:30` no longer commits `99-04-20T12:31`.
