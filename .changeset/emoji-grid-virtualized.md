---
'@flamboyantengineer/ui-components': minor
---

`EmojiPicker` (and `EmojiPickerTrigger`) take `virtualized`, which renders only the emoji in view of each grid through React Aria's virtualizer with a grid layout, publishing `data-virtualized` on the grid and its section. `EmojiPicker` and `CharacterGrid` build their key lookups once per set of entries, categories, search and recent characters instead of on every render; `CharacterGrid` keeps rendering every cell with its section headings, as its spec now records.
