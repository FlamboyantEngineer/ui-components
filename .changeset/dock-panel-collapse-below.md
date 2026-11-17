---
"@flamboyantengineer/ui-components": minor
---

DockPanel gains `collapseBelow`: when the parent is smaller than this along the panel's axis, the panel stays collapsed and publishes `data-collapse-forced`. Its toggle and launchers are disabled, it has no separator, and its expanded state is kept without being reported or saved. DockPanel also gains `resizableWhileCollapsed`: set it to `false` to remove the separator while the panel is collapsed.
