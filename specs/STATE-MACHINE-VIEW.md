# State Machine View

`StateMachineView` defaults to a graph presentation on a [Diagram Canvas](DIAGRAM-CANVAS.md): its states as nodes laid out automatically in layers from the initial state, its transitions as labelled edges, a marker on the initial state, final states marked, and the current state highlighted. It is read only by default; in edit mode the reader moves and removes states and adds and removes transitions, and each change reaches the caller as plain data. States and transitions are plain data (`{ id, label, isFinal?, x?, y? }`, `{ id, from, to, label? }`). The layout is `layoutLayeredGraph`, a pure function in the library. A control that moves one record to its next state belongs in a [Transition Menu](TRANSITION-MENU.md), and the history of a record's states in a [State Timeline](STATE-TIMELINE.md).

## UIC-STATE-MACHINE-VIEW-1 - Diagram

### UIC-STATE-MACHINE-VIEW-1.1 - States and transitions

`StateMachineView` shall render a `DiagramCanvas` (also `ui-state-machine-view`) named by `aria-label`, `aria-labelledby` or the provider's `stateMachine` string, with a node of 144 by 44 pixels for each state and an edge, labelled with the transition's `label`, for each transition, routed as curves, without a minimap. Each node holds a `ui-state-machine-view__state` element showing the state's label in `ui-state-machine-view__state-label`. The canvas's outline view lists the same states and transitions; `defaultView` chooses the view shown at first.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/core/strings/diagram.ts`
Verification: `src/components/state-machine-view/state-machine-view.test.tsx`, `e2e/state-machine-view.spec.ts`

### UIC-STATE-MACHINE-VIEW-1.2 - Initial, final and current states

The initial state (`initialState`, by default the first state) shall carry `data-initial` and an initial marker (`ui-state-machine-view__initial-marker`, hidden from assistive technology); a state with `isFinal` carries `data-final`; the state `currentKey` names carries `data-current`. Each node's description reads the provider's `stateMachineCurrent`, `stateMachineInitial` and `stateMachineFinal` strings as they apply, then the state's own `description`, before its transitions; the outline view shows and reads the same status on each state's entry, without its transitions, which the outline lists. A state's `status` and `tone` are published on its `ui-state-machine-view__state` element as `data-status` and `data-tone` in both presentations, so a status the sequence shows keeps an accessible equivalent when the reader switches views.

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

The sequence root shall preserve caller `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-details` naming and description relationships.

With `presentation="sequence"`, the view shall place states in caller array order on one horizontal row, including when there are no transitions. Connectivity and the current state shall not determine state placement. The existing graph presentation remains the default (`presentation="graph"`), including its outline and editing. Sequence mode is always horizontal and read only: graph position overrides, `orientation`, `defaultView` and editing callbacks do not apply. Initial/current state, cycles and hiding transitions do not change horizontal placement or caller reading order. Empty sequences reserve only a small empty viewport; a single state is a rectangle. Numeric and text keys remain distinct in states, transitions, selection and callbacks, and instances share no ids or measurements.

At the default `size="md"`, `density="default"` has minimum state width/height 144/44 CSS pixels; `compact` uses 112/32. Other sizes follow UIC-STATE-MACHINE-VIEW-4.6. Measured state content can increase these sizes. Equal-width states fill the available viewport when it is wider than their minimum row; otherwise the row scrolls. State buttons expose first/last hooks for a host to draw a leading notch and trailing chevron, square first leading and terminal trailing edges, or a single rectangle. Host styles provide the shape, borders, colors and current/selected treatments.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-sequence.tsx`, `src/components/state-machine-view/sequence-layout.ts`, `src/components/state-machine-view/sequence-routes.ts`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `src/components/state-machine-view/sequence-layout.test.ts`, `e2e/state-machine-view-sequence.spec.ts`, `e2e/state-machine-view-sequence-paint.spec.ts`

### UIC-STATE-MACHINE-VIEW-4.2 - Forward and reverse lanes

In the sequence presentation, transitions to later states shall run above the state row and transitions to earlier states below it, with their labels outside the row on the corresponding side. State widths and horizontal placement shall depend only on the state content and viewport, never on transitions. The content reserves vertical space above/below the row for its lanes.

