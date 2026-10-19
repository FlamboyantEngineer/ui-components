import { describe, expect, it } from 'vitest';
import { resolvePortPoint, routeDiagramEdge } from './edge-route.js';

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
