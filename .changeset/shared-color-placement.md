---
'@flamboyantengineer/ui-components': minor
---

`getColorIndex` now uses the unsigned 32-bit rolling hash (`hash * 31 + code unit`), the one the document and spreadsheet editors use for people's ids, so a person keeps one color across the libraries. Colors derived from a key change once: an avatar whose slot came from its name or `colorKey` may show another slot after this update. New `placeColorIndexes(keys, count)` gives the people present together distinct slots: each key's own slot, or the next free one, keys taken in code unit order.
