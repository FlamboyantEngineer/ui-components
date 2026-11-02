---
'@flamboyantengineer/ui-components': patch
---

RichTextEditor draws its block markers along the whole scroll track again, and its vertical thumb is now exact (no minimum length, `data-exact`) on the same document scale, so a marked block in view lies as far down the thumb as it lies down the view. The reference stylesheet extends an exact thumb's hit area past its ends.
