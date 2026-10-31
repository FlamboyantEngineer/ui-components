---
'@flamboyantengineer/ui-components': minor
---

The built-in glyphs no longer depend on `@heroicons/react`: the library carries the Heroicons outline paths it draws (MIT notice kept in `src/core/glyph-paths.ts`), and the dependency is removed. Glyphs draw the same shapes; their SVG no longer carries `data-slot="icon"`. Hosts that imported `@heroicons/react` through this package must add it themselves.
