---
'@flamboyantengineer/ui-components': patch
---

`CodeEditor` cuts its highlighted copy into segments only when its tokens or decorations change and renders the copy again only then, so a hover tip that follows the pointer no longer re-renders and re-reads the whole document on every move.
