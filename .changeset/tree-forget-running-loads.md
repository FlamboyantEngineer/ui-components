---
'@flamboyantengineer/ui-components': patch
---

`Tree` forgets a running `onLoadChildren` request when its branch leaves the items: a branch listed again under the same key asks again, and the old request's result no longer marks it loaded or shows its error.
