---
'@flamboyantengineer/ui-components': minor
---

`Link` no longer declares `onPressUp`. React Aria's link never called it, so the prop was accepted and silently ignored.
