---
'@flamboyantengineer/ui-components': major
---

First complete release. `PropertyFilter` now builds on `SearchField`: its `icon`, `input` and `clear` slots are gone (the search field's own hooks replace them) and its clear button is named by `clearSearch`. `SearchField` takes an `inputRef`. Every lab passes axe in the light and dark themes of the reference stylesheet.

`ToolbarRow`'s `band` variant is now `surface` (`data-variant="surface"`).
