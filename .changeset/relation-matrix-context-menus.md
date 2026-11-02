---
'@flamboyantengineer/ui-components': minor
---

RelationMatrix gains context menus. With `onRelationChange`, a cell's menu sets its relation to one of `kinds` or removes it, and the new `setRelation` applies the change. With `onAxisAction`, a row or column header's menu moves its item, inserts one beside it or removes it; `axisActions` limits what is offered. `RelationMatrixKind` takes a `glyph` for its mark, such as a cross for a blocking kind.
