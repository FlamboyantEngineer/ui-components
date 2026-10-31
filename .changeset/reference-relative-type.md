---
'@flamboyantengineer/ui-components': patch
---

The reference stylesheet's type scale and control heights are in rem, so a reader's browser font-size preference enlarges text and controls (the same 10 to 28 pixel type and 20 to 32 pixel controls at the default 16 pixel root). The opt-in document base keeps the root at that preference and sets the base type step on the body, and container query thresholds use rem as well.

Lengths the partials already wrote in rem (list heights, column widths, flex bases) now resolve against the reader's root size rather than the 14 pixel root the document base used to set, so at default settings they draw about a seventh larger.
