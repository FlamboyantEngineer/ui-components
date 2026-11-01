# Tree Reorder

A [Tree](TREE.md) with `reorder` lets the reader move rows: by pointer drag and drop, by React Aria's keyboard drag and drop, and with Alt+Arrow keys. The tree only reports moves; the owner applies them, usually with `applyTreeMove`, and renders the new order. The pure move rules (`getVisibleTreeRows`, `resolveTreeMove`, `resolveTreeDrop`, `resolveTreeDropMany`, `resolveTreeKeyboardMove`, `applyTreeMove`) are exported for owners and other components.

## UIC-TREE-REORDER-1 - Reorderable tree

### UIC-TREE-REORDER-1.1 - Opt-in affordances

A tree without `reorder` shall render no drag affordance: no `draggable` row, no drag handle and no `aria-keyshortcuts`. With `reorder`, a row that can move (`canMove` accepts it, every row by default, and it is not disabled) shall be draggable as a whole, carry an enabled drag handle (a [DragHandle](DRAG-HANDLE.md), named after the row and outside the tab sequence) and announce its keyboard moves in `aria-keyshortcuts`: `Alt+ArrowUp Alt+ArrowDown`, plus `Alt+ArrowLeft Alt+ArrowRight` when `canMoveInto` is set. A row that cannot move is not draggable, has a disabled drag handle and announces nothing. While the tree reorders it publishes `data-reordering`. Turning `reorder` on or off keeps every row mounted, with its focus, scroll position, selection and expansion: React Aria's drag and drop stays wired and is disabled while the tree does not reorder, so `data-allows-dragging` stays on the tree and its rows and stylesheets key reordering styles off `data-reordering`. The tree keeps the caller's `id` and `aria-describedby`, which React Aria would replace on a tree that takes drops. With `reorder.dragTrigger: 'handle'` a movable row is `draggable` only while its handle is pressed, so a press elsewhere in the row, such as in a field its actions hold, does not drag it; the default `row` keeps the row draggable as a whole.

Implementation: `src/components/tree/tree.tsx`, `src/components/tree/tree-item.tsx`, `src/components/tree/use-tree-reorder.tsx`, `src/components/tree/tree-row.tsx`
Verification: `src/components/tree/use-tree-reorder.test.tsx`, `e2e/tree-reorder.spec.ts`, `src/components/drag-handle/handle-drag-collections.test.tsx`

### UIC-TREE-REORDER-1.2 - Drag and drop

Drag and drop shall go through React Aria's `useDragAndDrop`, by pointer or from the drag handle by keyboard. A drop target is offered only where `resolveTreeDrop` allows the move: beside a movable row, or inside it (React Aria's `on` position) when the owner's `canMoveInto` accepts the row. The dragged row carries `data-dragging`; the landing spot shows as a `ui-tree__drop-indicator` row with `data-position` (`before`, `after`) and `data-drop-target`, or as `data-drop-target` on the row it would go inside. A drop shall report exactly one move through `onMove`, checked against the rows shown at that moment; a drop inside a collapsed row expands it. A drag that ends without a drop or that did not start in the tree reports nothing, and so does one that carries several selected rows unless the owner takes them ([UIC-TREE-REORDER-1.4](#uic-tree-reorder-14---several-rows)). The browser draws the drag image. Primitive drag keys are decoded before resolving moves, so numeric and text keys remain distinct in single and multiple moves. A row whose name field is open (UIC-TREE-7.1) neither drags nor offers its handle until the rename ends, so a press in the field selects its text.

Implementation: `src/components/tree/use-tree-reorder.tsx`, `src/utils/use-reorder-drag-and-drop.ts`, `src/utils/tree-reorder.ts`
Verification: `src/components/tree/use-tree-reorder.test.tsx`, `e2e/tree-reorder.spec.ts`, `src/components/drag-handle/handle-drag-collections.test.tsx`

### UIC-TREE-REORDER-1.3 - Alt+Arrow moves

With a movable row focused, Alt+ArrowUp and Alt+ArrowDown shall report a move past the neighbouring movable sibling and, at either end, prevent the key and move nothing. With `canMoveInto`, Alt+ArrowRight shall move the row into the sibling above it as its last child (expanding it) and Alt+ArrowLeft just after its parent, each under the same consent, and claim the key where the row cannot go; right to left, the two keys swap. Alt+Arrow on a row that cannot move, Alt+ArrowLeft and Alt+ArrowRight without `canMoveInto`, and arrows with other modifiers stay React Aria's. An owner key hook (`onItemKeyDown`) sees the key first. The moved row keeps focus across the owner's re-render.

