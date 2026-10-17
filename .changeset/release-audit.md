---
'@flamboyantengineer/ui-components': major
---

First complete release. `PropertyFilter` now builds on `SearchField`: its `icon`, `input` and `clear` slots are gone (the search field's own hooks replace them) and its clear button is named by `clearSearch`. `SearchField` takes an `inputRef`. Every lab passes axe in the light and dark themes of the reference stylesheet.

`ToolbarRow`'s `band` variant is now `surface` (`data-variant="surface"`).

`SelectField` submits an empty form entry, not a generated key, while its `emptyLabel` option is shown.

The layout spacing scale is now `none`, `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl` (`data-space`, `data-gutter`): `compact`, `sm-plus` and `relaxed` are gone and the upper steps are renamed. Defaults keep their size: `Stack`, `Grid` and `Section` space `2xl`, `Cluster` and `ToolbarRow` `md`, `Page` gutter `3xl`.
