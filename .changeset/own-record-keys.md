---
'@flamboyantengineer/ui-components': patch
---

`MappingTable` accepts target and column ids such as `constructor`, `__proto__` and `toString` without crashing, and `summarizeMapping` returns `duplicates` as an object that inherits nothing.
