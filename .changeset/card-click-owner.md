---
'@flamboyantengineer/ui-components': patch
---

`Card`: a background click belongs to the innermost actionable card, so the cards around it no longer run their actions too, and clicks in editors (any `contenteditable` but `false`, inherited included) and in widget roles such as a roving radio no longer activate the card.
