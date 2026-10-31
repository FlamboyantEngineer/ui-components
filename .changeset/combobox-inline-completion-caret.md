---
'@flamboyantengineer/ui-components': patch
---

`Combobox` inline completion only completes an insertion that leaves the caret at the end of the input; typing or replacing text inside the query keeps the caret where the reader is editing instead of jumping to the end and selecting an unrelated suffix.
