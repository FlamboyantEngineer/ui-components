# Diagram Canvas

`DiagramCanvas` draws a diagram of nodes joined by edges on a pannable, zoomable surface, for block diagrams, flows, dependency graphs and state machines. The caller renders each node's content and owns the data: nodes (`{ id, x, y, width?, height?, label, ports?, data }`) and edges (`{ id, source, target, sourcePort?, targetPort?, label? }`) are plain data, and every change the reader makes arrives through a callback (`onNodesChange`, `onEdgesChange`, `onConnect`, `onNodeAdd`) for the caller to apply. Edges are SVG paths routed by `routeDiagramEdge`, a pure function. Nodes are named, focusable groups; the reader selects them, moves between connected nodes from the keyboard and, in edit mode, moves, connects, adds and removes them by pointer or keyboard; an outline view lists the same diagram as text. The canvas is library-owned and needs no diagram engine. A [State Machine View](STATE-MACHINE-VIEW.md) draws states and transitions on it.

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-DIAGRAM-CANVAS-1 - Structure

### UIC-DIAGRAM-CANVAS-1.1 - Root and parts

`DiagramCanvas` shall render a `<div role="group">` root (`ui-diagram-canvas`) named by `aria-label`, `aria-labelledby` or the provider's `diagram` string, publishing the view (`canvas` or `outline`) in `data-view` and the edge routing in `data-routing`. It holds a toolbar (`ui-diagram-canvas__toolbar`), the palette when given (UIC-DIAGRAM-CANVAS-5.3), then the viewport (`ui-diagram-canvas__viewport`) in the canvas view or the outline (UIC-DIAGRAM-CANVAS-6.4), and a visually hidden live region (`ui-diagram-canvas__status`, `role="status"`). The viewport clips nothing itself (the host stylesheet sizes it and hides its overflow) and holds the content layer (`ui-diagram-canvas__content`), which the viewport's pan and zoom place with an inline `transform`. A diagram without nodes shows the provider's `diagramEmpty` string in `ui-diagram-canvas__empty`.

Implementation: `src/components/diagram-canvas/diagram-canvas.tsx`, `src/core/strings/diagram.ts`
Verification: `src/components/diagram-canvas/diagram-canvas.test.tsx`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-1.2 - Nodes

Each node shall render, in the order of `nodes`, as a `ui-diagram-canvas__node` positioned in the content layer at its `x` and `y` with its `width` and `height` (160 by 48 pixels by default). Its content is `renderNode(node, { isSelected, isEditing })`, or else its `label` in `ui-diagram-canvas__node-label`. A node renders again only when its own data or state changes: while nodes are dragged, `renderNode` runs for them alone and only the edges touching them are routed again.

Numeric and text keys with the same spelling shall identify distinct nodes and edges in both views, including after reordering. The bounds shall hold for a diagram of any size (200 000 nodes included).

Implementation: `src/components/diagram-canvas/diagram-node.tsx`, `src/components/diagram-canvas/diagram-model.ts`, `src/components/diagram-canvas/diagram-canvas.tsx`, `src/components/diagram-canvas/diagram-edges.tsx`
Verification: `src/components/diagram-canvas/diagram-canvas.test.tsx`, `src/components/diagram-canvas/diagram-model.test.ts`, `src/components/diagram-canvas/diagram-node.test.tsx`

### UIC-DIAGRAM-CANVAS-1.3 - Ports

Each of a node's `ports` shall render as a `ui-diagram-canvas__port` centred on the node's edge, on its `side` (`data-side`: `top`, `right`, `bottom` or `left`) at its `position` along that side (`0.5` by default). Outside edit mode a port is a decorative mark; in edit mode it is a button named by the provider's `diagramPortLabel` string with the node's label and the port's `label`.

Implementation: `src/components/diagram-canvas/diagram-port.tsx`
Verification: `src/components/diagram-canvas/diagram-canvas.test.tsx`

### UIC-DIAGRAM-CANVAS-1.4 - Hooks and caller attributes

