# State Machine View

`StateMachineView` defaults to a graph presentation on a [Diagram Canvas](DIAGRAM-CANVAS.md): its states as nodes laid out automatically in layers from the initial state, its transitions as labelled edges, a marker on the initial state, final states marked, and the current state highlighted. It is read only by default; in edit mode the reader moves and removes states and adds and removes transitions, and each change reaches the caller as plain data. States and transitions are plain data (`{ id, label, isFinal?, x?, y? }`, `{ id, from, to, label? }`). The layout is `layoutLayeredGraph`, a pure function in the library. A control that moves one record to its next state belongs in a [Transition Menu](TRANSITION-MENU.md), and the history of a record's states in a [State Timeline](STATE-TIMELINE.md).

## UIC-STATE-MACHINE-VIEW-1 - Diagram

### UIC-STATE-MACHINE-VIEW-1.1 - States and transitions

`StateMachineView` shall render a `DiagramCanvas` (also `ui-state-machine-view`) named by `aria-label`, `aria-labelledby` or the provider's `stateMachine` string, with a node of 144 by 44 pixels for each state and an edge, labelled with the transition's `label`, for each transition, routed as curves, without a minimap. Each node holds a `ui-state-machine-view__state` element showing the state's label in `ui-state-machine-view__state-label`. The canvas's outline view lists the same states and transitions; `defaultView` chooses the view shown at first.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/core/strings/diagram.ts`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`, `e2e/state-machine-view.spec.ts`

### UIC-STATE-MACHINE-VIEW-1.2 - Initial, final and current states

The initial state (`initialState`, by default the first state) shall carry `data-initial` and an initial marker (`ui-state-machine-view__initial-marker`, hidden from assistive technology); a state with `isFinal` carries `data-final`; the state `currentKey` names carries `data-current`. Each node's description reads the provider's `stateMachineCurrent`, `stateMachineInitial` and `stateMachineFinal` strings as they apply, before its transitions; the outline view shows and reads the same status on each state's entry, without its transitions, which the outline lists.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-graph.tsx`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`, `e2e/state-machine-view.spec.ts`

### UIC-STATE-MACHINE-VIEW-1.3 - Hooks and caller attributes

`StateMachineView` shall carry the hooks below beside the canvas's, publish `orientation` in `data-orientation`, append the caller's `className` and forward its `id`, `ref` and `data-*` attributes to the root.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `labs/reference/state-machine-view.css`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`

## UIC-STATE-MACHINE-VIEW-2 - Layout

### UIC-STATE-MACHINE-VIEW-2.1 - Layered layout

`layoutLayeredGraph({ nodes, edges, orientation, layerGap, nodeGap })` shall place a directed graph in layers and return each node's top left corner and layer, in the order of `nodes`: edges that close a cycle (found depth first, in node order) are reversed for the layout, edges to unknown nodes and loops are ignored, each node goes one layer after the deepest node that leads to it, the nodes of each layer are ordered by the average position of their neighbours in the layers before and after (four sweeps each way) to reduce crossings, and each layer is centred across the widest one. `horizontal` (the default) places the layers left to right; `vertical` top to bottom. Gaps default to 80 pixels between layers and 32 between nodes.

A repeated edge counts once, the first in insertion order, and a graph of any width (200 000 nodes in one layer included) is laid out.

Implementation: `src/utils/layered-layout.ts`
Verification: `src/utils/layered-layout.test.ts`

### UIC-STATE-MACHINE-VIEW-2.2 - Placing the states

The view shall place the states with `layoutLayeredGraph`, starting from the initial state, in its `orientation`, with 112 pixels between layers for the transition labels; a state that carries `x` and `y` keeps that position.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-graph.tsx`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`

## UIC-STATE-MACHINE-VIEW-3 - Editing

### UIC-STATE-MACHINE-VIEW-3.1 - Read only by default

Without `isEditing` the reader shall select, pan, zoom and move between states but change nothing: states have no ports and do not move.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-graph.tsx`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`

### UIC-STATE-MACHINE-VIEW-3.2 - Edit mode

With `isEditing`, moving states (by pointer or keyboard) shall call `onStatesChange` with every state carrying the position it is drawn at; removing states calls `onStatesChange` with the states left and `onTransitionsChange` with the transitions left; each state has one port, named by the provider's `stateMachineAddTransition` string, on its right side (bottom when vertical), and connecting it to a state calls `onTransitionAdd({ from, to })` for the caller to add the transition.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-graph.tsx`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`, `e2e/state-machine-view.spec.ts`

### UIC-STATE-MACHINE-VIEW-3.3 - Distinct ids

A state and a transition may share an id, and ids of different types (`1` and `'1'`) are different ids: the view shall give the canvas node and edge ids namespaced by kind and typed identity, so selecting, moving or removing a state never touches a transition that shares its id, removing a state removes only the selected entities and the transitions that start or end at a removed state, and every callback reports the caller's own ids.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-graph.tsx`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`, `e2e/state-machine-view.spec.ts`

## UIC-STATE-MACHINE-VIEW-4 - Sequence presentation

### UIC-STATE-MACHINE-VIEW-4.1 - Ordered state row

With `presentation="sequence"`, the view shall place states in caller array order on one horizontal row, including when there are no transitions. Connectivity and the current state shall not determine state placement. The existing graph presentation remains the default (`presentation="graph"`), including its outline and editing. Sequence mode is always horizontal and read only: graph position overrides, `orientation`, `defaultView` and editing callbacks do not apply. Initial/current state, cycles and hiding transitions do not change horizontal placement or caller reading order. Empty sequences reserve only a small empty viewport; a single state is a rectangle. Numeric and text keys remain distinct in states, transitions, selection and callbacks, and instances share no ids or measurements.

`density="default"` has minimum state width/height 144/44 CSS pixels; `compact` uses 112/32. Measured state content can increase these sizes. Equal-width states fill the available viewport when it is wider than their minimum row; otherwise the row scrolls. State buttons expose first/last hooks for a host to draw a leading notch and trailing chevron, square first leading and terminal trailing edges, or a single rectangle. Host styles provide the shape, borders, colors and current/selected treatments.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-sequence.tsx`, `src/components/state-machine-view/sequence-layout.ts`, `src/components/state-machine-view/sequence-routes.ts`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `src/components/state-machine-view/sequence-layout.test.ts`, `e2e/state-machine-view-sequence.spec.ts`

