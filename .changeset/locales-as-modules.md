---
'@flamboyantengineer/ui-components': patch
---

The shipped language files are now plain JavaScript modules generated from their JSON files, so the built package contains no JSON import attributes and loads on toolchains without import-attribute support. `@flamboyantengineer/ui-components/locales/<language>.json` still ships the JSON.