`DiagramCanvas` shall carry the hooks below, append the caller's `className` and forward its `id`, `ref` and `data-*` attributes to the root.

Implementation: `src/components/diagram-canvas/diagram-canvas.tsx`, `src/components/diagram-canvas/diagram-hooks.ts`, `labs/reference/diagram-canvas.css`
Verification: `src/components/diagram-canvas/diagram-canvas.test.tsx`

## UIC-DIAGRAM-CANVAS-2 - Edges

### UIC-DIAGRAM-CANVAS-2.1 - Routing

`routeDiagramEdge({ source, target, routing, offset })` shall return an edge's SVG path, a closed arrowhead whose tip is the target end, and the middle of the path for its label. `straight` joins the ends with a line between the points where the line between the boxes' centres leaves each box; `orthogonal` leaves each end along its side and runs in horizontal and vertical segments, turning in the middle or once at a corner, and going around when the ends cannot face each other, such as ports on the same side or a target behind the source: the detour crosses over in the middle when that clears both boxes, else takes the shortest way that does, over a lane 20 pixels outside them or out past both boxes on the ports' side, and never crosses either box when such a way exists; `bezier` (the default) curves out of each side. An end may be a bare point, as the preview of a connection is. The canvas draws edges in an SVG layer (`ui-diagram-canvas__edges`, hidden from assistive technology) under the nodes: each edge is a `ui-diagram-canvas__edge` group holding its path (`ui-diagram-canvas__edge-path`), its arrowhead (`ui-diagram-canvas__edge-arrow`) and a pointer target along the path (`ui-diagram-canvas__edge-hit`), with its `label` above the layer in `ui-diagram-canvas__edge-label`. Edges whose ends match no node are not drawn.

Implementation: `src/components/diagram-canvas/edge-route.ts`, `src/components/diagram-canvas/edge-anchors.ts`, `src/components/diagram-canvas/orthogonal-route.ts`, `src/components/diagram-canvas/diagram-edges.tsx`
Verification: `src/components/diagram-canvas/edge-route.test.ts`, `src/components/diagram-canvas/diagram-canvas.test.tsx`

### UIC-DIAGRAM-CANVAS-2.2 - Ports as ends

An edge end with a port shall start at the port's point and leave along its side; an end without one uses the middle of the side that faces the other end (or, for a straight edge, the boundary point).

Implementation: `src/components/diagram-canvas/edge-route.ts`, `src/components/diagram-canvas/diagram-edges.tsx`
Verification: `src/components/diagram-canvas/edge-route.test.ts`, `src/components/diagram-canvas/diagram-canvas.test.tsx`

### UIC-DIAGRAM-CANVAS-2.3 - Parallel edges and loops

Edges between the same two nodes shall be spread 24 pixels apart around the line between them, each shifted to the right of its own direction of travel, so an edge and its reverse never overlap. An end without a port slides along its side by the offset, easing toward the side's corners past half the room so it stays on its box and keeps its own place, however many edges or however small the box. A port end never moves: a curved edge bends through a middle point moved by what the ends did not slide, leaving and reaching each port along its side, and an orthogonal edge moves its middle run, its detour lane, or a notch at its corner by its offset (between ports in line, it jogs to a lane its offset away). A straight edge between the same two ports has only one line, so parallel ones share it and each moves its label by its offset instead. An edge from a node to itself loops over the node's top; each further loop on the node starts and ends at the same points and reaches 24 pixels higher and 12 wider, with its label above the last. Every route and label stays apart this way, so each edge keeps its own pointer target and label. Edges group as parallel only when their endpoint keys match in type and spelling, delimiters included, and a group of any size (tens of thousands of edges) spreads in edge order.

Implementation: `src/components/diagram-canvas/edge-route.ts`, `src/components/diagram-canvas/edge-anchors.ts`, `src/components/diagram-canvas/orthogonal-route.ts`, `src/components/diagram-canvas/diagram-model.ts`
Verification: `src/components/diagram-canvas/edge-route.test.ts`, `src/components/diagram-canvas/diagram-model.test.ts`, `e2e/diagram-canvas.spec.ts`

