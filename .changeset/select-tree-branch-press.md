---
'@flamboyantengineer/ui-components': minor
---

`SelectField` in tree mode: a press, Enter or Space on a branch row now opens or closes it instead of choosing it, and only leaves are chosen by default. In a multiple choice, a branch's checkbox chooses its leaves, and a branch whose leaves are all chosen still shows as one row and one chip. Pass the new `selectableBranches` prop to choose branches: a press on an open branch chooses it.
