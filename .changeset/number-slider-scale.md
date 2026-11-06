---
'@flamboyantengineer/ui-components': minor
---

`NumberField` sliders take a `scale`: `linear` (the default), `logarithmic`, where equal track distances are equal ratios, or a caller's `NumberSliderScale` map (`logarithmicScale` is exported). The thumbs, fill, marks and pointer follow the scale while the value, callbacks, ARIA values, form data and steps stay in actual values; Page keys move a tenth of the track. A logarithmic scale over bounds that are not above zero throws a `RangeError`.
