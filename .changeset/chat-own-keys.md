---
'@flamboyantengineer/ui-components': patch
---

`ChatQuestion`, `ChatParts` and `Chat` read question ids, tool names, part ids and message ids as own keys. A question id or tool name such as `constructor`, `__proto__` or `toString` no longer crashes the card or picks up an inherited value as a draft or renderer.
