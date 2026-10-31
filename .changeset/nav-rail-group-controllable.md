---
'@flamboyantengineer/ui-components': patch
---

NavigationRailGroup holds its open state through the shared controllable state, so it reports only real changes (an open group pressed in a collapsed rail no longer reports `true` again) and reports the open state when the current page moves inside. Button detects a returned promise with the shared `isThenable`.
