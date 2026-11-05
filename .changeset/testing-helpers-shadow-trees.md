---
'@flamboyantengineer/ui-components': patch
---

The testing helpers resolve ID references in the control's own tree: `getFieldError` and `getFieldDescription` read messages inside a shadow root, and `openMenu`, `selectOption` and the other popup helpers return the popup a shadow-root trigger controls instead of an unrelated one in the document.
