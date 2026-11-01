---
'@flamboyantengineer/ui-components': patch
---

`PropertyPanel` keeps its sections and their content mounted when `expandedKeys`, `defaultExpandedKeys` or `allowsMultipleExpanded` are given or removed, so drafts, focus and local state inside survive a switch to or from an accordion.
