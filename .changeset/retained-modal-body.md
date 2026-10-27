---
'@flamboyantengineer/ui-components': minor
---

`Modal` takes `keepMounted`: once opened, a blocking or non-modal dialog stays mounted while closed, hidden and inert, so its body keeps its state, refs and editors for the next opening. A closed retained dialog is no open modal (no focus trap, scroll lock or hidden page), and each opening moves focus in and back once.
