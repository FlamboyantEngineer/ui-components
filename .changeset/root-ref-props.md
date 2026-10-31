---
'@flamboyantengineer/ui-components': minor
---

Every component that renders a root element declares its `ref` one way, through the new exported `RefProps<E>`. `Board`, `Table`, `RelationMatrix`, `RelationColumns`, `CalendarView`, `Carousel`, `Outline`, `FolderManager`, `CommentThread`, `CommentThreadReply`, `CommentComposer`, `PivotTable`, `PermissionMatrix`, `DiagramCanvas`, `TextDiff`, `MergeView`, `RedlineCompare`, `ChangeList`, `DescriptionList`, `ReactionBar`, `TreeCompare` and `StateMachineView` now take a `ref` to their root, so hosts can measure or scroll to them without a wrapper.
