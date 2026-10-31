---
'@flamboyantengineer/ui-components': patch
---

Server pages can import glyphs from `/core`: the glyph module is a client module, and the pure helpers that server-safe utilities call (date functions, colour parsing, value stores, PDF page bitmaps and rotation, table column names) live in server-safe modules. `check:client-boundaries` now reports a server module that calls or reads a client export.
