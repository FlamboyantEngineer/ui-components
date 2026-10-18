---
'@flamboyantengineer/ui-components': minor
---

Add `DiagramCanvas` and `StateMachineView`, a headless diagram canvas built in the library with no diagram engine.

- `DiagramCanvas`: plain-data nodes rendered by `renderNode` and edges drawn as SVG paths, ports, pan (background drag, wheel) and zoom (Ctrl or Command with the wheel, `+`/`-`, a `ZoomControl`, fit to view), selection by click, Shift-click, Space and marquee, moving nodes by pointer or arrow keys on a grid, connecting ports by drag or keyboard, removing with Delete, a minimap, a palette (`DiagramPaletteItem`, press or drag to add), keyboard moves between connected nodes, an outline view, and change callbacks (`onNodesChange`, `onEdgesChange`, `onConnect`, `onNodeAdd`).
- `routeDiagramEdge`: straight, orthogonal or bezier edge routing as a pure function.
- `StateMachineView`: states and labelled transitions on a `DiagramCanvas`, laid out automatically, with initial, final and current state markers; read only by default, with an edit mode.
- `layoutLayeredGraph`: a pure layered graph layout.
- Diagram strings in a new `diagram-strings` module (`diagram*`, `stateMachine*`).
