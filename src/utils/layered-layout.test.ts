import { describe, expect, it } from 'vitest';
import { layoutLayeredGraph, type LayeredLayoutNode } from './layered-layout.js';

const box = (id: string): LayeredLayoutNode => ({ id, width: 100, height: 40 });

describe('layoutLayeredGraph', () => {
  it('UIC-STATE-MACHINE-VIEW-2.1 puts each node one layer after the deepest node leading to it', () => {
    const positions = layoutLayeredGraph({
      nodes: ['a', 'b', 'c', 'd'].map(box),
      edges: [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
        { source: 'a', target: 'c' },
        { source: 'c', target: 'd' },
      ],
    });
    expect(positions.map((position) => position.layer)).toEqual([0, 1, 2, 3]);
    expect(positions.map((position) => position.x)).toEqual([0, 180, 360, 540]);
    expect(positions.map((position) => position.y)).toEqual([0, 0, 0, 0]);
  });

  it('UIC-STATE-MACHINE-VIEW-2.1 breaks cycles and ignores loops and unknown ends', () => {
    const positions = layoutLayeredGraph({
      nodes: ['draft', 'review', 'done'].map(box),
      edges: [
        { source: 'draft', target: 'review' },
        { source: 'review', target: 'draft' },
        { source: 'review', target: 'review' },
        { source: 'review', target: 'done' },
        { source: 'review', target: 'missing' },
      ],
    });
    expect(positions.map((position) => position.layer)).toEqual([0, 1, 2]);
  });

  it('UIC-STATE-MACHINE-VIEW-2.1 centres each layer and orders it to reduce crossings', () => {
    const positions = layoutLayeredGraph({
      nodes: ['a', 'b', 'x', 'y'].map(box),
      edges: [
        { source: 'a', target: 'y' },
        { source: 'b', target: 'x' },
      ],
      nodeGap: 20,
      layerGap: 50,
    });
    const at = (id: string) => positions.find((position) => position.id === id)!;
    expect(at('a')).toEqual({ id: 'a', x: 0, y: 0, layer: 0 });
    expect(at('b')).toEqual({ id: 'b', x: 0, y: 60, layer: 0 });
    expect(at('y')).toMatchObject({ x: 150, y: 0, layer: 1 });
    expect(at('x')).toMatchObject({ x: 150, y: 60, layer: 1 });
    const fan = layoutLayeredGraph({
      nodes: ['root', 'left', 'right'].map(box),
      edges: [
        { source: 'root', target: 'left' },
        { source: 'root', target: 'right' },
      ],
    });
    expect(fan[0]).toMatchObject({ x: 0, y: 36 });
  });

  it('UIC-STATE-MACHINE-VIEW-2.1 places layers top to bottom when vertical', () => {
    const positions = layoutLayeredGraph({
      nodes: [box('a'), { id: 'b', width: 60, height: 80 }, box('c')],
      edges: [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'c' },
      ],
      orientation: 'vertical',
    });
    expect(positions.map(({ x, y }) => [x, y])).toEqual([
      [46, 0],
      [0, 120],
      [92, 120],
    ]);
    expect(layoutLayeredGraph({ nodes: [], edges: [] })).toEqual([]);
  });
});
