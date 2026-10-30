---
'@flamboyantengineer/ui-components': minor
---

Dates, numbers, lists and relative times are formatted with one shared Intl formatter per locale and option set instead of building a formatter on every call, so chat times, file sizes, version and activity times, description lists, pivot tables, chart axes and relative date presets no longer rebuild one per row and render.

Render states share two core types, `InteractionState` (`isHovered`, `isPressed`, `isFocused`, `isFocusVisible`, `isDisabled`) and `SelectableState` (adds `isSelected`). `ButtonRenderState`, `MenuItemRenderState` and the link's render state extend them. Breaking: `TabRenderState`, `ComboboxOptionState` and `SelectFieldOptionState` are removed; use `SelectableState`, which has the same fields.