### UIC-STATE-MACHINE-VIEW-4.2 - Forward and reverse lanes

In the sequence presentation, transitions to later states shall run above the state row and transitions to earlier states below it, with their labels outside the row on the corresponding side. State widths and horizontal placement shall depend only on the state content and viewport, never on transitions. The content reserves vertical space above/below the row for its lanes.

Same-state loops use forward lanes above the row, with separate source and target attachments inside the same state. Unknown endpoints are omitted. Routes are sorted by absolute array-index span, then locale-independent typed transition identity; shorter spans occupy nearer lanes. Each span group starts beyond all shorter-span lanes. Within a group, a lane is shared only if padded horizontal connector and measured label reservations do not overlap. Parallel routes get separate lanes and fanned attachments; forward sources/targets occupy the right/left interior halves of their states, reversed for backward routes. This makes packing deterministic under transition-array reordering.

`sequenceGeometry` optionally supplies finite nonnegative CSS-pixel distances: `lanePitch` (26), `stateGap` (0), `rowSpacer` (15) and `cornerRadius` (10). Invalid distances use the defaults. The lane pitch grows when label height needs more clearance. `rowSpacer` is the clear distance from the row to the nearest label reservation. Each orthogonal route uses the same radius at both bends, capped by its horizontal/vertical clearance and `cornerRadius`. SVG coordinates, dimensions and viewBox use measured CSS pixels without scaling. Arrowheads are open strokes; colors and stroke styles belong to the host.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-sequence.tsx`, `src/components/state-machine-view/sequence-layout.ts`, `src/components/state-machine-view/sequence-routes.ts`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `src/components/state-machine-view/sequence-layout.test.ts`, `e2e/state-machine-view-sequence.spec.ts`

### UIC-STATE-MACHINE-VIEW-4.3 - Inert connectors and focusable labels

In the sequence presentation, connector paths and route wrappers shall be decorative and inert, with no pointer hit target or focus. Each nonblank named transition label alone shall be an independent focusable button, with its `label` as accessible name. Labels follow caller transition order, independent of line stacking. Enter, Space and pointer activation call `onTransitionAction(id)`; `onTransitionContextMenu(id, event)` receives right-click context-menu requests and may prevent the browser menu. `getTransitionTooltip(transition)` supplies a label-only tooltip on hover/focus. `renderTransitionLabel(transition)` may replace the visible content with non-interactive content while preserving the accessible name. Unnamed transitions retain their connector without a control.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-sequence.tsx`, `src/components/state-machine-view/sequence-layout.ts`, `src/components/state-machine-view/sequence-routes.ts`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `src/components/state-machine-view/sequence-layout.test.ts`, `e2e/state-machine-view-sequence.spec.ts`

### UIC-STATE-MACHINE-VIEW-4.4 - Selection and highlighting

`currentKey` marks the machine's current state (`data-current`, `aria-current="step"` on the state button); `selectedKey` independently marks the host-selected state (`data-selected`, `aria-pressed`). Selecting any sequence state by pointer or keyboard calls `onSelectionChange(id)` without changing the current state. State status descriptions use the provider strings for current, initial and final. Both selection and `activeTransitionKey` are controlled. Outgoing transitions from `selectedKey` carry `data-outgoing`; the active transition carries `data-active` on its route and label. Outgoing lines stack above ordinary lines and active lines above outgoing lines. All labels stack above every line. Highlight changes do not change route coordinates.

