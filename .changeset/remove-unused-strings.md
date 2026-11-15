---
'@flamboyantengineer/ui-components': minor
---

Removes the localization strings `sign`, `moveTo` and `topLevel`, which nothing in the library reads any more, from the strings contract and every language file. A host that overrides them drops them from its `messages`.
