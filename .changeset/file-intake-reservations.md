---
'@flamboyantengineer/ui-components': patch
---

`FileUpload` and `FileField` keep counting the files handed on to `onSelect` against `maxFiles` through their own renders, until the owner gives a new `files` list (or, for `FileField`, a new `value` or `uploads`). A one-file field whose owner is still arranging its upload no longer accepts a second file meanwhile.
