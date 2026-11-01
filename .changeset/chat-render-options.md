---
'@flamboyantengineer/ui-components': patch
---

A chat message draws with the `renderPart`, `getReference`, `getNow` and tool renderers of the render it renders in, passed as props its memo compares by shape, instead of reading the latest ones through a ref while rendering. Unchanged messages still skip rendering while inline options are recreated.
