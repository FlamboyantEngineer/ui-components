---
'@flamboyantengineer/ui-components': patch
---

`DecisionControl` ends signing when the decision, its comment requirement or the signer's configuration changes, or the signature or picked option goes away, and needs a new Submit; a decision missing a required comment is never submitted.
