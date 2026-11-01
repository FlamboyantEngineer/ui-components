---
'@flamboyantengineer/ui-components': patch
---

`Modal`, `Drawer` and `Popover` bodies publish their title's heading level, so automatic headings inside start at level 3 wherever the dialog opens. A nested `UiProvider` now merges `navigate` and `useHref` separately over the outer provider's.
