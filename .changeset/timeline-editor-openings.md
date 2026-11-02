---
'@flamboyantengineer/ui-components': patch
---

TimelineItemEditor gives each opening its own draft: reopening an item while the closing editor's exit still runs starts from the item as it is then and saves again, instead of reusing the cancelled draft or refusing to save.
