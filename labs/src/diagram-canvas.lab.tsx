import { type CSSProperties, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  DiagramCanvas,
  type DiagramEdge,
  type DiagramEdgeRouting,
  type DiagramNode,
  type DiagramNodeAddRequest,
  DiagramPaletteItem,
  type DiagramViewport,
} from '../../src/components/diagram-canvas/diagram-canvas.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { PlusGlyph } from '../../src/core/glyphs.js';
import type { Key, Selection } from '../../src/core/props.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { ControlledSelection, GridAndViewport, RouteHelper } from './diagram-canvas-cases.js';

interface Part {
  kind: string;
}

const routings = ['straight', 'orthogonal', 'bezier'] as const;
const states = ['resting', 'selected', 'editing', 'empty', 'outline'] as const;

const sampleNodes: DiagramNode[] = [
  {
    id: 'a',
    x: 0,
    y: 0,
    width: 120,
    height: 40,
    label: 'Inlet',
    ports: [{ id: 'out', side: 'right', label: 'out' }],
  },
  {
    id: 'b',
    x: 200,
    y: 80,
    width: 120,
    height: 40,
    label: 'Filter',
    ports: [{ id: 'in', side: 'left', label: 'in' }],
  },
  { id: 'c', x: 200, y: -60, width: 120, height: 40, label: 'Outlet' },
];

const sampleEdges: DiagramEdge[] = [
  { id: 'ab', source: 'a', target: 'b', sourcePort: 'out', targetPort: 'in', label: 'feed' },
  { id: 'ac', source: 'a', target: 'c' },
];

const plantNodes: DiagramNode<Part>[] = [
  {
    id: 'source',
    x: 0,
    y: 120,
    label: 'Source tank',
    data: { kind: 'Tank' },
    ports: [{ id: 'out', side: 'right', label: 'outlet' }],
  },
  {
    id: 'pump',
    x: 240,
    y: 120,
    label: 'Pump',
    data: { kind: 'Pump' },
    ports: [
      { id: 'in', side: 'left', label: 'inlet' },
      { id: 'out', side: 'right', label: 'outlet' },
    ],
  },
  {
    id: 'filter',
    x: 480,
    y: 40,
    label: 'Filter',
    data: { kind: 'Filter' },
    ports: [
      { id: 'in', side: 'left', label: 'inlet' },
      { id: 'out', side: 'right', label: 'outlet' },
    ],
  },
  {
    id: 'bypass',
    x: 480,
    y: 200,
    label: 'Bypass valve',
    data: { kind: 'Valve' },
    ports: [
      { id: 'in', side: 'left', label: 'inlet' },
      { id: 'out', side: 'right', label: 'outlet' },
    ],
  },
  {
    id: 'store',
    x: 720,
    y: 120,
    label: 'Storage tank',
    data: { kind: 'Tank' },
    ports: [{ id: 'in', side: 'left', label: 'inlet' }],
  },
];

const plantEdges: DiagramEdge[] = [
  {
    id: 'feed',
    source: 'source',
    target: 'pump',
    sourcePort: 'out',
    targetPort: 'in',
    label: 'feed',
  },
  { id: 'clean', source: 'pump', target: 'filter', sourcePort: 'out', targetPort: 'in' },
  {
    id: 'skip',
    source: 'pump',
    target: 'bypass',
    sourcePort: 'out',
    targetPort: 'in',
    label: 'skip',
  },
  { id: 'filtered', source: 'filter', target: 'store', sourcePort: 'out', targetPort: 'in' },
  { id: 'unfiltered', source: 'bypass', target: 'store', sourcePort: 'out', targetPort: 'in' },
];

const moduleNodes: DiagramNode[] = [
  { id: 'reader', x: 0, y: 80, label: 'Reader' },
  { id: 'parser', x: 220, y: 80, label: 'Parser' },
  { id: 'checker', x: 440, y: 0, label: 'Checker' },
  { id: 'printer', x: 440, y: 160, label: 'Printer' },
  { id: 'report', x: 660, y: 80, label: 'Report' },
];

