---
'@flamboyantengineer/ui-components': patch
---

An uncaptured pointer gesture (a toast swipe before it passes its slop, a diagram node press) released outside its element now ends instead of continuing on a later move with the button up, and the next press is no longer refused. `AssetPicker` searches again when its `search` function changes and never derives a width or height below one pixel. `ScrollOverview` keeps its observers and measurements when equal markers are written inline, and `NumberField` sorts its preset steps once per change.
