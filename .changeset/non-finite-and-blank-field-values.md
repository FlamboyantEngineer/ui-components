---
'@flamboyantengineer/ui-components': patch
---

Judge field values by what they hold: a `NumberField` reads `NaN` and the infinities as no value in every radix (shown and submitted empty, blocking when required); a `Slider` moves `NaN` to its minimum and an infinity to its end as a change; a `TagsInput` whose tags are all blank is empty and a given value that repeats a tag reports it; and an empty `RichTextEditor` no longer carries `data-filled`.