const moduleEdges: DiagramEdge[] = [
  { id: 'r-p', source: 'reader', target: 'parser', label: 'tokens' },
  { id: 'p-c', source: 'parser', target: 'checker', label: 'tree' },
  { id: 'p-o', source: 'parser', target: 'printer' },
  { id: 'c-r', source: 'checker', target: 'report' },
  { id: 'o-r', source: 'printer', target: 'report' },
  { id: 'c-p', source: 'checker', target: 'parser', label: 'retry' },
];

const small: CSSProperties = { width: 340 };

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function formatKeys(keys: Selection): string {
  return keys === 'all' ? 'all' : [...keys].join(', ') || 'none';
}

function StateSample({
  state,
  routing,
}: {
  state: (typeof states)[number];
  routing: DiagramEdgeRouting;
}) {
  return (
    <div style={small}>
      <DiagramCanvas
        aria-label={`Sample, ${state}, ${routing}`}
        nodes={state === 'empty' ? [] : sampleNodes}
        edges={state === 'empty' ? [] : sampleEdges}
        routing={routing}
        isEditing={state === 'editing'}
        defaultSelectedKeys={state === 'selected' ? ['b', 'ab'] : undefined}
        defaultView={state === 'outline' ? 'outline' : 'canvas'}
        showMinimap={false}
      />
    </div>
  );
}

function PartContent({ node }: { node: DiagramNode<Part> }) {
  return (
    <>
      <strong>{node.label}</strong>
      <small>{node.data?.kind}</small>
    </>
  );
}

/** Removes the selected parts two seconds after the press, so a drag can be running when they go. */
function DelayedRemove({ onRemove }: { onRemove: () => void }) {
  const [isPending, setPending] = useState(false);
  return (
    <Button
      size="sm"
      isDisabled={isPending}
      onPress={() => {
        setPending(true);
        window.setTimeout(() => {
          setPending(false);
          onRemove();
        }, 2000);
      }}
    >
      {isPending ? 'Removing soon…' : 'Remove selected in 2 seconds'}
    </Button>
  );
}

function Plant() {
  const [isEditing, setEditing] = useState(true);
  const [nodes, setNodes] = useState(plantNodes);
  const [edges, setEdges] = useState(plantEdges);
  const [selection, setSelection] = useState<Selection>(new Set<Key>());
  const [viewport, setViewport] = useState<DiagramViewport | null>(null);
  const [routing, setRouting] = useState<DiagramEdgeRouting>('bezier');
  const [count, setCount] = useState(0);
  const add = ({ type, x, y }: DiagramNodeAddRequest) => {
    const id = `${type.toLowerCase()}-${count + 1}`;
    setCount(count + 1);
    const ports = [
      { id: 'in', side: 'left' as const, label: 'inlet' },
      { id: 'out', side: 'right' as const, label: 'outlet' },
    ];
    setNodes([
      ...nodes,
      { id, x: x - 80, y: y - 24, label: `${type} ${count + 1}`, data: { kind: type }, ports },
    ]);
  };
  return (
    <>
      <SegmentedChoice
        aria-label="Routing"
        options={routings.map((value) => ({ value, label: value }))}
        value={routing}
        onChange={(value) => setRouting((value as DiagramEdgeRouting | null) ?? 'bezier')}
        size="sm"
      />
      <label>
        <input
          type="checkbox"
          checked={isEditing}
          onChange={(event) => setEditing(event.currentTarget.checked)}
        />{' '}
        Editing enabled
      </label>
      <DelayedRemove
        onRemove={() => {
          const isGone = (id: Key) => selection === 'all' || selection.has(id);
          setNodes((current) => current.filter((node) => !isGone(node.id)));
          setEdges((current) =>
            current.filter((edge) => !isGone(edge.source) && !isGone(edge.target)),
          );
        }}
      />
      <DiagramCanvas<Part>
        aria-label="Water plant"
        data-lab-field="plant"
        nodes={nodes}
        edges={edges}
        routing={routing}
        isEditing={isEditing}
        renderNode={(node) => <PartContent node={node} />}
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
        onConnect={(connection) =>
          setEdges([
            ...edges,
            {
              id: `${String(connection.source)}-${String(connection.target)}-${edges.length}`,
              source: connection.source,
              target: connection.target,
              sourcePort: connection.sourcePort,
              targetPort: connection.targetPort ?? 'in',
            },
          ])
        }
        onNodeAdd={add}
        onSelectionChange={setSelection}
        onViewportChange={setViewport}
        palette={
          <>
            <DiagramPaletteItem type="Pump" label="Pump" icon={PlusGlyph} />
            <DiagramPaletteItem type="Valve" label="Valve" icon={PlusGlyph} />
            <DiagramPaletteItem type="Tank" label="Tank" icon={PlusGlyph} />
          </>
        }
      />
      <Output name="selection" value={formatKeys(selection)} />
      <Output name="zoom" value={viewport ? `${Math.round(viewport.zoom)}%` : 'fitted'} />
      <Output
        name="nodes"
        value={nodes.map((node) => `${node.label} ${node.x},${node.y}`).join('; ')}
      />
      <Output
        name="edges"
        value={edges.map((edge) => `${String(edge.source)}→${String(edge.target)}`).join(', ')}
      />
    </>
  );
}

