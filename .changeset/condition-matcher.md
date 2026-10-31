---
'@flamboyantengineer/ui-components': minor
---

Add `createConditionMatcher({ group, fields, getValue })`, which compiles a condition tree once into a record test, as `createFilterMatcher` does for flat filters. `matchesConditionGroup` now delegates to it.
