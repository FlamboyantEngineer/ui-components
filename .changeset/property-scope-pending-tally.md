---
'@flamboyantengineer/ui-components': patch
---

A `PropertyScope` rendered with a preset query no longer hides matching sections, groups and cards, nor announces that nothing matches, before its parts have reported their matches: server rendering and the first client render keep containers visible until the counts are known.
