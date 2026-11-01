---
'@flamboyantengineer/ui-components': patch
---

`TransitionMenu` checks a transition when it runs: a menu the host disabled, or a transition removed or made unavailable, runs nothing, and an open confirmation or comment dialog closes when its transition is revoked, the record changes state, or the transition's target, comment requirement or message changes.
