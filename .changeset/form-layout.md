---
'@flamboyantengineer/ui-components': minor
---

Add `FormLayout` and `FormLayoutDesigner` for nested form layouts. A layout is a plain tree of nodes (`id`, `type`, optional `label`, `children`, `columns`, `isLocked` and the host's untouched `data`) checked against a registry of node types with placement rules; pure helpers validate, find, insert, move, remove and update nodes while keeping every untouched node by identity. `FormLayout` draws sections, rows and grids and renders each field through its type's `render`, so a surrounding `Form` registers and validates the host's own fields as usual. `FormLayoutDesigner` adds a palette, selection, Alt+Arrow and drag-handle moves into and out of containers, Delete to remove, announcements, read-only, disabled and locked nodes, and a host inspector for the selected node, reporting each edit through `onChange(layout, change)`. Adds the `formLayout*` strings.
