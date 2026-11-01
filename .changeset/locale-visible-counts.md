---
'@flamboyantengineer/ui-components': minor
---

Visible counts now use the provider locale's digits and grouping. `formatCount(count, locale, options)` takes the locale as its second argument, and Badge, Tabs, SegmentedChoice, NavigationRail, Board, RelationColumns and RelationMatrix pass the provider locale. Board limits read through the new `cardCountOfLimit` string, and the donut tooltip value through `donutValue`.
