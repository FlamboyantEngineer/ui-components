---
'@flamboyantengineer/ui-components': patch
---

DateTimeField writes a chosen preset as it writes a pick in the editor, zoned in `timeZone` and without parts finer than the granularity, and judges whether to offer it by that written value.