Same-state loops use forward lanes above the row, with separate source and target attachments on the same state. Unknown endpoints are omitted. Routes are sorted by absolute array-index span, then locale-independent typed transition identity; shorter spans occupy nearer lanes. Each span group starts beyond all shorter-span lanes. Within a group, a lane is shared only if padded horizontal connector and measured label reservations do not overlap. Parallel routes get separate lanes and fanned attachments; forward sources/targets occupy the right/left halves of their states, reversed for backward routes. Outer routes fan around inner routes at shared endpoints, with loops between incoming and outgoing attachments. This makes packing deterministic under transition-array reordering.

`sequenceGeometry` optionally supplies finite nonnegative CSS-pixel distances: `lanePitch` (26), `stateGap` (0), `rowSpacer` (15) and `cornerRadius` (10). Invalid distances use the defaults. The lane pitch grows when label height needs more clearance. `rowSpacer` is the clear distance from the row to the nearest label reservation. Each orthogonal route uses the same radius at both bends, capped by its horizontal/vertical clearance and `cornerRadius`. SVG coordinates, dimensions and viewBox use measured CSS pixels without scaling. Arrowheads are open strokes; colors and stroke styles belong to the host.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-sequence.tsx`, `src/components/state-machine-view/sequence-layout.ts`, `src/components/state-machine-view/sequence-routes.ts`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `src/components/state-machine-view/sequence-layout.test.ts`, `e2e/state-machine-view-sequence.spec.ts`

### UIC-STATE-MACHINE-VIEW-4.3 - Inert connectors and focusable labels

In the sequence presentation, connector paths and route wrappers shall be decorative and inert, with no pointer hit target or focus. Each nonblank named transition label alone shall be an independent focusable button, with its `label` as accessible name. Labels follow caller transition order, independent of line stacking. Activation and context menu requests follow UIC-STATE-MACHINE-VIEW-5. `getTransitionTooltip(transition)` supplies a label-only tooltip on hover/focus, following UIC-STATE-MACHINE-VIEW-6.3. `renderTransitionLabel(transition)` may replace the visible content with non-interactive content while preserving the accessible name. Unnamed transitions retain their connector without a control.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-sequence.tsx`, `src/components/state-machine-view/sequence-layout.ts`, `src/components/state-machine-view/sequence-routes.ts`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `src/components/state-machine-view/sequence-layout.test.ts`, `e2e/state-machine-view-sequence.spec.ts`, `e2e/state-machine-view-sequence-paint.spec.ts`

### UIC-STATE-MACHINE-VIEW-4.4 - Selection and highlighting

Connectors shall start and end at the top state boundary for forward routes and loops, and the bottom boundary for reverse routes. Arrow tips shall coincide with connector endpoints at those boundaries, with the arrowhead entirely outside the state interior. Connectors and arrowheads paint above state backgrounds. They remain pointer-inert; states remain selectable and every transition label paints above every route.

`currentKey` marks the machine's current state (`data-current`, `aria-current="step"` on the state button); `selectedKey` independently marks the host-selected state (`data-selected`, `aria-pressed`), and `selectedTransitionKey` the host-selected transition (`data-selected` on its route and label, `aria-pressed` on the label), as UIC-STATE-MACHINE-VIEW-5.1 describes. State status descriptions use the provider strings for current, initial and final. Outgoing transitions from `selectedKey` carry `data-outgoing`. Outgoing lines stack above ordinary lines and selected lines above outgoing lines. All labels stack above every line. Highlight changes do not change route coordinates.

Implementation: `src/components/state-machine-view/state-machine-sequence.tsx`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `e2e/state-machine-view-sequence.spec.ts`, `e2e/state-machine-view-sequence-paint.spec.ts`

### UIC-STATE-MACHINE-VIEW-4.5 - Measurement and horizontal scrolling

One horizontal viewport contains the forward routes, state row and reverse routes; its scrollbar is below all content. The viewport hook supplies horizontal overflow containment in the host stylesheet, as in ScrollRegion; the reference stylesheet contains overflow within the host width. States, paths and labels share content coordinates, so scrolling preserves attachments. A ResizeObserver measures viewport-only width changes and intrinsic state content (`ui-state-machine-view__state-content`, with its adornment, label and count) and transition label changes; content commits and font/content resize trigger remeasurement. Observers disconnect on unmount and ignore stale notifications. SSR uses deterministic fallback geometry and no browser globals during render; hydration measures after commit. The caller never calculates paths, lane positions or measurements.

Implementation: `src/components/state-machine-view/use-sequence-measurements.ts`, `src/components/state-machine-view/state-machine-sequence.tsx`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `e2e/state-machine-view-sequence.spec.ts`

### UIC-STATE-MACHINE-VIEW-4.6 - Sequence sizes

