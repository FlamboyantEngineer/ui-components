---
'@flamboyantengineer/ui-components': patch
---

`UiProvider` compares `messages` and `icons` by their entries. Objects written inline that hold the same entries no longer recompile the text or re-render every component below.
