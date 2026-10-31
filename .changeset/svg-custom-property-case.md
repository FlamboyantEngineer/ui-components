---
'@flamboyantengineer/ui-components': patch
---

`SvgMarkup` keeps the spelling of custom property names in `style` (`--Brand` stays `--Brand`), so mixed-case design tokens resolve in `var()`. Other property names are still lower-cased, and values pass the same safety checks.
