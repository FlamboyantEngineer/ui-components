---
'@flamboyantengineer/ui-components': patch
---

Components whose modules share hook classes declare them once, in a `<name>-hooks.ts` module, and `check:structure` rejects a second `createHooks` call with the same name.