The sequence presentation shall accept `size` from the shared `Size` vocabulary (`xs`, `sm`, `md`, `lg`, `xl`), defaulting to `md`, and publish the resolved value as `data-size` on its root. Size and density are independent. The graph presentation ignores `size`. The following minimum state width/height pairs are CSS pixels, before intrinsic content measurements:

| Size | Default density | Compact density |
| ---- | --------------- | --------------- |
| xs   | 112 / 28        | 80 / 24         |
| sm   | 128 / 36        | 96 / 28         |
| md   | 144 / 44        | 112 / 32        |
| lg   | 160 / 52        | 128 / 36        |
| xl   | 176 / 60        | 144 / 40        |

Measurements can increase either dimension to fit state content, adornments and counts. Changing size shall remeasure state and transition content, preserving the shared coordinate space and boundary attachments, without resetting selection or focus. The reference stylesheet scales state and transition typography and state padding with size; host styles own those visual choices. Empty sequences retain their focusable note at every size.

Implementation: `src/components/state-machine-view/state-machine-view.tsx`, `src/components/state-machine-view/state-machine-sequence.tsx`, `src/components/state-machine-view/sequence-layout.ts`
Verification: `src/components/state-machine-view/sequence-presentation.test.tsx`, `src/components/state-machine-view/sequence-layout.test.ts`, `e2e/state-machine-view-sizes.spec.ts`

## UIC-STATE-MACHINE-VIEW-5 - Sequence interaction

### UIC-STATE-MACHINE-VIEW-5.1 - Activation and selection

In the sequence presentation, every pointer press, Enter or Space on an enabled state shall call `onStateAction(key, state, event)` with the caller's own key, the state's definition and the [press event](PRIMITIVES.md), the current and the selected state included; a press on a state other than `selectedKey` first calls `onSelectionChange(key)`. Every press, Enter or Space on a named transition label calls `onTransitionAction(key, transition, event)`, after `onTransitionSelectionChange(key)` when the label is not already `selectedTransitionKey`. Focus movement never selects or activates, and nothing changes `currentKey`. Selection is controlled: highlights follow `selectedKey` and `selectedTransitionKey` alone, so an owner that declines a change keeps the old highlight, and `null` selects nothing. States and transitions are separate key spaces, and `1` and `'1'` are different keys.

Implementation: `src/components/state-machine-view/sequence-states.tsx`, `src/components/state-machine-view/state-machine-sequence.tsx`
Verification: `src/components/state-machine-view/sequence-interaction.test.tsx`, `e2e/state-machine-view-sequence-interaction.spec.ts`

### UIC-STATE-MACHINE-VIEW-5.2 - Roving tab stop

The state buttons shall form one tab stop inside the named root group: the state focused last, else the selected state, else the current state, else the first enabled state. ArrowRight and ArrowDown move focus to the next enabled state, ArrowLeft and ArrowUp to the previous, Home and End to the first and last, without wrapping. A state with `isDisabled` carries `data-disabled`, is skipped and cannot be focused, selected or activated. Transition labels stay separate tab stops after the states. When an update removes or disables the focused state, focus moves to its nearest surviving neighbour in the previous order (the next first), or to the empty note (UIC-STATE-MACHINE-VIEW-6.4) when no state is left, without remounting the root.

Implementation: `src/components/state-machine-view/sequence-states.tsx`
Verification: `src/components/state-machine-view/sequence-interaction.test.tsx`, `e2e/state-machine-view-sequence-interaction.spec.ts`

### UIC-STATE-MACHINE-VIEW-5.3 - Selection reconciliation

When the state `selectedKey` names, shown and enabled in a previous commit, is removed or disabled, the view shall call `onSelectionChange(null)` once and stop highlighting it; when the transition `selectedTransitionKey` names loses its label control (removed, unnamed or with an unknown endpoint), it calls `onTransitionSelectionChange(null)` once. A key that has not been shown yet is left alone, so a host may select ahead of its data, and an owner that keeps the key is not asked again until the target returns and leaves again.

Implementation: `src/components/state-machine-view/sequence-interaction.ts`, `src/components/state-machine-view/state-machine-sequence.tsx`
Verification: `src/components/state-machine-view/sequence-interaction.test.tsx`

### UIC-STATE-MACHINE-VIEW-5.4 - Context menu requests