## UIC-DIAGRAM-CANVAS-3 - Pan and zoom

### UIC-DIAGRAM-CANVAS-3.1 - Panning

The viewport (`{ x, y, zoom }`: the pan offset in screen pixels and the zoom in percent) shall be `viewport` (controlled) or held from `defaultViewport`, and every change calls `onViewportChange`. Dragging the background pans the view, and so does the wheel without a modifier. The wheel counts its steps in pixels, a line as 16 pixels and a page as the viewport's size. A wheel that a scrollable element inside a node can still scroll in its direction, or that a handler inside already consumed, belongs to that element and leaves the view alone; at the element's end the wheel pans again.

Implementation: `src/components/diagram-canvas/use-diagram-viewport.ts`, `src/components/diagram-canvas/use-background-pointer.ts`, `src/utils/wheel-scroll.ts`
Verification: `src/components/diagram-canvas/diagram-canvas.test.tsx`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-3.2 - Zooming

The wheel with Ctrl or Command shall zoom around the pointer, even over a scrollable element inside a node, unless a handler inside consumed it; the toolbar's [Zoom Control](ZOOM-CONTROL.md) (`ui-diagram-canvas__zoom`, resetting to 100%) and the `+` and `-` keys anywhere in the viewport, except in a field, a slider or editable content inside a node or when a control inside already consumed the key, step through its levels around the middle of the view. The zoom stays between 25% and 400%.

Implementation: `src/components/diagram-canvas/use-diagram-viewport.ts`, `src/components/diagram-canvas/diagram-toolbar.tsx`, `src/components/diagram-canvas/diagram-canvas.tsx`, `src/utils/is-editable-target.ts`
Verification: `src/components/diagram-canvas/diagram-canvas.test.tsx`, `src/components/diagram-canvas/diagram-model.test.ts`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-3.3 - Fitting

The toolbar's fit button (`ui-diagram-canvas__fit`, an [Icon Button](BUTTON.md) named by the provider's `diagramFit` string, disabled without nodes) shall centre every node in the view with 24 pixels around them, zoomed as far as fits but never above 100%. Without `viewport` or `defaultViewport`, the canvas fits once the viewport is first measured.

Implementation: `src/components/diagram-canvas/use-diagram-viewport.ts`, `src/components/diagram-canvas/diagram-model.ts`, `src/components/diagram-canvas/diagram-toolbar.tsx`
Verification: `src/components/diagram-canvas/diagram-canvas.test.tsx`, `src/components/diagram-canvas/diagram-model.test.ts`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-3.4 - Focused nodes stay in view

A node that receives focus, or moves while focused (focus read through open shadow roots, so a canvas inside one follows too), shall pan the view the least that brings it 16 pixels inside the viewport.

Implementation: `src/components/diagram-canvas/use-diagram-viewport.ts`, `src/components/diagram-canvas/diagram-node.tsx`
Verification: `src/components/diagram-canvas/diagram-canvas.test.tsx`

### UIC-DIAGRAM-CANVAS-3.5 - Minimap

Unless `showMinimap` is false, the viewport shall hold a minimap (`ui-diagram-canvas__minimap`, an SVG hidden from assistive technology) drawing every node (`ui-diagram-canvas__minimap-node`, with `data-selected`) and the part of the diagram in view (`ui-diagram-canvas__minimap-viewport`). Pressing or dragging on it centres the view on that point.

Implementation: `src/components/diagram-canvas/diagram-minimap.tsx`
Verification: `src/components/diagram-canvas/diagram-canvas.test.tsx`, `e2e/diagram-canvas.spec.ts`

## UIC-DIAGRAM-CANVAS-4 - Selection and moving

### UIC-DIAGRAM-CANVAS-4.1 - Selection