interface Note {
  text: string;
}

const noteNodes: DiagramNode<Note>[] = [
  {
    id: 'intake',
    x: 20,
    y: 20,
    width: 220,
    height: 96,
    label: 'Intake',
    data: { text: 'Check filters' },
  },
  {
    id: 'outlet',
    x: 320,
    y: 60,
    width: 220,
    height: 96,
    label: 'Outlet',
    data: { text: 'Open slowly' },
  },
];

function NoteContent({ node, onFlag }: { node: DiagramNode<Note>; onFlag: () => void }) {
  return (
    <>
      <strong>{node.label}</strong>
      <input aria-label={`${node.label} note`} defaultValue={node.data?.text} />
      <button type="button" onClick={onFlag}>{`Flag ${node.label}`}</button>
    </>
  );
}

function NodeControls() {
  const [nodes, setNodes] = useState(noteNodes);
  const [flagged, setFlagged] = useState('None');
  return (
    <>
      <DiagramCanvas<Note>
        aria-label="Notes"
        data-lab-field="notes"
        nodes={nodes}
        edges={[]}
        isEditing
        renderNode={(node) => <NoteContent node={node} onFlag={() => setFlagged(node.label)} />}
        onNodesChange={setNodes}
      />
      <Output name="flagged" value={flagged} />
      <Output
        name="note-nodes"
        value={nodes.map((node) => `${node.label} ${node.x},${node.y}`).join('; ')}
      />
    </>
  );
}

const logLines = Array.from({ length: 12 }, (_, index) => `Reading ${index + 1}: steady`).join(
  '\n',
);

const logNodes: DiagramNode[] = [
  { id: 'log', x: 20, y: 20, width: 220, height: 180, label: 'Log' },
];

function ScrollingNodes() {
  const [viewport, setViewport] = useState<DiagramViewport>({ x: 0, y: 0, zoom: 100 });
  return (
    <>
      <DiagramCanvas
        aria-label="Log"
        data-lab-field="log"
        nodes={logNodes}
        edges={[]}
        viewport={viewport}
        onViewportChange={setViewport}
        renderNode={(node) => (
          <>
            <strong>{node.label}</strong>
            <textarea aria-label={`${node.label} entries`} rows={3} defaultValue={logLines} />
            <div
              role="region"
              aria-label={`${node.label} horizontal entries`}
              tabIndex={0}
              dir="rtl"
              style={{ width: 180, overflowX: 'auto' }}
            >
              <div style={{ width: 480, whiteSpace: 'nowrap' }}>
                Reading 1: steady · Reading 2: steady · Reading 3: steady
              </div>
            </div>
          </>
        )}
      />
      <Output
        name="log-view"
        value={`${Math.round(viewport.x)},${Math.round(viewport.y)} at ${Math.round(viewport.zoom)}%`}
      />
    </>
  );
}

