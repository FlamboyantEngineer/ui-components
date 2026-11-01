---
'@flamboyantengineer/ui-components': minor
---

Add `isExternal` to `Button`: a link button that opens a new tab (through `isExternal` or `target="_blank"`) shows the external-link glyph after its label unless an `endIcon` is given (`null` hides it), and adds the provider's "opens in a new tab" text to its name. Same-tab links are unchanged.
