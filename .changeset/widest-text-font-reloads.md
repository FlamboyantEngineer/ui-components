---
'@flamboyantengineer/ui-components': patch
---

`useWidestTextWidth`, and the measured widths it gives `SelectField` (`--ui-select-field-label-width`), `BooleanField` (`--ui-boolean-field-caption-width`) and chart axis margins, measures again whenever fonts finish loading later in the document's life, so a font added after mount no longer leaves the width measured in its fallback.
