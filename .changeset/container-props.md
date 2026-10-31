---
'@flamboyantengineer/ui-components': minor
---

Containers that forward their element's native props (layout primitives, `List` and its rows, `ScrollRegion`, `SplitView`, `ResizeHandle`, `FocusScope`, `OverflowList`, `TruncationTooltip`) take them through the new `ContainerProps<E>`, which leaves out `dangerouslySetInnerHTML`. `DescriptionList`, `IconLabel` and `ProseTable` declare their native props from `NativeProps` instead of React's attribute types.
