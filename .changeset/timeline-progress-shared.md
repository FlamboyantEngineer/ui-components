---
'@flamboyantengineer/ui-components': patch
---

The `Timeline` table view reads progress as the chart does: a missing or non-finite value (`NaN`, either infinity) shows no progress instead of `NaN%` or `100%`, and finite values are clamped to 0 to 100%.