A secondary click, the Context Menu key or Shift+F10 on a state shall call `onStateContextMenu(key, state, event)`, on a named transition label `onTransitionContextMenu(key, transition, event)`, and on the viewport background or the empty note `onBackgroundContextMenu(event)`. A request on a state or label never reaches the background callback, handled or not. The event carries `anchor` (the pointer's viewport point, or the target element from the keyboard, the shapes a [Context Menu](CONTEXT-MENU.md) controller opens at), `target` (the element the request reached), `pointerType` (`keyboard` from a key) and `preventDefault()`: the browser's own menu opens unless the host prevents the request's default, also for the `contextmenu` event a browser sends after the key. Without a callback the browser's menu is untouched. The library composes no menu.

Implementation: `src/components/state-machine-view/sequence-interaction.ts`, `src/components/state-machine-view/sequence-states.tsx`, `src/components/state-machine-view/state-machine-sequence.tsx`
Verification: `src/components/state-machine-view/sequence-interaction.test.tsx`, `e2e/state-machine-view-sequence-interaction.spec.ts`

## UIC-STATE-MACHINE-VIEW-6 - Sequence content

### UIC-STATE-MACHINE-VIEW-6.1 - Statuses and adornments

A state's `status` (the host's own name, such as `pending`, `complete`, `blocked` or `error`) and `tone` (`Tone`) shall be published as `data-status` and `data-tone` on its state button and position, and its `description` read after the machine status (current, initial, final) in the button's accessible description, so host status, machine state and host selection stay distinct for assistive technology. `renderStateAdornment(state)` draws decorative content before the label in `ui-state-machine-view__state-adornment`, hidden from assistive technology. The library holds no lifecycle policy: the host maps its statuses to these fields.

Implementation: `src/components/state-machine-view/sequence-states.tsx`, `src/components/state-machine-view/describe-state.ts`
Verification: `src/components/state-machine-view/sequence-content.test.tsx`

### UIC-STATE-MACHINE-VIEW-6.2 - Counts

A state's count shall show inline after its label in `ui-state-machine-view__count`, a small [Badge](BADGE.md) in the same row, hidden from assistive technology. A structural `count` shows its exact whole value, zero included, in a neutral subtle badge (`data-kind="structural"`). A `notificationCount` shows only when positive, as a solid danger badge capped at `9+` (`data-kind="notification"`). A structural count wins when both are given. The button's description reads the shown count once, as `countLabel` or the provider's `itemCount` with the exact count. Counts keep their content and semantics in both densities and on disabled states.

Implementation: `src/components/state-machine-view/sequence-states.tsx`, `src/components/state-machine-view/describe-state.ts`
Verification: `src/components/state-machine-view/sequence-content.test.tsx`, `e2e/state-machine-view-sequence-interaction.spec.ts`

### UIC-STATE-MACHINE-VIEW-6.3 - Tooltips

`getStateTooltip(state)` shall give a state a [Tooltip](TOOLTIP.md), opened on hover and keyboard focus above the row, or below it with `stateTooltipPlacement="bottom"`; `getTransitionTooltip(transition)` gives a transition label its own. Tooltips render in the shared overlay layer, so chevrons and the scrolling viewport never clip them. A hint, and a transition's `description`, are also read, always, in the control's accessible description, from a visually hidden element whose id is unique per mounted instance, so it is never announced twice. Only transition label controls carry transition descriptions; routes stay inert.

Implementation: `src/components/state-machine-view/sequence-states.tsx`, `src/components/state-machine-view/state-machine-sequence.tsx`
Verification: `src/components/state-machine-view/sequence-content.test.tsx`, `e2e/state-machine-view-sequence-interaction.spec.ts`

### UIC-STATE-MACHINE-VIEW-6.4 - Empty sequence

With no states the root shall carry `data-empty` and its viewport hold a focusable note (`ui-state-machine-view__empty`, `role="note"`) named by `emptyLabel` or the provider's `stateMachineEmpty`, and described by `renderEmptyState()` content in `ui-state-machine-view__empty-content`. The Context Menu key or Shift+F10 on the note, or a secondary click on it, calls `onBackgroundContextMenu` with the note as anchor. Adding states replaces the note, and removing them all brings it back, in the same root element; a read-only host without callbacks still shows the note.

Implementation: `src/components/state-machine-view/state-machine-sequence.tsx`
Verification: `src/components/state-machine-view/sequence-content.test.tsx`, `e2e/state-machine-view-sequence-interaction.spec.ts`

## Hooks

