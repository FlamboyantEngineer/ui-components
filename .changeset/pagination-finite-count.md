---
'@flamboyantengineer/ui-components': patch
---

`Pagination` reads a `pageCount` that is not finite (`NaN`, `Infinity`) as one page, instead of drawing a "NaN" or "∞" page and an endless Next.