The selected nodes and edges shall be `selectedKeys` (controlled) or held from `defaultSelectedKeys`, reported through `onSelectionChange`, in `selectionMode` (`multiple` by default, `single` or `none`). A press on a node or an edge selects it alone; with Shift, Ctrl or Command it adds or removes it; Space on a focused node does the same; a press on the background that does not move clears the selection. The canvas shows and acts on the effective selection, which follows the current mode: nothing in `none`, only the first selected item in `single` (the first node for `'all'`), and only ids of nodes and edges that exist. Moving and removing use it, so a selection held from another mode never widens an edit. The held or controlled selection is not rewritten nor reported when the mode or the items change: it returns in full when the mode widens again, and the next selection change starts from the effective one. Selected nodes, edges and their labels publish `data-selected`.

Implementation: `src/components/diagram-canvas/use-diagram-selection.ts`, `src/components/diagram-canvas/diagram-node.tsx`, `src/components/diagram-canvas/diagram-edges.tsx`
Verification: `src/components/diagram-canvas/diagram-node.test.tsx`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-4.2 - Marquee

In multiple selection, a Shift drag on the background shall draw a marquee (`ui-diagram-canvas__marquee`) and select the nodes it touches when released. Cancellation or lost capture shall discard the marquee without changing the selection.

Implementation: `src/components/diagram-canvas/use-background-pointer.ts`
Verification: `src/components/diagram-canvas/diagram-node.test.tsx`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-4.3 - Moving by pointer

With `isEditing`, which publishes `data-editing` on the root, dragging a node shall move it, with the rest of the selection when it is selected, its position snapping to multiples of `gridSize` (10 pixels by default; `0` turns snapping off). While dragging, the moved nodes show where they would go and publish `data-moving`; on release `onNodesChange` receives every node with the new positions and the live region reads the provider's `diagramMoved` string. Cancellation, lost capture, leaving edit mode, or the dragged node leaving the canvas (removed by the host, or the outline view shown) shall release capture and discard the preview without calling `onNodesChange`. Returning to edit mode requires a fresh press; selecting nodes and panning remain available in viewing mode.

Controls and editable content that `renderNode` puts in a node (links, buttons, fields, selects, labels, editable content and elements with a control role) shall own their presses: a press on one, or a press its own handler already prevented, starts no selection, move, pointer capture, connection completion or background pan, so the control activates and a drag in a field selects its text. A press on the rest of the node's content still selects and moves it.

Implementation: `src/components/diagram-canvas/use-node-moves.ts`, `src/components/diagram-canvas/diagram-node.tsx`, `src/utils/is-interactive-target.ts`
Verification: `src/components/diagram-canvas/diagram-node.test.tsx`, `src/components/diagram-canvas/diagram-model.test.ts`, `src/utils/is-interactive-target.test.ts`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-4.4 - Moving by keyboard

In edit mode an arrow key on a focused node shall move it (with the selection holding it) one grid step that way, or five with Shift, snapped to the grid, then call `onNodesChange` and read `diagramMoved`.

Implementation: `src/components/diagram-canvas/use-node-moves.ts`, `src/components/diagram-canvas/diagram-node.tsx`
Verification: `src/components/diagram-canvas/diagram-node.test.tsx`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-4.5 - Removing

In edit mode Delete or Backspace on a focused node shall remove it, or the whole selection when it is selected (selected edges included), with every edge that touches a removed node: `onNodesChange` receives the nodes left and `onEdgesChange` the edges left, the live region reads the provider's `diagramRemoved` string with the count, and focus moves to the next node left, else the previous one, else the viewport, which takes focus without joining the Tab order. When the host removes the node holding focus, focus shall move to the node drawn nearest to where it was, else to the viewport; focus that had left the canvas stays where it is.

Implementation: `src/components/diagram-canvas/use-node-moves.ts`, `src/components/diagram-canvas/diagram-node.tsx`, `src/components/diagram-canvas/diagram-canvas.tsx`
Verification: `src/components/diagram-canvas/diagram-node.test.tsx`

## UIC-DIAGRAM-CANVAS-5 - Connecting and adding

### UIC-DIAGRAM-CANVAS-5.1 - Connecting by pointer