Implementation: `src/components/tree/use-tree-reorder.tsx`, `src/components/tree/use-tree-key-down.ts`, `src/utils/tree-reorder.ts`
Verification: `src/components/tree/use-tree-reorder.test.tsx`, `e2e/tree-reorder.spec.ts`

### UIC-TREE-REORDER-1.4 - Several rows

With `onMoveMany`, dragging a row that belongs to a multiple selection shall drag the selected rows together, by pointer or by keyboard. A drop target is offered only where `resolveTreeDropMany` lets every row land, and the drop shall report its moves once through `onMoveMany`, in the order they apply (applying them one after the other with `applyTreeMove` gives the result); a drop inside a collapsed row expands it. Alt+Arrow keys still move the focused row alone.

Implementation: `src/components/tree/use-tree-reorder.tsx`, `src/utils/tree-reorder.ts`
Verification: `src/components/tree/use-tree-reorder.test.tsx`, `e2e/tree-reorder.spec.ts`

## UIC-TREE-REORDER-2 - Move rules

### UIC-TREE-REORDER-2.1 - Visible rows

`getVisibleTreeRows(items, options)` shall list the rows a tree shows, in order: each with its key, its parent's key (`null` at the top level), the item, whether it can move (`isMovable`, every row by default) and whether its children are listed below it (expanded with children). Children come from `getChildren`, the item's `children` by default.

Implementation: `src/utils/tree-reorder.ts`
Verification: `src/utils/tree-reorder.test.ts`

### UIC-TREE-REORDER-2.2 - Allowed moves

`resolveTreeMove(rows, move, rules)` shall return the move (`{ key, targetKey, position }`), or `null` when the row or the target is missing or cannot move, when the target is the row itself or one of its descendants, when the move lands inside the parent the row is already in or in the slot it already holds, or when it lands under another parent (a different sibling list or inside a row) without `rules.canMoveInto` accepting the row there (`null` for the top level).

Implementation: `src/utils/tree-reorder.ts`
Verification: `src/utils/tree-reorder.test.ts`, `e2e/tree-reorder.spec.ts`

### UIC-TREE-REORDER-2.3 - Drops

`resolveTreeDrop(rows, move, rules)` shall apply the same rules and also refuse a drop just after a row whose children are listed below it, where a line would read as inside that row.

Implementation: `src/utils/tree-reorder.ts`
Verification: `src/utils/tree-reorder.test.ts`

### UIC-TREE-REORDER-2.4 - Keyboard moves

`resolveTreeKeyboardMove(rows, { key, direction }, rules)` shall return, for `up` and `down`, the move past the neighbouring movable sibling or `null` at either end; for `in`, the move inside the sibling above; for `out`, the move just after the parent, each `null` where refused. It shall return `undefined` when the chord is not a move for that row: the row cannot move, or `in` and `out` without `canMoveInto`.

Implementation: `src/utils/tree-reorder.ts`
Verification: `src/utils/tree-reorder.test.ts`

### UIC-TREE-REORDER-2.5 - Applying a move

`applyTreeMove(items, move)` shall return new nested items with the row placed before, after or inside (last child of) its target, leaving the input unchanged and keeping the identity of subtrees the move does not touch. A move whose row or target is missing, or whose target lies inside the moved row, returns the items as they were.

Implementation: `src/utils/tree-reorder.ts`
Verification: `src/utils/tree-reorder.test.ts`

### UIC-TREE-REORDER-2.6 - Drops of several rows

`resolveTreeDropMany(rows, { keys, targetKey, position }, rules)` shall return the moves a drop of several rows makes, in the order they apply: the first dragged row (in the order shown) lands where the drop says and each other row just after the row before it, so the rows keep their order. Rows inside another dragged row move with it and get no move of their own. It returns `null` when a row cannot move, when the target is a dragged row or inside one, when a row may not enter the target's parent (or the target, for `inside`) under `rules.canMoveInto`, when the drop lands just after a row whose children are listed, or when the rows already sit together in that order at that spot.

Implementation: `src/utils/tree-reorder.ts`
Verification: `src/utils/tree-reorder.test.ts`
