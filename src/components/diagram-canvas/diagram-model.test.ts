import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import {
  findConnectedNode,
  findDiagramBounds,
  fitDiagramViewport,
  isRectOverlap,
  resolveNodeRect,
  snapToGrid,
  spreadParallelEdges,
  toDiagramPoint,
  zoomDiagramViewport,
  type DiagramEdge,
  type DiagramNode,
} from './diagram-model.js';

const nodes: DiagramNode[] = [
  { id: 'hub', x: 200, y: 200, label: 'Hub' },
  { id: 'east', x: 500, y: 220, label: 'East' },
  { id: 'far-east', x: 800, y: 200, label: 'Far east' },
  { id: 'north', x: 210, y: 0, label: 'North' },
  { id: 'south', x: 180, y: 400, width: 100, height: 30, label: 'South' },
];

const edges: DiagramEdge[] = [
  { id: 'e1', source: 'hub', target: 'east' },
  { id: 'e2', source: 'north', target: 'hub' },
  { id: 'e3', source: 'hub', target: 'south' },
  { id: 'e4', source: 'hub', target: 'hub' },
];

describe('diagram model', () => {
  it('UIC-DIAGRAM-CANVAS-1.2 sizes nodes by default and bounds them', () => {
    expect(resolveNodeRect(requireDefined(nodes[0]))).toEqual({
      x: 200,
      y: 200,
      width: 160,
      height: 48,
    });
    expect(resolveNodeRect(requireDefined(nodes[4]))).toEqual({
      x: 180,
      y: 400,
      width: 100,
      height: 30,
    });
    expect(findDiagramBounds(nodes.slice(3).map(resolveNodeRect), 10)).toEqual({
      x: 170,
      y: -10,
      width: 210,
      height: 450,
    });
    expect(findDiagramBounds([])).toBeNull();
    expect(
      isRectOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }),
    ).toBe(true);
    expect(
      isRectOverlap({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 5, height: 5 }),
    ).toBe(false);
  });

  it('UIC-DIAGRAM-CANVAS-1.2 bounds a large diagram without argument limits', () => {
    const rects = Array.from({ length: 200_000 }, (_, index) => ({
      x: index,
      y: -index,
      width: 10,
      height: 20,
    }));
    expect(findDiagramBounds(rects, 5)).toEqual({
      x: -5,
      y: -200_004,
      width: 200_019,
      height: 200_029,
    });
  });

  it('UIC-DIAGRAM-CANVAS-3.3 fits bounds in view within the zoom range', () => {
    const bounds = { x: 100, y: 100, width: 400, height: 200 };
    expect(
      fitDiagramViewport({ bounds, size: { width: 200, height: 200 }, zoomRange: [25, 100] }),
    ).toEqual({
      x: -50,
      y: 0,
      zoom: 50,
    });
    expect(
      fitDiagramViewport({ bounds, size: { width: 1000, height: 1000 }, zoomRange: [25, 100] }),
    ).toEqual({
      x: 200,
      y: 300,
      zoom: 100,
    });
  });

  it('UIC-DIAGRAM-CANVAS-3.2 zooms around a screen point and maps screen points to the diagram', () => {
    const viewport = { x: 20, y: 10, zoom: 100 };
    const zoomed = zoomDiagramViewport(viewport, { zoom: 200, at: { x: 120, y: 110 } });
    expect(zoomed).toEqual({ x: -80, y: -90, zoom: 200 });
    expect(toDiagramPoint(viewport, { x: 120, y: 110 })).toEqual({ x: 100, y: 100 });
    expect(toDiagramPoint(zoomed, { x: 120, y: 110 })).toEqual({ x: 100, y: 100 });
  });

  it('UIC-DIAGRAM-CANVAS-4.3 snaps to the grid', () => {
    expect(snapToGrid(14, 10)).toBe(10);
    expect(snapToGrid(15, 10)).toBe(20);
    expect(snapToGrid(-6, 10)).toBe(-10);
    expect(snapToGrid(13, 0)).toBe(13);
  });

  it('UIC-DIAGRAM-CANVAS-6.3 finds the connected node closest in a direction', () => {
    const find = (id: string, direction: 'up' | 'down' | 'left' | 'right') =>
      findConnectedNode({ id, direction, nodes, edges });
    expect(find('hub', 'right')).toBe('east');
    expect(find('hub', 'up')).toBe('north');
    expect(find('hub', 'down')).toBe('south');
    expect(find('hub', 'left')).toBeUndefined();
    expect(find('east', 'left')).toBe('hub');
    expect(find('far-east', 'left')).toBeUndefined();
    expect(find('missing', 'left')).toBeUndefined();
  });

  it('UIC-DIAGRAM-CANVAS-2.3 spreads edges between the same nodes apart', () => {
    const offsets = spreadParallelEdges([
      { id: 'forward', source: 'a', target: 'b' },
      { id: 'back', source: 'b', target: 'a' },
      { id: 'lone', source: 'a', target: 'c' },
      { id: 'loop', source: 'a', target: 'a' },
      { id: 'second-loop', source: 'a', target: 'a' },
      { id: 'third-loop', source: 'a', target: 'a' },
    ]);
    expect(offsets.get('forward')).toBe(-12);
    expect(offsets.get('back')).toBe(-12);
    expect(offsets.get('lone')).toBe(0);
    expect(offsets.get('loop')).toBe(0);
    expect(offsets.get('second-loop')).toBe(24);
    expect(offsets.get('third-loop')).toBe(48);
  });

  it('UIC-DIAGRAM-CANVAS-2.3 distinguishes numeric and text node keys in parallel groups', () => {
    const offsets = spreadParallelEdges([
      { id: 'numeric', source: 1, target: 2 },
      { id: 'text', source: '1', target: '2' },
      { id: 'numeric-back', source: 2, target: 1 },
    ]);
    expect(offsets.get('numeric')).toBe(-12);
    expect(offsets.get('numeric-back')).toBe(-12);
    expect(offsets.get('text')).toBe(0);
  });

  it('UIC-DIAGRAM-CANVAS-2.3 keeps composite-key delimiters and reversed edges distinct', () => {
    const offsets = spreadParallelEdges([
      { id: 'comma-first', source: 'a,b', target: 'c' },
      { id: 'comma-last', source: 'a', target: 'b,c' },
      { id: 'quoted', source: 'a">b', target: '[c]' },
      { id: 'quoted-back', source: '[c]', target: 'a">b' },
    ]);
    expect(offsets.get('comma-first')).toBe(0);
    expect(offsets.get('comma-last')).toBe(0);
    expect(Math.abs(requireDefined(offsets.get('quoted')))).toBe(12);
    expect(offsets.get('quoted-back')).toBe(offsets.get('quoted'));
  });
  it('UIC-DIAGRAM-CANVAS-2.3 keeps a large parallel group centred in edge order', () => {
    const parallel = Array.from({ length: 20_000 }, (_, index) => ({
      id: index,
      source: index % 2 === 0 ? 'b' : 'a',
      target: index % 2 === 0 ? 'a' : 'b',
    }));
    const offsets = spreadParallelEdges(parallel);
    expect(offsets.size).toBe(parallel.length);
    expect(offsets.get(0)).toBe(239_988);
    expect(offsets.get(1)).toBe(-239_964);
    expect(offsets.get(19_999)).toBe(239_988);
  });
});