const sameSideNodes: DiagramNode[] = [
  {
    id: 'feed',
    x: 0,
    y: 0,
    width: 120,
    height: 48,
    label: 'Feed',
    ports: [{ id: 'out', side: 'right', label: 'out' }],
  },
  {
    id: 'return',
    x: 220,
    y: 0,
    width: 120,
    height: 48,
    label: 'Return',
    ports: [{ id: 'in', side: 'right', label: 'in' }],
  },
  {
    id: 'upper',
    x: 0,
    y: 140,
    width: 120,
    height: 48,
    label: 'Upper',
    ports: [{ id: 'down', side: 'bottom', label: 'down' }],
  },
  {
    id: 'lower',
    x: 0,
    y: 260,
    width: 120,
    height: 48,
    label: 'Lower',
    ports: [{ id: 'down', side: 'bottom', label: 'down' }],
  },
];

const sameSideEdges: DiagramEdge[] = [
  {
    id: 'loop-back',
    source: 'feed',
    target: 'return',
    sourcePort: 'out',
    targetPort: 'in',
    label: 'back',
  },
  {
    id: 'drop',
    source: 'upper',
    target: 'lower',
    sourcePort: 'down',
    targetPort: 'down',
    label: 'drop',
  },
];

const stateNodes: DiagramNode[] = [
  {
    id: 'idle',
    x: 0,
    y: 60,
    width: 120,
    height: 48,
    label: 'Idle',
    ports: [{ id: 'out', side: 'right', label: 'out' }],
  },
  {
    id: 'running',
    x: 300,
    y: 60,
    width: 120,
    height: 48,
    label: 'Running',
    ports: [{ id: 'in', side: 'left', label: 'in' }],
  },
];

const stateEdges: DiagramEdge[] = [
  {
    id: 'start',
    source: 'idle',
    target: 'running',
    sourcePort: 'out',
    targetPort: 'in',
    label: 'start',
  },
  {
    id: 'resume',
    source: 'idle',
    target: 'running',
    sourcePort: 'out',
    targetPort: 'in',
    label: 'resume',
  },
  {
    id: 'retry',
    source: 'idle',
    target: 'running',
    sourcePort: 'out',
    targetPort: 'in',
    label: 'retry',
  },
  { id: 'stop', source: 'running', target: 'idle', label: 'stop' },
  { id: 'tick', source: 'running', target: 'running', label: 'tick' },
  { id: 'poll', source: 'running', target: 'running', label: 'poll' },
];

function StateMachine() {
  const [routing, setRouting] = useState<DiagramEdgeRouting>('bezier');
  return (
    <>
      <SegmentedChoice
        aria-label="State routing"
        options={routings.map((value) => ({ value, label: value }))}
        value={routing}
        onChange={(value) => setRouting((value as DiagramEdgeRouting | null) ?? 'bezier')}
        size="sm"
      />
      <DiagramCanvas
        aria-label="States"
        data-lab-field="states"
        nodes={stateNodes}
        edges={stateEdges}
        routing={routing}
      />
    </>
  );
}

