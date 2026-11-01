---
'@flamboyantengineer/ui-components': minor
---

RichTextEditor block handle:

- Dragging a block by the `BlockHandle` grip now moves it between top-level blocks, never into a neighbouring list or quote, shows a drop line (`ui-block-handle__drop-indicator`) at the gap, and makes the move its own undo step. A cancelled drag or a drop in place changes nothing, and the handle stays on the dragged block until the drag ends.
- `BlockHandle` takes `grip` and `menu` (both default `true`) to leave out either control. The surface carries `data-gutter` only while a handle with controls is mounted, so an editor without a `BlockHandle` reserves no room for one.
