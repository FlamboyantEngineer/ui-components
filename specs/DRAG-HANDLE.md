# Drag Handle

`DragHandle` draws the drag button of a row in a library collection that reorders by drag and drop, such as [Tree](TREE.md) and [Table](TABLE.md). The collection names the button after its row and starts the row's keyboard drag from it; collections that draw handles render this one rather than their own. `armHandleDrag` lets a collection drag rows by their handles only, `keepHandleCellDraggable` lets a drag start from the handle's cell, and a collection can draw its own drag preview ([Table](TABLE.md#uic-table-56---drag-preview) does).

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-DRAG-HANDLE-1 - Drag handle

### UIC-DRAG-HANDLE-1.1 - Drag button

`DragHandle` shall render a button in the row's `drag` part holding the decorative built-in `drag-handle` glyph. In a draggable row the collection names it `Drag <row>`, and Enter on it starts the row's keyboard drag and drop.

Implementation: `src/components/drag-handle/drag-handle.tsx`
Verification: `src/components/drag-handle/drag-handle.test.tsx`, `e2e/drag-handle.spec.ts`

### UIC-DRAG-HANDLE-1.2 - Outside the tab sequence

The handle shall stay out of the tab sequence, since a collection reaches it with the arrow keys from its row; `excludeFromTabOrder={false}` puts it back, and an `undefined` value keeps the default.

Implementation: `src/components/drag-handle/drag-handle.tsx`
Verification: `src/components/drag-handle/drag-handle.test.tsx`, `e2e/drag-handle.spec.ts`

### UIC-DRAG-HANDLE-1.3 - Rows that cannot move

`isDisabled` shall disable the button and publish `data-disabled`, for a row that cannot move.

Implementation: `src/components/drag-handle/drag-handle.tsx`
Verification: `src/components/drag-handle/drag-handle.test.tsx`, `e2e/drag-handle.spec.ts`

### UIC-DRAG-HANDLE-1.4 - Hooks and caller attributes

`DragHandle` shall carry the hooks below, append the caller's `className` (a collection adds its own slot class this way), and forward `id`, caller `data-*` attributes and the ARIA labelling attributes.

Implementation: `src/components/drag-handle/drag-handle.tsx`
Verification: `src/components/drag-handle/drag-handle.test.tsx`

## UIC-DRAG-HANDLE-2 - Pointer drags

### UIC-DRAG-HANDLE-2.1 - Dragging by the handle only

`armHandleDrag(event)`, called on a pointer press inside a collection whose rows render without `draggable`, shall make the pressed row draggable when a primary press lands on that row's own enabled handle, until the press ends or the drag it starts ends. A press elsewhere in the row, a press with another button or a press on a disabled handle leaves the row as it is, so only the handle starts a pointer drag. React Aria keeps the handle out of pointer hit testing so that pressing it never sorts or selects, so the press is matched to the handle by position.

Implementation: `src/components/drag-handle/drag-handle.tsx`
Verification: `src/components/drag-handle/drag-handle.test.tsx`, `e2e/drag-handle.spec.ts`

### UIC-DRAG-HANDLE-2.2 - Dragging from the handle's cell

`keepHandleCellDraggable(event)`, called on a pointer press inside a collection whose rows drag from anywhere, shall keep a primary press in the grid cell that holds a row's handle from focusing that cell until the next frame, so the row takes focus instead. React Aria moves focus from a focused cell into its first control, the handle, and that move during a press cancels the browser's drag. `armHandleDrag` does the same for each press it arms. [Table](TABLE.md#uic-table-51---drag-and-drop) uses both.

Implementation: `src/components/drag-handle/drag-handle.tsx`, `src/components/table/use-table-reorder.tsx`
Verification: `src/components/drag-handle/drag-handle.test.tsx`, `e2e/table.spec.ts`

## Hooks

| Hook                 | Kind  | Values | Description                                 |
| -------------------- | ----- | ------ | ------------------------------------------- |
| `ui-drag-handle`     | root  |        | The drag button.                            |
| `data-hovered`       | state | `true` | Pointer over the button (React Aria).       |
| `data-pressed`       | state | `true` | The button is pressed (React Aria).         |
| `data-focused`       | state | `true` | The button has focus (React Aria).          |
| `data-focus-visible` | state | `true` | The button has keyboard focus (React Aria). |
| `data-disabled`      | state | `true` | The row cannot move (React Aria).           |
