---
'@flamboyantengineer/ui-components': patch
---

`NumberField` no longer reports a large value on the step grid as off the step: with `step={0.01}`, values such as `113620.68` showed "Enter a value in steps of 0.01" and blocked their form.
