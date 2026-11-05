# Form Layout

`FormLayout` draws a nested form layout, a tree of sections, rows and grids around fields, and `FormLayoutDesigner` edits one: a palette of nodes to add, a canvas where nodes are selected, moved and removed, and the host's inspector for the selected node. Both read the same plain layout tree and the same registry of node types, whose `render` callbacks draw the host's own fields, so the library adds no field system: inside a [Form](FORM.md) every field registers, validates and submits as it always does. The host owns persistence, schema ids, its field registry, permissions, workflows and history; the tree helpers below are pure functions the host may also call.

## UIC-FORM-LAYOUT-1 - Layout tree

### UIC-FORM-LAYOUT-1.1 - Nodes

A layout (`FormLayoutValue`) shall be an array of top-level nodes. A node (`FormLayoutNode`) has an `id` unique within the layout, a `type` naming a key of the layout's `types`, and optionally a `label`, `children` (on containers only), a grid's `columns`, `isLocked` and the host's `data`, which the library carries untouched. A type (`FormLayoutType`) has a `label`, an `arrangement` (`stack`, `row` or `grid`) when it is a container, an `accepts(type)` placement rule for its children, and a `render(node, { mode, children })` callback.

Implementation: `src/components/form-layout/form-layout-tree.ts`, `src/components/form-layout/form-layout-types.ts`
Verification: `src/components/form-layout/form-layout-tree.test.ts`

### UIC-FORM-LAYOUT-1.2 - Rules and validation

`validateFormLayout(layout, { types, rootAccepts })` shall list every rule the layout breaks, in document order, as `{ id, reason }`: `duplicate-id` for an id seen before, `unknown-type` for a type `types` lacks, `not-container` for children on a type without an arrangement, and `placement` for a node its container's `accepts`, or the top level's `rootAccepts`, refuses. Both rules take every type by default.

Implementation: `src/components/form-layout/form-layout-tree.ts`
Verification: `src/components/form-layout/form-layout-tree.test.ts`

### UIC-FORM-LAYOUT-1.3 - Edits

`insertFormLayoutNode`, `moveFormLayoutNode`, `removeFormLayoutNode` and `updateFormLayoutNode` shall return a new layout that keeps every node they do not change, by identity, with its id and `data`. A place (`FormLayoutPlace`) is a container's id, or null for the top level, and an index; a move's index counts the container's children without the moved node. `canPlaceFormLayoutNode` refuses a place whose container is missing, is not a container or refuses the type, and a move of a locked node or of a node into itself. `nextFormLayoutPlace` gives the next place in document order, through and out of containers, that the node's type may go to.

Implementation: `src/components/form-layout/form-layout-tree.ts`
Verification: `src/components/form-layout/form-layout-tree.test.ts`

### UIC-FORM-LAYOUT-1.4 - Adapter boundary