function Modules() {
  const [selection, setSelection] = useState<Selection>(new Set<Key>());
  return (
    <>
      <DiagramCanvas
        aria-label="Modules"
        data-lab-field="modules"
        nodes={moduleNodes}
        edges={moduleEdges}
        routing="orthogonal"
        selectionMode="single"
        onSelectionChange={setSelection}
      />
      <Output name="module" value={formatKeys(selection)} />
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Resting, a selected node and edge, edit mode with port buttons, no nodes and the outline view, for each edge routing."
    >
      <StateMatrix
        axes={{ state: states, routing: routings }}
        render={({ state, routing }) => <StateSample state={state} routing={routing} />}
      />
    </LabSection>
    <LabSection
      title="Editable plant"
      description="Drag parts on the 10 pixel grid or move them with the arrow keys (Shift for larger steps); Shift-drag the background for a marquee; drag from a port, or press a port then a part, to connect; press or drag a palette item to add a part; Delete removes. Leaving edit mode discards unfinished moves and connections, and so does a part that goes mid-drag: press Remove selected in 2 seconds, then drag a selected part or its port until it goes. A connection started from a port, by click or keyboard, is given up too when its part or port goes or the outline is shown, and does not come back with the diagram. Selecting and panning still work. Cancelled drags discard their drafts. The wheel pans, Ctrl or Command with the wheel zooms."
    >
      <Plant />
    </LabSection>
    <LabSection
      title="Grid snapping and starting view"
      description="Grid size snaps moved blocks: Off (0) keeps every pixel and the arrow keys move one pixel, the 10 pixel default and 25 pixels step the keys by the grid and snap where a move lands, so 25 then one step at 10 lands on 40. The canvas starts at its own pan and zoom (defaultViewport, 150%) instead of fitting the blocks, then follows wheel, keys and toolbar on its own; the lines below read the positions and the view."
    >
      <GridAndViewport />
    </LabSection>
    <LabSection
      title="Selection and view from outside"
      description="The host owns the selection (selectedKeys) and the view (view with onViewChange): the buttons select from outside, the canvas's own presses and the outline's toggle report back, and the same selection shows in the diagram and the outline."
    >
      <ControlledSelection />
    </LabSection>
    <LabSection
      title="Edge routing helper"
      description="The exported routeDiagramEdge drawn by the host: two edges between the same boxes, one each way, shifted by the chosen offset to the right of travel so they stay apart, for each route. The lines below show the path data it returns."
    >
      <RouteHelper />
    </LabSection>
    <LabSection
      title="Controls in nodes"
      description="Each node holds a text field and a button. Pressing the button runs its action and dragging in the field selects text; neither moves the node. Drag the node by its title to move it."
    >
      <NodeControls />
    </LabSection>
    <LabSection
      title="Scrolling inside nodes"
      description="The wheel over the log's entries scrolls them while they can scroll that way, then pans the view at their end. The horizontal entries scroll right to left; horizontal wheel input stays with them until the corresponding limit. Ctrl or Command with the wheel zooms even over the entries. Wheel lines and pages count as pixels."
    >
      <ScrollingNodes />
    </LabSection>
    <LabSection
      title="Ports on the same side"
      description="Orthogonal edges between ports on the same side detour around both parts, here between two right ports in a row and two bottom ports in a column, instead of running through the other part."
    >
      <DiagramCanvas
        aria-label="Same side ports"
        data-lab-field="same-side"
        nodes={sameSideNodes}
        edges={sameSideEdges}
        routing="orthogonal"
      />
    </LabSection>
    <LabSection
      title="Parallel edges and loops"
      description="Three transitions share the same two ports, a fourth runs back without ports and two loops sit on one state. Curved and orthogonal edges part their routes and labels while port ends stay put and loops start from the same points; straight edges between the same ports share their line and part their labels."
    >
      <StateMachine />
    </LabSection>
    <LabSection
      title="Read only graph"
      description="Tab to a module, then move between connected modules with the arrow keys; switch to the outline to read the graph as a list. Both views preserve each node and connection when reordered, including numeric and text keys with the same spelling, and list connections in edge order with parallel connections and loops."
    >
      <Modules />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page the outline's selected item is marked on its right edge, the start side."
    >
      <div dir="rtl" style={small} data-lab-demo="rtl">
        <DiagramCanvas
          aria-label="Sample, right to left"
          nodes={sampleNodes}
          edges={sampleEdges}
          defaultSelectedKeys={['b']}
          defaultView="outline"
          showMinimap={false}
        />
      </div>
    </LabSection>
  </>,
);
