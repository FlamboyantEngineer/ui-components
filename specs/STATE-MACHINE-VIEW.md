# State Machine View

`StateMachineView` draws a state machine on a [Diagram Canvas](DIAGRAM-CANVAS.md): its states as nodes laid out automatically in layers from the initial state, its transitions as labelled edges, a marker on the initial state, final states marked, and the current state highlighted. It is read only by default; in edit mode the reader moves and removes states and adds and removes transitions, and each change reaches the caller as plain data. States and transitions are plain data (`{ id, label, isFinal?, x?, y? }`, `{ id, from, to, label? }`). The layout is `layoutLayeredGraph`, a pure function in the library. A control that moves one record to its next state belongs in a [Transition Menu](TRANSITION-MENU.md), and the history of a record's states in a [State Timeline](STATE-TIMELINE.md).

## UIC-STATE-MACHINE-VIEW-1 - Diagram

### UIC-STATE-MACHINE-VIEW-1.1 - States and transitions

`StateMachineView` shall render a `DiagramCanvas` (also `ui-state-machine-view`) named by `aria-label`, `aria-labelledby` or the provider's `stateMachine` string, with a node of 144 by 44 pixels for each state and an edge, labelled with the transition's `label`, for each transition, routed as curves, without a minimap. Each node holds a `ui-state-machine-view__state` element showing the state's label in `ui-state-machine-view__state-label`. The canvas's outline view lists the same states and transitions; `defaultView` chooses the view shown at first.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/core/strings/diagram.ts`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`, `e2e/state-machine-view.spec.ts`

### UIC-STATE-MACHINE-VIEW-1.2 - Initial, final and current states

The initial state (`initialState`, by default the first state) shall carry `data-initial` and an initial marker (`ui-state-machine-view__initial-marker`, hidden from assistive technology); a state with `isFinal` carries `data-final`; the state `currentKey` names carries `data-current`. Each node's description reads the provider's `stateMachineCurrent`, `stateMachineInitial` and `stateMachineFinal` strings as they apply, before its transitions; the outline view shows and reads the same status on each state's entry, without its transitions, which the outline lists.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`
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

Implementation: `src/components/state-machine-view/state-machine-view.tsx`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`

## UIC-STATE-MACHINE-VIEW-3 - Editing

### UIC-STATE-MACHINE-VIEW-3.1 - Read only by default

Without `isEditing` the reader shall select, pan, zoom and move between states but change nothing: states have no ports and do not move.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`

### UIC-STATE-MACHINE-VIEW-3.2 - Edit mode

With `isEditing`, moving states (by pointer or keyboard) shall call `onStatesChange` with every state carrying the position it is drawn at; removing states calls `onStatesChange` with the states left and `onTransitionsChange` with the transitions left; each state has one port, named by the provider's `stateMachineAddTransition` string, on its right side (bottom when vertical), and connecting it to a state calls `onTransitionAdd({ from, to })` for the caller to add the transition.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`, `e2e/state-machine-view.spec.ts`

### UIC-STATE-MACHINE-VIEW-3.3 - Distinct ids

A state and a transition may share an id, and ids of different types (`1` and `'1'`) are different ids: the view shall give the canvas node and edge ids namespaced by kind and typed identity, so selecting, moving or removing a state never touches a transition that shares its id, removing a state removes only the selected entities and the transitions that start or end at a removed state, and every callback reports the caller's own ids.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`, `e2e/state-machine-view.spec.ts`

## UIC-STATE-MACHINE-VIEW-4 - Sequence presentation

### UIC-STATE-MACHINE-VIEW-4.1 - Ordered state row

With `presentation="sequence"`, the view shall place states in caller array order on one horizontal row, including when there are no transitions. Connectivity and the current state shall not determine state placement. The existing graph presentation remains the default.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`

### UIC-STATE-MACHINE-VIEW-4.2 - Forward and reverse lanes

In the sequence presentation, transitions to later states shall run above the state row and transitions to earlier states below it, with their labels outside the row on the corresponding side. Routes shall not move the states to make room for transitions.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`

### UIC-STATE-MACHINE-VIEW-4.3 - Inert connectors and focusable labels

In the sequence presentation, connector paths and route wrappers shall be decorative and inert, with no pointer hit target or focus. Each named transition label alone shall be an independent focusable control exposed to assistive technology.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`

## Hooks

| Hook                                    | Kind      | Values                   | Description                                 |
| --------------------------------------- | --------- | ------------------------ | ------------------------------------------- |
| `ui-state-machine-view`                 | root      |                          | The canvas root (also `ui-diagram-canvas`). |
| `ui-state-machine-view__state`          | slot      |                          | A state's content inside its node.          |
| `ui-state-machine-view__state-label`    | slot      |                          | A state's label.                            |
| `ui-state-machine-view__initial-marker` | slot      |                          | The marker drawn on the initial state.      |
| `data-orientation`                      | attribute | `horizontal`, `vertical` | On the root: which way the layers run.      |
| `data-current`                          | state     | `true`                   | On the state the machine is in.             |
| `data-initial`                          | state     | `true`                   | On the initial state.                       |
| `data-final`                            | state     | `true`                   | On a final state.                           |