The tree shall be the only contract between the host's schema and the library. A host maps each schema element to a node with the schema's own id and keeps its domain metadata in `data`; it maps the tree back after `onChange`, finding each element by its id. The library imposes no serialization format, never creates an id (a palette entry's `create` does) and never reads `data`.

Implementation: `src/components/form-layout/form-layout-tree.ts`, `src/components/form-layout/form-layout.tsx`
Verification: `src/components/form-layout/form-layout.test.tsx`, `src/components/form-layout/form-layout-tree.test.ts`

## UIC-FORM-LAYOUT-2 - Renderer

### UIC-FORM-LAYOUT-2.1 - Structure

`FormLayout` shall render a root (`ui-form-layout`) with one `ui-form-layout__node` per node, publishing its `type` as `data-type`, `data-container` on containers and its id as `data-key`. A container's children sit in `ui-form-layout__children`, which publishes the type's `data-arrangement` and, for a node with `columns`, the measured property `--ui-form-layout-columns`. A container type without `render` draws its label in `ui-form-layout__title` and is a group named by it; a leaf without `render` draws its label. The root appends the caller's `className` and forwards `id`, `ref` and caller `data-*` attributes.

Implementation: `src/components/form-layout/form-layout.tsx`
Verification: `src/components/form-layout/form-layout.test.tsx`, `e2e/form-layout.spec.ts`

### UIC-FORM-LAYOUT-2.2 - Fields through Form

Each node shall draw through its type's `render` with `mode: 'render'`, and a container's `render` places the `children` it is given. Fields the host draws are its own field components, so a `Form` around the layout registers them, validates them on submit, focuses the first invalid one and submits their values as it does for any field.

Implementation: `src/components/form-layout/form-layout.tsx`
Verification: `src/components/form-layout/form-layout.test.tsx`

## UIC-FORM-LAYOUT-3 - Designer

### UIC-FORM-LAYOUT-3.1 - Structure

`FormLayoutDesigner` shall render a root (`ui-form-layout-designer`), then, while editable and given a `palette`, a group named by the provider string `formLayoutPalette` (`ui-form-layout-designer__palette`) of entries (`ui-form-layout-designer__palette-item`, each a button with the entry's label). The canvas (`ui-form-layout-designer__canvas`) is a group named by `aria-label` or the provider string `formLayoutCanvas`; while the layout is empty it publishes `data-empty`, holds `ui-form-layout-designer__empty` with the provider string `formLayoutEmpty` and takes focus itself. Each node (`ui-form-layout-designer__node`) is a focusable group named by its label, with a header (`ui-form-layout-designer__header`: the drag handle `ui-form-layout-designer__handle` named by `formLayoutMove`, the label `ui-form-layout-designer__title` and the Remove button `ui-form-layout-designer__remove` named by `formLayoutRemove`) and a body (`ui-form-layout-designer__body`) drawn by the type's `render` with `mode: 'design'`. A container's children sit in `ui-form-layout-designer__children`, as in the renderer, ending with a drop target (`ui-form-layout-designer__slot`, named by `formLayoutDropAtEnd`). The selected node's inspector follows the canvas in `ui-form-layout-designer__inspector`.

Implementation: `src/components/form-layout/form-layout-designer.tsx`, `src/components/form-layout/form-layout-designer-node.tsx`
Verification: `src/components/form-layout/form-layout-designer.test.tsx`, `e2e/form-layout.spec.ts`

### UIC-FORM-LAYOUT-3.2 - Value and selection

The layout shall follow `value` with `onChange`, or start at `defaultValue` (empty by default); each edit calls `onChange(layout, change)`, where `change` is `{ kind: 'move' | 'insert', id, place }` or `{ kind: 'remove' | 'update', id }`. The selected node follows `selectedId` with `onSelectionChange`, or `defaultSelectedId`. Clicking a node, or anywhere in its body outside a nested node, selects it, and so does focusing it. The selected node publishes `data-selected` and `aria-current="true"` and is the canvas's one Tab stop, the first node when none is selected.

Implementation: `src/components/form-layout/use-form-layout-designer.ts`, `src/components/form-layout/form-layout-designer-node.tsx`
Verification: `src/components/form-layout/form-layout-designer.test.tsx`

### UIC-FORM-LAYOUT-3.3 - Keyboard

On a focused node, ArrowUp, ArrowDown, Home and End shall focus and select the previous, next, first and last node in document order; Alt+ArrowUp and Alt+ArrowDown move it to the previous or next place its type may go to (UIC-FORM-LAYOUT-1.3), into and out of containers; Delete and Backspace remove it and focus its next sibling, else the one before, else its container, else the canvas. Every node is described by the provider string `formLayoutKeys`. Keys pressed in a field of a node's body, and keys an input method composes, stay with them. Each move, insert and removal is announced in the visually hidden status (`ui-form-layout-designer__status`, `role="status"`) with `formLayoutMoved`, `formLayoutAdded` or `formLayoutRemoved`, naming the container (or `formLayoutTopLevel`) and the position counted from 1, and focus follows the moved or added node.

Implementation: `src/components/form-layout/form-layout-designer-node.tsx`, `src/components/form-layout/use-form-layout-designer.ts`
Verification: `src/components/form-layout/form-layout-designer.test.tsx`, `e2e/form-layout.spec.ts`

### UIC-FORM-LAYOUT-3.4 - Drag and drop

A node shall drag only from its handle: a pointer press on the handle arms the node, so pressing, selecting text or typing in a field of its body never starts a drag; the handle's press also starts a keyboard and screen reader drag. A drag over a node offers the place before or after it, by the pointer's half along its container's arrangement (above or below in a stack, left or right in a row or grid), published as `data-position` (`before`, `after`), and over a container's end slot the end of that container (`data-drop-target`). A drop lands only where `canPlaceFormLayoutNode` allows; a refused or cancelled drop, or a drop on the node's own place, leaves the layout as it was. Each designer's drags carry their own media type, so another designer refuses them. A palette entry drags too, adding a node of its type where it drops.

Implementation: `src/components/form-layout/use-form-layout-drag.ts`, `src/components/form-layout/form-layout-designer-node.tsx`
Verification: `src/components/form-layout/form-layout-designer.test.tsx`, `e2e/form-layout.spec.ts`

### UIC-FORM-LAYOUT-3.5 - Palette and inspector

Pressing a palette entry shall add the node its `create` returns into the selected container at its end, else after the selected node, else at the end of the top level, taking the first of these the rules allow; an entry whose node's id the layout already holds adds nothing. `renderInspector(node, update)` draws the selected node's properties, for example as a [Property Panel](PROPERTY-PANEL.md), and `update(node)` replaces it in the layout.

Implementation: `src/components/form-layout/use-form-layout-designer.ts`, `src/components/form-layout/form-layout-designer.tsx`
Verification: `src/components/form-layout/form-layout-designer.test.tsx`, `e2e/form-layout.spec.ts`

### UIC-FORM-LAYOUT-3.6 - Locked, read-only, disabled and independent designers

A locked node (`isLocked`) shall publish `data-locked` and draw no handle and no Remove button, and neither keys nor drops move or remove it. A read-only designer (`isReadOnly`, publishing `data-read-only`) and a disabled one (`isDisabled`, `data-disabled`) draw no palette, handles, Remove buttons or end slots and refuse every edit, while nodes stay selectable. The root appends the caller's `className` and forwards `id`, `ref` and caller `data-*` attributes. Each designer holds its own layout, selection and drags, so several on a page are independent.

Implementation: `src/components/form-layout/form-layout-designer.tsx`, `src/components/form-layout/form-layout-designer-node.tsx`
Verification: `src/components/form-layout/form-layout-designer.test.tsx`

## Hooks

| Hook                                    | Kind      | Values                 | Description                                               |
| --------------------------------------- | --------- | ---------------------- | --------------------------------------------------------- |
| `ui-form-layout`                        | root      |                        | The drawn layout.                                         |
| `ui-form-layout__node`                  | slot      |                        | One node.                                                 |
| `ui-form-layout__title`                 | slot      |                        | A container's label, without a `render` of its own.       |
| `ui-form-layout__children`              | slot      |                        | A container's children.                                   |
| `ui-form-layout-designer`               | root      |                        | The designer.                                             |
| `ui-form-layout-designer__palette`      | slot      |                        | The palette of nodes to add.                              |
| `ui-form-layout-designer__palette-item` | slot      |                        | One palette entry.                                        |
| `ui-form-layout-designer__canvas`       | slot      |                        | The canvas.                                               |
| `ui-form-layout-designer__empty`        | slot      |                        | The note in an empty canvas.                              |
| `ui-form-layout-designer__node`         | slot      |                        | One node in the canvas.                                   |
| `ui-form-layout-designer__header`       | slot      |                        | A node's handle, label and Remove button.                 |
| `ui-form-layout-designer__handle`       | slot      |                        | A node's drag handle (also `ui-button`).                  |
| `ui-form-layout-designer__title`        | slot      |                        | A node's label.                                           |
| `ui-form-layout-designer__remove`       | slot      |                        | A node's Remove button (also `ui-button`).                |
| `ui-form-layout-designer__body`         | slot      |                        | A node's preview, drawn by its type.                      |
| `ui-form-layout-designer__children`     | slot      |                        | A container's children in the canvas.                     |
| `ui-form-layout-designer__slot`         | slot      |                        | The drop target at a container's end.                     |
| `ui-form-layout-designer__inspector`    | slot      |                        | The host's inspector for the selected node.               |
| `ui-form-layout-designer__status`       | slot      |                        | The visually hidden announcement of the last edit.        |
| `data-key`                              | attribute |                        | On a node and a palette entry: its id or key.             |
| `data-type`                             | attribute |                        | On a node: its type key.                                  |
| `data-container`                        | state     | `true`                 | On a node: its type holds children.                       |
| `data-arrangement`                      | attribute | `stack`, `row`, `grid` | On a container's children: how they are laid out.         |
| `--ui-form-layout-columns`              | property  |                        | On a container's children: the node's `columns`.          |
| `data-selected`                         | state     | `true`                 | On a designer node: it is selected.                       |
| `data-locked`                           | state     | `true`                 | On a designer node: it cannot be moved or removed.        |
| `data-dragging`                         | state     | `true`                 | On a designer node or palette entry: it is being dragged. |
| `data-position`                         | attribute | `before`, `after`      | On a designer node: where a drop over it lands.           |
| `data-drop-target`                      | state     | `true`                 | On an end slot: a drop over it lands there.               |
| `data-empty`                            | state     | `true`                 | On the canvas: the layout has no nodes.                   |
| `data-read-only`                        | state     | `true`                 | On the designer: it refuses edits.                        |
| `data-disabled`                         | state     | `true`                 | On the designer: it is disabled.                          |
