---
'@flamboyantengineer/ui-components': patch
---

`SignaturePad` counts a blank typed signature or a drawing without strokes as empty, wherever the value comes from, so a required pad blocks the form and drops `data-filled`. Turning `allowsTyping` off returns an empty pad to drawing, and a short stroke now ends at the last position drawn instead of collapsing to a dot.
