---
'@flamboyantengineer/ui-components': minor
---

Add `ui-components-tooling check-exports`, which fails on an export that no entry point reaches and no other module, test or script uses; `--fix` drops the exports a file still uses. Three internal names stop being exported.
