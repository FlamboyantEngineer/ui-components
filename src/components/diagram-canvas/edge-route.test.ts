import { describe, expect, it } from 'vitest';
import {
  resolvePortPoint,
  routeDiagramEdge,
  type DiagramEdgeEnd,
  type DiagramPortSide,
  type DiagramRect,
} from './edge-route.js';

const left = { x: 0, y: 0, width: 100, height: 40 };
const right = { x: 200, y: 0, width: 100, height: 40 };
const below = { x: 0, y: 200, width: 100, height: 40 };

describe('routeDiagramEdge', () => {
  it('UIC-DIAGRAM-CANVAS-2.1 draws a straight edge between the box boundaries', () => {
    const route = routeDiagramEdge({
      source: { rect: left },
      target: { rect: right },
      routing: 'straight',
    });
    expect(route.path).toBe('M 100 20 L 200 20');
    expect(route.label).toEqual({ x: 150, y: 20 });
    expect(route.arrow).toBe('M 200 20 L 192 24 L 192 16 Z');
  });

  it('UIC-DIAGRAM-CANVAS-2.1 leaves a straight edge from a diagonal boundary point', () => {
    const route = routeDiagramEdge({
      source: { rect: { x: 0, y: 0, width: 40, height: 40 } },
      target: { rect: { x: 100, y: 100, width: 40, height: 40 } },
      routing: 'straight',
    });
    expect(route.path).toBe('M 40 40 L 100 100');
  });

  it('UIC-DIAGRAM-CANVAS-2.1 draws a bezier edge from the facing sides', () => {
    const route = routeDiagramEdge({ source: { rect: left }, target: { rect: right } });
    expect(route.path).toBe('M 100 20 C 140 20 160 20 200 20');
    expect(route.label).toEqual({ x: 150, y: 20 });
    expect(routeDiagramEdge({ source: { rect: left }, target: { rect: below } }).path).toBe(
      'M 50 40 C 50 104 50 136 50 200',
    );
  });

  it('UIC-DIAGRAM-CANVAS-2.1 draws an orthogonal edge with a mid run between horizontal sides', () => {
    const lower = { x: 200, y: 60, width: 100, height: 40 };
    const route = routeDiagramEdge({
      source: { rect: left },
      target: { rect: lower },
      routing: 'orthogonal',
    });
    expect(route.path).toBe('M 100 20 L 150 20 L 150 80 L 200 80');
    expect(route.label).toEqual({ x: 150, y: 50 });
    expect(route.arrow).toBe('M 200 80 L 192 84 L 192 76 Z');
  });

  it('UIC-DIAGRAM-CANVAS-2.1 routes orthogonal edges between vertical sides and around', () => {
    const vertical = routeDiagramEdge({
      source: { rect: left },
      target: { rect: { x: 60, y: 200, width: 100, height: 40 } },
      routing: 'orthogonal',
    });
    expect(vertical.path).toBe('M 50 40 L 50 120 L 110 120 L 110 200');
    const around = routeDiagramEdge({
      source: { rect: left, port: { side: 'right', position: 0.5 } },
      target: { rect: { ...right, y: 100 }, port: { side: 'right', position: 0.5 } },
      routing: 'orthogonal',
    });
    expect(around.path).toBe('M 100 20 L 120 20 L 120 70 L 320 70 L 320 120 L 300 120');
  });

  describe('UIC-DIAGRAM-CANVAS-2.1 orthogonal detours', () => {
    const end = (rect: DiagramRect, side: DiagramPortSide): DiagramEdgeEnd => ({
      rect,
      port: { side, position: 0.5 },
    });
    const pointsOf = (path: string) =>
      [...path.matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)].map(([, x, y]) => ({
        x: Number(x),
        y: Number(y),
      }));
    const runsInside = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      rect: DiagramRect,
    ) =>
      Math.min(a.x, b.x) < rect.x + rect.width &&
      Math.max(a.x, b.x) > rect.x &&
      Math.min(a.y, b.y) < rect.y + rect.height &&
      Math.max(a.y, b.y) > rect.y;
    /** Checks that the route clears both boxes and leaves and reaches each port along its side. */
    function expectDetour(
      source: DiagramEdgeEnd,
      target: DiagramEdgeEnd,
      targetSide = target.port?.side,
    ) {
      const route = routeDiagramEdge({ source, target, routing: 'orthogonal' });
      const points = pointsOf(route.path);
      for (const [index, point] of points.slice(1).entries()) {
        const before = points[index] ?? point;
        expect(before.x === point.x || before.y === point.y).toBe(true);
        expect(runsInside(before, point, source.rect)).toBe(false);
        expect(runsInside(before, point, target.rect)).toBe(false);
      }
      const [first, second] = points;
      const [last, beforeLast] = [points.at(-1), points.at(-2)];
      const normal = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] } as const;
      const [sx, sy] = normal[source.port?.side ?? 'right'];
      const [tx, ty] = normal[targetSide ?? 'left'];
      expect(Math.sign((second?.x ?? 0) - (first?.x ?? 0))).toBe(sx);
      expect(Math.sign((second?.y ?? 0) - (first?.y ?? 0))).toBe(sy);
      expect(Math.sign((beforeLast?.x ?? 0) - (last?.x ?? 0))).toBe(tx);
      expect(Math.sign((beforeLast?.y ?? 0) - (last?.y ?? 0))).toBe(ty);
      return route;
    }
    const a = { x: 0, y: 0, width: 100, height: 50 };
    const b = { x: 200, y: 0, width: 100, height: 50 };

    it('goes around the target for aligned ports on the same side', () => {
      const route = expectDetour(end(a, 'right'), end(b, 'right'));
      expect(route.path).toBe('M 100 25 L 120 25 L 120 -20 L 320 -20 L 320 25 L 300 25');
      expect(route.arrow).toBe('M 300 25 L 308 21 L 308 29 Z');
      expect(route.label).toEqual({ x: 220, y: -20 });
    });

    it('clears the boxes for offset, reversed and vertical placements', () => {
      expectDetour(end(a, 'right'), end({ ...b, y: 30 }, 'right'));
      expectDetour(end(b, 'left'), end(a, 'left'));
      expectDetour(end(b, 'right'), end(a, 'right'));
      expectDetour(end(a, 'left'), end({ ...b, y: -20 }, 'left'));
      const top = { x: 0, y: 0, width: 50, height: 100 };
      const bottom = { x: 0, y: 200, width: 50, height: 100 };
      expect(expectDetour(end(top, 'bottom'), end(bottom, 'bottom')).path).toBe(
        'M 25 100 L 25 120 L -20 120 L -20 320 L 25 320 L 25 300',
      );
      expectDetour(end(bottom, 'top'), end({ ...top, x: 30 }, 'top'));
      expectDetour(end(top, 'top'), end(bottom, 'bottom'));
    });

    it('takes a lane outside overlapping boxes and reaches zero-size preview ends', () => {
      const route = routeDiagramEdge({
        source: end(a, 'right'),
        target: end({ x: 60, y: 10, width: 100, height: 50 }, 'left'),
        routing: 'orthogonal',
      });
      const lanes = pointsOf(route.path).slice(2, -2);
      expect(lanes.every((point) => point.y <= -20 || point.y >= 80)).toBe(true);
      const preview = { rect: { x: -80, y: 25, width: 0, height: 0 } };
      expect(expectDetour(end(a, 'right'), preview, 'right').path).toBe(
        'M 100 25 L 120 25 L 120 -20 L -60 -20 L -60 25 L -80 25',
      );
    });
  });

  it('UIC-DIAGRAM-CANVAS-2.1 turns one corner between a horizontal and a vertical side', () => {
    const route = routeDiagramEdge({
      source: { rect: left, port: { side: 'right', position: 0.5 } },
      target: {
        rect: { x: 200, y: 200, width: 100, height: 40 },
        port: { side: 'top', position: 0.5 },
      },
      routing: 'orthogonal',
    });
    expect(route.path).toBe('M 100 20 L 250 20 L 250 200');
    expect(route.arrow).toBe('M 250 200 L 246 192 L 254 192 Z');
  });

  it('UIC-DIAGRAM-CANVAS-2.2 starts and ends at ports and leaves along their side', () => {
    expect(resolvePortPoint(left, { side: 'top', position: 0.25 })).toEqual({ x: 25, y: 0 });
    expect(resolvePortPoint(left, { side: 'bottom', position: 0.5 })).toEqual({ x: 50, y: 40 });
    expect(resolvePortPoint(left, { side: 'left', position: 0.5 })).toEqual({ x: 0, y: 20 });
    expect(resolvePortPoint(left, { side: 'right', position: 1 })).toEqual({ x: 100, y: 40 });
    const route = routeDiagramEdge({
      source: { rect: left, port: { side: 'bottom', position: 0.5 } },
      target: { rect: right, port: { side: 'top', position: 0.5 } },
    });
    expect(route.path).toBe('M 50 40 C 50 121.58 250 -81.58 250 0');
  });

  it('UIC-DIAGRAM-CANVAS-2.3 shifts the ends of parallel edges to the right of travel', () => {
    const forward = routeDiagramEdge({
      source: { rect: left },
      target: { rect: right },
      offset: 6,
    });
    const back = routeDiagramEdge({ source: { rect: right }, target: { rect: left }, offset: 6 });
    expect(forward.path).toBe('M 100 26 C 140 26 160 26 200 26');
    expect(back.path).toBe('M 200 14 C 160 14 140 14 100 14');
    const straight = routeDiagramEdge({
      source: { rect: left },
      target: { rect: right },
      routing: 'straight',
      offset: 6,
    });
    expect(straight.path).toBe('M 100 26 L 200 26');
  });

  it('UIC-DIAGRAM-CANVAS-2.3 loops an edge from a box back to itself over its top', () => {
    const route = routeDiagramEdge({ source: { rect: left }, target: { rect: { ...left } } });
    expect(route.path).toBe('M 34 0 C 10 -48 90 -48 66 0');
    expect(route.label).toEqual({ x: 50, y: -36 });
  });

  it('UIC-DIAGRAM-CANVAS-2.1 reaches a bare point, as a connection preview does', () => {
    const route = routeDiagramEdge({
      source: { rect: left, port: { side: 'right', position: 0.5 } },
      target: { rect: { x: 180, y: 20, width: 0, height: 0 } },
      routing: 'straight',
    });
    expect(route.path).toBe('M 100 20 L 180 20');
  });
});
