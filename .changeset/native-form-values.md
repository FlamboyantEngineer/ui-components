---
'@flamboyantengineer/ui-components': patch
---

`RelativeDateField` and `RichTextEditor` submit their value with a native form under their `name`: a date or date and time as its text, a date range as an ISO 8601 interval (`start/end`) and a rich-text document as its JSON. Disabled fields submit nothing.
