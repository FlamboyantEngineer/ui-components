---
'@flamboyantengineer/ui-components': minor
---

Layout and overflow fixes from the lab review. `NavigationRail` puts its collapse button first in the header, and the reference sheet keeps it in the same place expanded and collapsed. `MathPreview` math wider than its box publishes `data-overflowing` and takes keyboard focus; the reference sheet scrolls it inside the box. The `rotate` glyph is now an arrow turning up and to the right. In the reference sheet: a field's 280-pixel width no longer holds a flex or grid track open, so a range filter's two fields fit their editor; a property panel fills its column and keeps 12rem in a shrink-to-fit box; the asset picker's details no longer widen its results; and a row of tabs keeps its height in a fixed-height tabs box.
