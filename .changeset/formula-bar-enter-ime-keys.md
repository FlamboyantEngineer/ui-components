---
'@flamboyantengineer/ui-components': patch
---

`FormulaBar` keeps every Enter in its reference box from submitting an enclosing form, including an unchanged reference. `FindBar`, `FormulaBar` and `StepListEditor` leave keys that confirm an input method composition with key code 229 to the input method, and `StepListEditor` no longer moves a step on a composed Alt+Arrow key.
