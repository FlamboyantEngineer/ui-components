---
'@flamboyantengineer/ui-components': patch
---

A native form reset no longer empties FileUpload's submitted files while its list still shows them: form data keeps carrying the listed files, and the hidden input is filled again after the reset.
