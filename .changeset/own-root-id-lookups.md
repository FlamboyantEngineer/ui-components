---
'@flamboyantengineer/ui-components': patch
---

CompletionList, multiple Combobox chip labels and Card's More focus return find their ids in the component's own tree (its shadow root, else its document), so they work inside web components and never pick a same-id element outside.
