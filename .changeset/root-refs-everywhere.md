---
'@flamboyantengineer/ui-components': minor
---

Every component that renders a root element now takes a `ref` typed with that element and forwards it there, merged with any ref of its own: the chat parts, menus and overlays, every field (through `Field`), pickers, panels, navigation, property panels, editors' parts and the rest. `ToolbarRow`'s `ref` now reaches its root instead of its strip; the new `stripRef` reaches the strip. `check:public-types` now fails when an exported component with a root element declares no `ref`.
