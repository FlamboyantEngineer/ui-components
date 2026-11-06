---
'@flamboyantengineer/ui-components': patch
---

`UiProvider` publishes glyphs, text, the link renderer, the router, storage and the clock separately, so changing one option re-renders only the components that read it. A new storage adapter or clock no longer re-renders components that only read glyphs or text.
