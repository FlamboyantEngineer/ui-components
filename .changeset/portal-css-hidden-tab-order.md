---
'@flamboyantengineer/ui-components': patch
---

Skip CSS-hidden controls and hidden ancestors when finding tab stops, including on browsers with legacy visibility options or without `checkVisibility`. Portals preserving tab order reach visible controls in both directions and pass over entirely hidden content without stopping on a focus guard.