Implementation: `src/components/state-machine-view/state-machine-sequence.tsx`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `e2e/state-machine-view-sequence.spec.ts`

### UIC-STATE-MACHINE-VIEW-4.5 - Measurement and horizontal scrolling

One horizontal viewport contains the forward routes, state row and reverse routes; its scrollbar is below all content. The viewport hook supplies horizontal overflow containment in the host stylesheet, as in ScrollRegion; the reference stylesheet contains overflow within the host width. States, paths and labels share content coordinates, so scrolling preserves attachments. A ResizeObserver measures viewport-only width changes and intrinsic state/transition content changes; content commits and font/content resize trigger remeasurement. Observers disconnect on unmount and ignore stale notifications. SSR uses deterministic fallback geometry and no browser globals during render; hydration measures after commit. The caller never calculates paths, lane positions or measurements.

Implementation: `src/components/state-machine-view/use-sequence-measurements.ts`, `src/components/state-machine-view/state-machine-sequence.tsx`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `e2e/state-machine-view-sequence.spec.ts`

## Hooks

| Hook                                      | Kind      | Values                   | Description                                                              |
| ----------------------------------------- | --------- | ------------------------ | ------------------------------------------------------------------------ |
| `ui-state-machine-view`                   | root      |                          | Graph canvas root (also `ui-diagram-canvas`) or sequence root.           |
| `ui-state-machine-view__state`            | slot      |                          | A state's content; a button in sequence mode.                            |
| `ui-state-machine-view__state-label`      | slot      |                          | A state's label.                                                         |
| `ui-state-machine-view__initial-marker`   | slot      |                          | The marker drawn on the initial state.                                   |
| `data-orientation`                        | attribute | `horizontal`, `vertical` | On the root: which way the layers run.                                   |
| `data-current`                            | state     | `true`                   | On the state the machine is in.                                          |
| `data-initial`                            | state     | `true`                   | On the initial state.                                                    |
| `data-final`                              | state     | `true`                   | On a final state.                                                        |
| `data-presentation`                       | attribute | `graph`, `sequence`      | On the root: chosen presentation.                                        |
| `data-density`                            | attribute | `default`, `compact`     | Sequence root density.                                                   |
| `ui-state-machine-view__viewport`         | slot      |                          | Sequence horizontal scrolling viewport.                                  |
| `ui-state-machine-view__content`          | slot      |                          | Shared measured coordinate space.                                        |
| `ui-state-machine-view__state-row`        | slot      |                          | Ordered state layer.                                                     |
| `ui-state-machine-view__state-position`   | slot      |                          | Positioned state group.                                                  |
| `ui-state-machine-view__routes`           | slot      |                          | Decorative SVG, without pointer events or focus.                         |
| `ui-state-machine-view__route`            | slot      |                          | Decorative route group.                                                  |
| `ui-state-machine-view__connector`        | slot      |                          | Rounded orthogonal stroke.                                               |
| `ui-state-machine-view__arrow`            | slot      |                          | Open-stroke arrowhead.                                                   |
| `ui-state-machine-view__transition-label` | slot      |                          | Independent transition button.                                           |
| `data-key`                                | attribute |                          | Typed state/transition identity on positioned states, routes and labels. |
| `data-first`                              | state     | `true`                   | On the first sequence state and its position.                            |
| `data-last`                               | state     | `true`                   | On the last sequence state and its position.                             |
| `data-selected`                           | state     | `true`                   | On a selected sequence state and its position.                           |
| `data-direction`                          | attribute | `forward`, `reverse`     | On each route and label. Loops are forward.                              |
| `data-lane`                               | attribute |                          | Zero-based lane index on its side, on route and label.                   |
| `data-active`                             | state     | `true`                   | On the active route and label.                                           |
| `data-outgoing`                           | state     | `true`                   | Route/label starts at the selected state.                                |
| `data-hovered`                            | state     | `true`                   | On a hovered sequence state or label button.                             |
| `data-pressed`                            | state     | `true`                   | On a pressed sequence state or label button.                             |
| `data-focused`                            | state     | `true`                   | On a focused sequence state or label button.                             |
| `data-focus-visible`                      | state     | `true`                   | On a keyboard-focused sequence state or label button.                    |
| `--ui-sequence-lane-pitch`                | property  |                          | Resolved lane pitch, on content.                                         |
| `--ui-sequence-state-gap`                 | property  |                          | Resolved state gap, on content.                                          |
| `--ui-sequence-row-spacer`                | property  |                          | Resolved row clearance, on content.                                      |
