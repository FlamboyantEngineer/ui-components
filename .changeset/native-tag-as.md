---
'@flamboyantengineer/ui-components': minor
---

`Separator` and `VisuallyHidden` choose their native tag with `as`, like the layout primitives, instead of `elementType`. `render` stays for composing your own element; on `Separator` it receives the props of the element `as` chose.
