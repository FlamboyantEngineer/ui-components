---
'@flamboyantengineer/ui-components': patch
---

`ActionRow` keeps an action whose `onPress` returns a promise pending, and refuses its repeat presses, whether it is a button or an item of the overflow menu, and while it moves between the two. Actions take `onError` for a rejected press.
