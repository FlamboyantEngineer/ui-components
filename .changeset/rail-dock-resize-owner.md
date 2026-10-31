---
'@flamboyantengineer/ui-components': patch
---

NavigationRail and DockPanel abandon a resize drag when their persist key, storage adapter or bounds change mid-drag, as SplitView does, so the old preview is neither shown nor saved under the new key.