| Hook                                      | Kind      | Values                                            | Description                                                                 |
| ----------------------------------------- | --------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| `ui-state-machine-view`                   | root      |                                                   | Graph canvas root (also `ui-diagram-canvas`) or sequence root.              |
| `ui-state-machine-view__state`            | slot      |                                                   | A state's content; a button in sequence mode.                               |
| `ui-state-machine-view__state-content`    | slot      |                                                   | A sequence state's measured content: adornment, label and count.            |
| `ui-state-machine-view__state-adornment`  | slot      |                                                   | Decorative content before a sequence state's label.                         |
| `ui-state-machine-view__state-label`      | slot      |                                                   | A state's label.                                                            |
| `ui-state-machine-view__count`            | slot      |                                                   | A sequence state's count badge.                                             |
| `ui-state-machine-view__initial-marker`   | slot      |                                                   | The marker drawn on the initial state.                                      |
| `data-orientation`                        | attribute | `horizontal`, `vertical`                          | On the root: which way the layers run.                                      |
| `data-current`                            | state     | `true`                                            | On the state the machine is in.                                             |
| `data-initial`                            | state     | `true`                                            | On the initial state.                                                       |
| `data-final`                              | state     | `true`                                            | On a final state.                                                           |
| `data-presentation`                       | attribute | `graph`, `sequence`                               | On the root: chosen presentation.                                           |
| `data-density`                            | attribute | `default`, `compact`                              | Sequence root density.                                                      |
| `data-size`                               | attribute | `xs`, `sm`, `md`, `lg`, `xl`                      | Sequence root size; defaults to `md`.                                       |
| `ui-state-machine-view__viewport`         | slot      |                                                   | Sequence horizontal scrolling viewport.                                     |
| `ui-state-machine-view__content`          | slot      |                                                   | Shared measured coordinate space.                                           |
| `ui-state-machine-view__state-row`        | slot      |                                                   | Ordered state layer.                                                        |
| `ui-state-machine-view__state-position`   | slot      |                                                   | Positioned state group.                                                     |
| `ui-state-machine-view__routes`           | slot      |                                                   | Decorative SVG, without pointer events or focus.                            |
| `ui-state-machine-view__route`            | slot      |                                                   | Decorative route group.                                                     |
| `ui-state-machine-view__connector`        | slot      |                                                   | Rounded orthogonal stroke.                                                  |
| `ui-state-machine-view__arrow`            | slot      |                                                   | Open-stroke arrowhead.                                                      |
| `ui-state-machine-view__transition-label` | slot      |                                                   | Independent transition button.                                              |
| `ui-state-machine-view__empty`            | slot      |                                                   | The focusable note of an empty sequence.                                    |
| `ui-state-machine-view__empty-content`    | slot      |                                                   | The host's empty content inside the note.                                   |
| `data-key`                                | attribute |                                                   | Typed state/transition identity on positioned states, routes and labels.    |
| `data-first`                              | state     | `true`                                            | On the first sequence state and its position.                               |
| `data-last`                               | state     | `true`                                            | On the last sequence state and its position.                                |
| `data-selected`                           | state     | `true`                                            | On the selected sequence state and position, or transition route and label. |
| `data-direction`                          | attribute | `forward`, `reverse`                              | On each route and label. Loops are forward.                                 |
| `data-lane`                               | attribute |                                                   | Zero-based lane index on its side, on route and label.                      |
| `data-disabled`                           | state     | `true`                                            | On a disabled sequence state and its position.                              |
| `data-status`                             | attribute |                                                   | The host's status name, on a state and its position.                        |
| `data-tone`                               | attribute | `neutral`, `info`, `success`, `warning`, `danger` | A state's status tone.                                                      |
| `data-kind`                               | attribute | `structural`, `notification`                      | On a count: which count it shows.                                           |
| `data-empty`                              | state     | `true`                                            | On a sequence root without states.                                          |
| `data-outgoing`                           | state     | `true`                                            | Route/label starts at the selected state.                                   |
| `data-hovered`                            | state     | `true`                                            | On a hovered sequence state or label button.                                |
| `data-pressed`                            | state     | `true`                                            | On a pressed sequence state or label button.                                |
| `data-focused`                            | state     | `true`                                            | On a focused sequence state or label button.                                |
| `data-focus-visible`                      | state     | `true`                                            | On a keyboard-focused sequence state or label button.                       |
| `--ui-sequence-lane-pitch`                | property  |                                                   | Resolved lane pitch, on content.                                            |
| `--ui-sequence-state-gap`                 | property  |                                                   | Resolved state gap, on content.                                             |
| `--ui-sequence-row-spacer`                | property  |                                                   | Resolved row clearance, on content.                                         |
