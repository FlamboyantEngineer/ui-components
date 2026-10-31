---
'@flamboyantengineer/ui-components': patch
---

`createCodeBlockOverride` reads `tokenizers` from its own entries only, so a fence language such as `constructor`, `toString` or `__proto__` draws plain code instead of crashing the render. A tokenizer deliberately registered under such a name still highlights.
