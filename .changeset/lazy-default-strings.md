---
'@flamboyantengineer/ui-components': patch
---

The built-in English text now compiles the first time a component reads it outside every provider. Importing the library or a component entry point no longer compiles all the strings at load time.
