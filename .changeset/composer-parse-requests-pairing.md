---
'@flamboyantengineer/ui-components': patch
---

`RichMessageComposer` aborts a trigger source's request when Escape or focus leaving closes its list, asks again when the list reopens, and drops the dismissed request's late answer. Reading a message no longer rescans the lines for each unclosed fence or the tokens for each line, so it takes linear time. `compareBlocks` (and `RedlineCompare`) weighs only nearby blocks and those sharing an uncommon word when pairing similar blocks, so unrelated paragraphs no longer form a quadratic scan.
