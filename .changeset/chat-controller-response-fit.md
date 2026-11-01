---
'@flamboyantengineer/ui-components': patch
---

The chat controller ignores a response that does not fit its waiting part (a decision for a question, answers for an approval request): it no longer resolves `waitFor` or continues the reply, so a later fitting response still does.
