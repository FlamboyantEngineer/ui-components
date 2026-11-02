---
'@flamboyantengineer/ui-components': minor
---

`DockPanel` shows one horizontal strip of tabs (icon, label and count) beside its collapse button while expanded, and a 40 pixel rail of labelled launchers instead of icon buttons while collapsed, read bottom to top beside a side edge. Counts above 9 show `9+` and keep the full count in the accessible description. The tab strip scrolls freely with fades over its hidden edges and keeps the selected tab clear of them when the panel expands or resizes. Panes drop `title` (the tab names them) and gain a `footer`. The separator stays draggable while collapsed: one drag expands the panel at its remembered size and keeps resizing it. Size previews arrive at most once per frame through `onSizeChange`, the final size once through `onSizeChangeEnd`, and an abandoned drag calls `onSizeChangeCancel` and collapses again a panel it expanded.
