---
'@flamboyantengineer/ui-components': patch
---

A `Timeline` drag is given up when the host replaces its item's days or kind, or the scale or direction changes, mid-drag. Releasing it no longer reports a change built on the old days that would overwrite the newer ones.
