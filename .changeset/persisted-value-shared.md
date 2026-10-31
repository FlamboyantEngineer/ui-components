---
'@flamboyantengineer/ui-components': minor
---

`NavigationRail`, `Tabs`, `DockPanel` and `SplitView` persist their uncontrolled values through one shared helper, so a controlled value is never stored, every change is reported and an unreadable stored value falls back to the default in all four. `DockPanel` now stores its selection, expanded state and size under `<persistKey>:selected`, `<persistKey>:expanded` and `<persistKey>:size` instead of one object under `persistKey`, so a panel restores its defaults once after upgrading.