In edit mode, dragging from a port shall draw a preview edge (`ui-diagram-canvas__connection-preview`) to the pointer, and releasing it over a node or a port calls `onConnect({ source, sourcePort, target, targetPort })` (`targetPort` undefined on a node) and reads the provider's `diagramConnected` string. Releasing elsewhere gives the connection up. While a connection is in progress the root publishes `data-connecting` and its port and node publish `data-connect-source`. Cancellation, lost capture, leaving edit mode, or the source port leaving the canvas mid-drag (its node removed, or the outline view shown) shall give up the unfinished connection without calling `onConnect`; re-enabling editing does not resume it.

Implementation: `src/components/diagram-canvas/use-diagram-connect.ts`, `src/components/diagram-canvas/diagram-port.tsx`, `src/components/diagram-canvas/diagram-edges.tsx`
Verification: `src/components/diagram-canvas/diagram-node.test.tsx`, `src/components/diagram-canvas/diagram-port.test.tsx`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-5.2 - Connecting by keyboard

Pressing a port (Enter, Space or a click that does not drag) shall start a connection and read the provider's `diagramConnecting` string; Enter on a focused node, or pressing another port, ends it there; pressing the same port again, Escape, or a press on the background gives it up and reads `diagramConnectCancelled`. A started connection, by pointer or keyboard, shall last only while the canvas is editable and shown and its source node and port are drawn: leaving edit mode, showing the outline, or the host removing the source node or its port gives it up at once, clears `data-connecting` and reads `diagramConnectCancelled`, and returning to the canvas or to edit mode does not resume it. A connection ends only on a node or port that is still drawn.

Leaving edit mode shall also cancel a connection started by a click or keyboard; nodes in viewing mode cannot complete it.

Implementation: `src/components/diagram-canvas/use-diagram-connect.ts`, `src/components/diagram-canvas/diagram-port.tsx`, `src/components/diagram-canvas/diagram-node.tsx`
Verification: `src/components/diagram-canvas/diagram-node.test.tsx`, `src/components/diagram-canvas/diagram-port.test.tsx`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-5.3 - Palette

`palette` shall render in a `ui-diagram-canvas__palette` group named by the provider's `diagramPalette` string. Each `DiagramPaletteItem` (`ui-diagram-canvas__palette-item`, a button showing its `icon` and `label`) is disabled, with `data-disabled`, unless the canvas is in edit mode with `onNodeAdd`. Pressing it calls `onNodeAdd({ type, x, y })` with the middle of the view in diagram pixels; dragging it onto the viewport (which publishes `data-drop-target` while it would accept the drop) calls it with the point it is dropped on, both snapped to the grid. A drop reads its item's text before it adds: the point is taken under the drop as the view stood then, and once the text settles the current `onNodeAdd` is called exactly once, unless the canvas left edit mode, lost `onNodeAdd` or unmounted meanwhile (even if it came back), in which case, as for unreadable text, nothing is added.

Implementation: `src/components/diagram-canvas/diagram-palette.tsx`, `src/components/diagram-canvas/diagram-canvas.tsx`
Verification: `src/components/diagram-canvas/diagram-canvas.test.tsx`, `e2e/diagram-canvas.spec.ts`, `src/components/diagram-canvas/diagram-palette.test.tsx`

## UIC-DIAGRAM-CANVAS-6 - Accessibility

### UIC-DIAGRAM-CANVAS-6.1 - Named nodes

