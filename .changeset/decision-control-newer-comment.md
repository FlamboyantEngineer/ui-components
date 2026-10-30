---
'@flamboyantengineer/ui-components': patch
---

`DecisionControl` clears its comment after a successful submission only while the decision and the comment are still the ones submitted. A comment typed or a decision picked while the submission was pending now stays. A submission that settles after the control unmounts changes nothing.
