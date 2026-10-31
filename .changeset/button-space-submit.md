---
'@flamboyantengineer/ui-components': patch
---

A submit or reset `Button` whose action returns a promise now submits or resets its form when Space starts the action, as pointer and Enter presses already did; repeat activations stay refused until the action settles.
