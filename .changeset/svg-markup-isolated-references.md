---
'@flamboyantengineer/ui-components': patch
---

`SvgMarkup` keeps each drawing's ID references inside that drawing. Every instance prefixes the IDs its drawing defines and the `href`, `url()`, animation timing and ARIA references to them. References to anything else, such as an element of the host page or another drawing, are dropped, and two drawings that use the same gradient ID no longer collide.
