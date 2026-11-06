---
'@flamboyantengineer/ui-components': minor
---

Add `ConstraintEditor`, a property panel that authors a field's constraints by kind (`text`, `number`, `date`, `options`): required, a default, bounds, text lengths and pattern, and option counts. Unset constraints stay apart from `false`, `0` and empty text; numeric bounds stay decimal text and compare exactly (`compareDecimalText`) or through a host `compare`. `validateConstraints` reports conflicts such as a maximum below the minimum on the control they belong to, without repairing anything; host errors map back through `errors`, and `lockedConstraints` and `renderConstraint` cover inherited constraints and custom controls. Adds the `constraint*` strings in every language file.
