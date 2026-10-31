---
'@flamboyantengineer/ui-components': patch
---

`Tree` keeps its props types in `tree-props.ts` and its model in `use-tree-model.ts`, and the table row's model and data cell live in their own modules, so both components sit well under the module size limit. No API changes.
