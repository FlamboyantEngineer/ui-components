---
'@flamboyantengineer/ui-components': minor
---

The public API is now declared by the library: no exported type refers to React Aria. New shared types in the package root: `Key`, `Selection`, `SelectionMode`, `SelectionBehavior`, `Placement`, `SortDescriptor`, `SortDirection`, `PressEvent`, `HoverEvent`, `PointerType` and the prop groups `PressEventProps`, `HoverEventProps`, `FocusEventProps`, `KeyboardEventProps`, `AriaLabellingProps`, `OpenStateProps`, `SelectionProps`, `CollectionSelectionProps`, `ExpansionProps`, `OverlayPositionProps`, `OverlayDismissProps`. `npm run check:public-types` keeps it that way.

Breaking: `ElementRender` is the library's own render type; `UiProvider`'s `navigate` and `useHref` are typed `UiNavigate` and `UiHref`.