Each node shall be a `role="group"` in the Tab order, named by its `label`, described as the provider's `diagramNode` string through `aria-roledescription`, and described by its `description`, the provider's `diagramSelected` string while selected, and the `diagramOutgoing` and `diagramIncoming` strings listing the labels of the nodes it leads to and comes from (each followed by the edge's label in parentheses).

Link descriptions shall preserve edge order, include parallel edges and self-links, and leave out connections whose other node is missing, the same in the outline view (UIC-DIAGRAM-CANVAS-6.4).

Implementation: `src/components/diagram-canvas/diagram-links.ts`, `src/components/diagram-canvas/diagram-node.tsx`, `src/components/diagram-canvas/diagram-canvas.tsx`
Verification: `src/components/diagram-canvas/diagram-links.test.ts`, `src/components/diagram-canvas/diagram-canvas.test.tsx`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-6.2 - Announcements

Moves, removals and connections made by pointer or keyboard shall be read through the live region, as the requirements above state. Each announcement replaces the region's text, so a message that repeats the last one (the same node moved twice) is read again.

Implementation: `src/components/diagram-canvas/diagram-canvas.tsx`, `src/components/diagram-canvas/use-diagram-controller.ts`
Verification: `src/components/diagram-canvas/diagram-node.test.tsx`

### UIC-DIAGRAM-CANVAS-6.3 - Moving between connected nodes

An arrow key on a focused node outside edit mode, or Alt with an arrow key in edit mode, shall move focus to the node connected to it (by an edge either way) that lies closest in that direction, within 45 degrees of it.

Implementation: `src/components/diagram-canvas/diagram-node.tsx`, `src/components/diagram-canvas/diagram-model.ts`
Verification: `src/components/diagram-canvas/diagram-node.test.tsx`, `src/components/diagram-canvas/diagram-model.test.ts`, `e2e/diagram-canvas.spec.ts`

### UIC-DIAGRAM-CANVAS-6.4 - Outline view

The view shall be `view` (controlled) or held from `defaultView` (`canvas`), switched by a [Segmented Choice](SEGMENTED-CHOICE.md) in the toolbar (`ui-diagram-canvas__view-switch`) named by the provider's `diagramView` string, and reported through `onViewChange`. The outline (`ui-diagram-canvas__outline`, a list named by the `diagramOutlineView` string) holds an entry per node (`ui-diagram-canvas__outline-item`, with `data-selected`) showing its label (`ui-diagram-canvas__outline-label`) and, when the node has a `description`, that description (`ui-diagram-canvas__outline-description`), which also describes the entry through `aria-describedby`, then the nodes it leads to and comes from (`ui-diagram-canvas__outline-links` with `data-direction` `outgoing` or `incoming`, labelled by `ui-diagram-canvas__outline-links-label` reading `diagramLeadsTo` or `diagramComesFrom`) as buttons (`ui-diagram-canvas__outline-link`) that move focus to that node's entry. In edit mode each outgoing link is followed by an [Icon Button](BUTTON.md) (`ui-diagram-canvas__outline-remove`) named by `diagramRemoveConnection` that removes the edge through `onEdgesChange` and moves focus to the next link of that list, else the previous one, else the node's entry. The zoom control and fit button show only in the canvas view.

Implementation: `src/components/diagram-canvas/diagram-links.ts`, `src/components/diagram-canvas/diagram-outline.tsx`, `src/components/diagram-canvas/diagram-toolbar.tsx`
Verification: `src/components/diagram-canvas/diagram-links.test.ts`, `src/components/diagram-canvas/diagram-canvas.test.tsx`, `e2e/diagram-canvas.spec.ts`

## Hooks

| Hook                                     | Kind      | Values                             | Description                                                         |
| ---------------------------------------- | --------- | ---------------------------------- | ------------------------------------------------------------------- |
| `ui-diagram-canvas`                      | root      |                                    | The canvas's `<div role="group">`.                                  |
| `ui-diagram-canvas__toolbar`             | slot      |                                    | The zoom control, fit button and view switch.                       |
| `ui-diagram-canvas__zoom`                | slot      |                                    | The zoom control (also `ui-zoom-control`).                          |
| `ui-diagram-canvas__fit`                 | slot      |                                    | The fit button (also `ui-button`).                                  |
| `ui-diagram-canvas__view-switch`         | slot      |                                    | The canvas and outline switch (also `ui-segmented-choice`).         |
| `ui-diagram-canvas__palette`             | slot      |                                    | The palette group.                                                  |
| `ui-diagram-canvas__palette-item`        | slot      |                                    | A palette item's button.                                            |
| `ui-diagram-canvas__viewport`            | slot      |                                    | The pannable surface; the host sizes it and hides its overflow.     |
| `ui-diagram-canvas__content`             | slot      |                                    | The layer the pan and zoom transform.                               |
| `ui-diagram-canvas__edges`               | slot      |                                    | The SVG layer of edges.                                             |
| `ui-diagram-canvas__edge`                | slot      |                                    | One edge's `<g>`.                                                   |
| `ui-diagram-canvas__edge-path`           | slot      |                                    | An edge's path.                                                     |
| `ui-diagram-canvas__edge-arrow`          | slot      |                                    | An edge's arrowhead.                                                |
| `ui-diagram-canvas__edge-hit`            | slot      |                                    | An edge's pointer target; give it a wide transparent stroke.        |
| `ui-diagram-canvas__edge-label`          | slot      |                                    | An edge's label.                                                    |
| `ui-diagram-canvas__connection-preview`  | slot      |                                    | The edge drawn while a connection is dragged.                       |
| `ui-diagram-canvas__node`                | slot      |                                    | A node's group.                                                     |
| `ui-diagram-canvas__node-label`          | slot      |                                    | A node's label, without `renderNode`.                               |
| `ui-diagram-canvas__port`                | slot      |                                    | A port: a mark, or a button in edit mode.                           |
| `ui-diagram-canvas__marquee`             | slot      |                                    | The marquee while it is drawn.                                      |
| `ui-diagram-canvas__minimap`             | slot      |                                    | The minimap's SVG; the host sizes and places it.                    |
| `ui-diagram-canvas__minimap-node`        | slot      |                                    | A node in the minimap.                                              |
| `ui-diagram-canvas__minimap-viewport`    | slot      |                                    | The part of the diagram in view, in the minimap.                    |
| `ui-diagram-canvas__outline`             | slot      |                                    | The outline's list.                                                 |
| `ui-diagram-canvas__outline-item`        | slot      |                                    | A node's entry in the outline.                                      |
| `ui-diagram-canvas__outline-label`       | slot      |                                    | A node's label in the outline.                                      |
| `ui-diagram-canvas__outline-description` | slot      |                                    | A node's description in the outline.                                |
| `ui-diagram-canvas__outline-links`       | slot      |                                    | A node's outgoing or incoming links.                                |
| `ui-diagram-canvas__outline-links-label` | slot      |                                    | The label of a list of links.                                       |
| `ui-diagram-canvas__outline-link`        | slot      |                                    | A link's button.                                                    |
| `ui-diagram-canvas__outline-remove`      | slot      |                                    | The button that removes a link (also `ui-button`).                  |
| `ui-diagram-canvas__empty`               | slot      |                                    | The text of a diagram without nodes.                                |
| `ui-diagram-canvas__status`              | slot      |                                    | The visually hidden live region.                                    |
| `data-view`                              | attribute | `canvas`, `outline`                | On the root: the view shown.                                        |
| `data-routing`                           | attribute | `straight`, `orthogonal`, `bezier` | On the root: how edges run.                                         |
| `data-side`                              | attribute | `top`, `right`, `bottom`, `left`   | On a port: the side of its node.                                    |
| `data-direction`                         | attribute | `outgoing`, `incoming`             | On a list of links: which edges it lists.                           |
| `data-editing`                           | state     | `true`                             | On the root: edit mode.                                             |
| `data-connecting`                        | state     | `true`                             | On the root: a connection is in progress.                           |
| `data-connect-source`                    | state     | `true`                             | On the node and port a connection in progress starts from.          |
| `data-selected`                          | state     | `true`                             | On a selected node, edge, edge label, minimap node or outline item. |
| `data-moving`                            | state     | `true`                             | On a node while it is dragged.                                      |
| `data-drop-target`                       | state     | `true`                             | On the viewport while a palette item would drop on it.              |
| `data-disabled`                          | state     | `true`                             | On a palette item that cannot add.                                  |
