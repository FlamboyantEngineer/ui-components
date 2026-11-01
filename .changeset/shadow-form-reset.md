---
'@flamboyantengineer/ui-components': patch
---

Fields, the shared native reset hook and FileUpload now listen for a form's `reset` and `formdata` events at the root of their tree, so forms inside shadow roots reset, cancel and submit their files as they do in the document.
