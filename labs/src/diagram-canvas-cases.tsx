import { useState } from 'react';
import type { Key, Selection } from '../../src/core/props.js';
import {
  DiagramCanvas,
  routeDiagramEdge,
  type DiagramEdge,
  type DiagramEdgeRouting,
  type DiagramNode,
  type DiagramRect,
  type DiagramView,
  type DiagramViewport,
} from '../../src/components/diagram-canvas/index.js';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function formatKeys(keys: Selection): string {
  return keys === 'all' ? 'all' : [...keys].map(String).join(', ') || 'none';
}

const blockNodes: DiagramNode[] = [
  { id: 'mixer', x: 0, y: 0, width: 120, height: 40, label: 'Mixer' },
  { id: 'heater', x: 220, y: 60, width: 120, height: 40, label: 'Heater' },
  { id: 'cooler', x: 220, y: -60, width: 120, height: 40, label: 'Cooler' },
];

const blockEdges: DiagramEdge[] = [
  { id: 'mixer-heater', source: 'mixer', target: 'heater' },
  { id: 'mixer-cooler', source: 'mixer', target: 'cooler' },
];

const gridSizes = { off: 0, default: 10, coarse: 25 } as const;

type GridChoice = keyof typeof gridSizes;

const isGridChoice = (value: unknown): value is GridChoice =>
  typeof value === 'string' && Object.hasOwn(gridSizes, value);

const startView: DiagramViewport = { x: 60, y: 90, zoom: 150 };

/**
 * Snapping off, at the default 10 pixels and at 25, read from the moved positions; the canvas
 * starts at a pan and zoom of its own (`defaultViewport`) rather than fitting its nodes.
 */
export function GridAndViewport() {
  const [grid, setGrid] = useState<GridChoice>('off');
  const [nodes, setNodes] = useState(blockNodes);
  const [viewport, setViewport] = useState<DiagramViewport>(startView);
  return (
    <div data-lab-demo="grid">
      <SegmentedChoice
        aria-label="Grid size"
        size="sm"
        sizing="content"
        options={[
          { value: 'off', label: 'Off (0)' },
          { value: 'default', label: '10 pixels (default)' },
          { value: 'coarse', label: '25 pixels' },
        ]}
        value={grid}
        onChange={(value) => {
          if (isGridChoice(value)) setGrid(value);
        }}
      />
      <Button size="sm" variant="secondary" onPress={() => setNodes(blockNodes)}>
        Put the blocks back
      </Button>
      <div style={{ width: 420 }}>
        <DiagramCanvas
          aria-label="Snapping blocks"
          data-lab-field="grid"
          nodes={nodes}
          edges={blockEdges}
          isEditing
          gridSize={gridSizes[grid]}
          defaultViewport={startView}
          onNodesChange={setNodes}
          onViewportChange={setViewport}
        />
      </div>
      <Output
        name="grid-nodes"
        value={nodes.map((node) => `${node.label} ${node.x},${node.y}`).join('; ')}
      />
      <Output
        name="grid-viewport"
        value={`${Math.round(viewport.x)},${Math.round(viewport.y)} at ${Math.round(viewport.zoom)}%`}
      />
    </div>
  );
}

/** Selection and view owned by the host, with outside controls, read in canvas and outline. */
export function ControlledSelection() {
  const [selected, setSelected] = useState<Selection>(new Set<Key>(['heater']));
  const [view, setView] = useState<DiagramView>('canvas');
  return (
    <div data-lab-demo="controlled">
      <p>
        <Button size="sm" variant="secondary" onPress={() => setSelected(new Set(['mixer']))}>
          Select Mixer
        </Button>{' '}
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setSelected(new Set(['heater', 'cooler']))}
        >
          Select Heater and Cooler
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => setSelected(new Set())}>
          Clear selection
        </Button>{' '}
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setView(view === 'canvas' ? 'outline' : 'canvas')}
        >
          {view === 'canvas' ? 'Show the outline' : 'Show the diagram'}
        </Button>
      </p>
      <div style={{ width: 420 }}>
        <DiagramCanvas
          aria-label="Controlled blocks"
          data-lab-field="controlled"
          nodes={blockNodes}
          edges={blockEdges}
          selectedKeys={selected}
          onSelectionChange={setSelected}
          view={view}
          onViewChange={setView}
        />
      </div>
      <Output name="controlled-selection" value={formatKeys(selected)} />
      <Output name="controlled-view" value={view} />
    </div>
  );
}

const from: DiagramRect = { x: 10, y: 50, width: 90, height: 40 };
const to: DiagramRect = { x: 230, y: 110, width: 90, height: 40 };
const routes: readonly DiagramEdgeRouting[] = ['straight', 'orthogonal', 'bezier'];
const offsets = { none: 0, apart: 12, wide: 24 } as const;

type OffsetChoice = keyof typeof offsets;

const isOffsetChoice = (value: unknown): value is OffsetChoice =>
  typeof value === 'string' && Object.hasOwn(offsets, value);

const isRouting = (value: unknown): value is DiagramEdgeRouting =>
  typeof value === 'string' && routes.some((route) => route === value);

/**
 * The exported `routeDiagramEdge` helper on its own: two edges between the same boxes, one
 * shifted by `offset` each way, drawn from the geometry it returns.
 */
export function RouteHelper() {
  const [routing, setRouting] = useState<DiagramEdgeRouting>('bezier');
  const [offset, setOffset] = useState<OffsetChoice>('apart');
  const ends = { source: { rect: from }, target: { rect: to }, routing };
  const forth = routeDiagramEdge({ ...ends, offset: offsets[offset] });
  const back = routeDiagramEdge({
    source: { rect: to },
    target: { rect: from },
    routing,
    offset: offsets[offset],
  });
  return (
    <div data-lab-demo="route">
      <SegmentedChoice
        aria-label="Route"
        size="sm"
        sizing="content"
        options={routes.map((value) => ({ value, label: value }))}
        value={routing}
        onChange={(value) => {
          if (isRouting(value)) setRouting(value);
        }}
      />
      <SegmentedChoice
        aria-label="Offset"
        size="sm"
        sizing="content"
        options={[
          { value: 'none', label: '0' },
          { value: 'apart', label: '12' },
          { value: 'wide', label: '24' },
        ]}
        value={offset}
        onChange={(value) => {
          if (isOffsetChoice(value)) setOffset(value);
        }}
      />
      <svg
        role="img"
        aria-label={`Two ${routing} routes between the same boxes, ${offsets[offset]} pixels apart each way`}
        width={340}
        height={200}
        viewBox="0 0 340 200"
        fill="none"
        stroke="currentColor"
      >
        {[from, to].map((rect) => (
          <rect key={rect.x} {...rect} rx={6} />
        ))}
        {[forth, back].map((route, index) => (
          <g key={index}>
            <path d={route.path} data-route={index === 0 ? 'forth' : 'back'} />
            <path d={route.arrow} fill="currentColor" />
          </g>
        ))}
      </svg>
      <Output name="route-forth" value={forth.path} />
      <Output name="route-back" value={back.path} />
    </div>
  );
}
