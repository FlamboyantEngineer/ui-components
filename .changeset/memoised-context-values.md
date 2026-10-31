---
'@flamboyantengineer/ui-components': patch
---

Tabs, toolbar rows, dock panels, modals, the command palette, comment threads, condition builders, dashboard grids and annotation layers hand their parts the same context values while their inputs stay the same. Scrolling a tab list no longer draws its tabs again, editing a condition rule draws only that rule, a dashboard preview draws only the tiles it moves, and an annotation layer no longer measures its targets after its own state changes.
