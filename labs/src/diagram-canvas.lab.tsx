import { useState, type CSSProperties } from 'react';
import type { Key, Selection } from '../../src/core/props.js';
import {
  DiagramCanvas,
  DiagramPaletteItem,
  type DiagramEdge,
  type DiagramEdgeRouting,
  type DiagramNode,
  type DiagramNodeAddRequest,
  type DiagramViewport,
} from '../../src/components/diagram-canvas/diagram-canvas.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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
            <DiagramPaletteItem type="Pump" label="Pump" icon="plus" />
            <DiagramPaletteItem type="Valve" label="Valve" icon="plus" />
            <DiagramPaletteItem type="Tank" label="Tank" icon="plus" />
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
      description="Drag parts on the 10 pixel grid or move them with the arrow keys (Shift for larger steps); Shift-drag the background for a marquee; drag from a port, or press a port then a part, to connect; press or drag a palette item to add a part; Delete removes. Leaving edit mode discards unfinished moves and connections; selecting and panning still work. Cancelled drags discard their drafts. The wheel pans, Ctrl or Command with the wheel zooms."
    >
      <Plant />
    </LabSection>
    <LabSection
      title="Read only graph"
      description="Tab to a module, then move between connected modules with the arrow keys; switch to the outline to read the graph as a list. Both views preserve each node and connection when reordered, including numeric and text keys with the same spelling, and list connections in edge order with parallel connections and loops."
    >
      <Modules />
    </LabSection>
  </>,
);
