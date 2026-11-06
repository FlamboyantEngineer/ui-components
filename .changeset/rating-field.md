---
'@flamboyantengineer/ui-components': minor
---

Add `RatingField`, a field that rates with glyphs up to `maxValue` (5 by default) in whole or half steps (`step` of `1` or `0.5`). It is a radio group on the field contract: each radio is named by the new `ratingValue` string (`3 out of 5`), the arrow keys step through the ratings (mirrored right to left), a form submits the picked rating, and validation, dirty state, restore, undo and Clear work as on other fields. Hovering previews a rating on the glyphs (`data-previewing`) without changing the value. `icon` and `emptyIcon` replace the star. Add `Rating`, a read-only score such as an average of reviews: one image named by its score (or the new `ratingNone` string), with glyphs filled up to fractions through `data-fill` and `--ui-rating-fill`.
