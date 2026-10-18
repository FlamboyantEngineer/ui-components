// Sample diagram data and viewport stubs shared by the diagram canvas tests.

import { useState } from 'react';
import { vi } from 'vitest';
import {
  DiagramCanvas,
  type DiagramCanvasProps,
  type DiagramEdge,
  type DiagramNode,
} from '../src/components/diagram-canvas/diagram-canvas.js';

export const pipeNodes: DiagramNode[] = [
  {
    id: 'pump',
    x: 0,
    y: 0,
    label: 'Pump',
    ports: [{ id: 'out', side: 'right', label: 'outlet' }],
  },
  {
    id: 'valve',
    x: 300,
    y: 0,
    label: 'Valve',
    description: 'Open.',
    ports: [
      { id: 'in', side: 'left', label: 'inlet' },
      { id: 'out', side: 'right', label: 'outlet', position: 0.25 },
    ],
  },
  { id: 'tank', x: 300, y: 200, width: 120, height: 60, label: 'Tank' },
];

export const pipeEdges: DiagramEdge[] = [
  { id: 'e1', source: 'pump', target: 'valve', sourcePort: 'out', targetPort: 'in', label: 'flow' },
  { id: 'e2', source: 'valve', target: 'tank' },
];

/** A canvas that applies its own changes, as a caller would. */
export function EditableDiagram(props: Partial<DiagramCanvasProps>) {
  const [nodes, setNodes] = useState(pipeNodes);
  const [edges, setEdges] = useState(pipeEdges);
  return (
    <DiagramCanvas
      aria-label="Pipes"
      nodes={nodes}
      edges={edges}
      defaultViewport={{ x: 0, y: 0, zoom: 100 }}
      isEditing
      {...props}
      onNodesChange={(next) => {
        props.onNodesChange?.(next);
        setNodes(next);
      }}
      onEdgesChange={(next) => {
        props.onEdgesChange?.(next);
        setEdges(next);
      }}
      onConnect={(connection) => {
        props.onConnect?.(connection);
        setEdges((current) => [
          ...current,
          { id: `e${current.length + 1}`, source: connection.source, target: connection.target },
        ]);
      }}
    />
  );
}

/** Gives every element a client size and a `ResizeObserver` that reports it at once. */
export function stubViewportSize(width: number, height: number): void {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(height);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        const entry = { target, contentRect: { width, height } };
        this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
      }
      unobserve() {}
      disconnect() {}
    },
  );
}
