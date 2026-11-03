import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { layoutSequence, type SequenceMeasurements } from './sequence-layout.js';
import type { StateMachineState, StateMachineTransition } from './state-machine-view.js';

const states: StateMachineState[] = Array.from({ length: 6 }, (_, id) => ({
  id,
  label: `State ${id}`,
}));
const measurements: SequenceMeasurements = {
  viewportWidth: 0,
  states: new Map(),
  labels: new Map(),
};

function layout(
  transitions: StateMachineTransition[],
  overrides: Partial<Parameters<typeof layoutSequence>[0]> = {},
) {
  return layoutSequence({ states, transitions, measurements, ...overrides });
}

function transition(id: string, from: number, to: number): StateMachineTransition {
  return { id, from, to, label: id };
}

function routeOf(result: ReturnType<typeof layoutSequence>, id: string | number) {
  return requireDefined(result.routes.find((route) => route.transition.id === id));
}

describe('sequence geometry', () => {
  it('UIC-STATE-MACHINE-VIEW-4.1 fixes array order independently of transitions and positions', () => {
    const empty = layout([]);
    const cyclic = layout([
      transition('long', 0, 5),
      transition('reverse', 5, 0),
      transition('loop', 2, 2),
    ]);
    expect(cyclic.states).toEqual(empty.states);
    expect(cyclic.states.map(({ x }) => x)).toEqual([8, 152, 296, 440, 584, 728]);
    const reordered = layout([], {
      states: [...states].reverse().map((state) => ({ ...state, x: 900, y: 900 })),
    });
    expect(reordered.states.map(({ state }) => state.id)).toEqual([5, 4, 3, 2, 1, 0]);
    expect(reordered.states.map(({ x }) => x)).toEqual(empty.states.map(({ x }) => x));
  });

  it('UIC-STATE-MACHINE-VIEW-4.1 handles compact, empty, single and measured long states', () => {
    expect(layout([], { states: [] })).toMatchObject({
      states: [],
      routes: [],
      width: 16,
      height: 16,
    });
    expect(layout([], { states: [requireDefined(states[0])] })).toMatchObject({
      width: 160,
      rowHeight: 44,
    });
    expect(layout([], { density: 'compact' })).toMatchObject({ rowHeight: 32 });
    const measured = layout([], {
      measurements: {
        ...measurements,
        states: new Map([[toKeyIdentity(0), { width: 360, height: 60 }]]),
      },
    });
    expect(measured.states.every(({ width }) => width === 360)).toBe(true);
    expect(measured.rowHeight).toBe(60);
    expect(
      layout([], { measurements: { ...measurements, viewportWidth: 1216 } }).states[0]?.width,
    ).toBe(200);
  });

  it('UIC-STATE-MACHINE-VIEW-4.2 places short spans nearer the row and reverse edges below', () => {
    const result = layout([
      transition('long', 0, 5),
      transition('short', 0, 1),
      transition('back', 4, 0),
      transition('loop', 2, 2),
    ]);
    expect(routeOf(result, 'loop').direction).toBe('forward');
    expect(routeOf(result, 'loop').lane).toBeLessThan(routeOf(result, 'short').lane);
    expect(routeOf(result, 'short').lane).toBeLessThan(routeOf(result, 'long').lane);
    expect(routeOf(result, 'long').y).toBeLessThan(result.rowY);
    expect(routeOf(result, 'back').y).toBeGreaterThan(result.rowY + result.rowHeight);
    expect(routeOf(result, 'loop').sourceX).not.toBe(routeOf(result, 'loop').targetX);
  });

  it('UIC-STATE-MACHINE-VIEW-4.2 shares lanes only when connector and label reservations fit', () => {
    const links = [transition('a', 0, 1), transition('b', 2, 3), transition('c', 4, 5)];
    const normal = layout(links);
    expect(normal.routes.map(({ lane }) => lane)).toEqual([0, 0, 0]);
    const wide = layout(links, {
      measurements: {
        ...measurements,
        labels: new Map([[toKeyIdentity('a'), { width: 800, height: 22 }]]),
      },
    });
    expect(routeOf(wide, 'b').lane).toBe(1);
    expect(routeOf(wide, 'c').lane).toBe(1);
    expect(routeOf(wide, 'a').labelX).toBeGreaterThanOrEqual(0);
    expect(wide.width).toBeGreaterThanOrEqual(routeOf(wide, 'a').labelX + 800);
  });

  it('UIC-STATE-MACHINE-VIEW-4.2 fans parallel typed endpoints and packs deterministically', () => {
    const typed: StateMachineState[] = [
      { id: 1, label: 'Numeric' },
      { id: '1', label: 'Text' },
    ];
    const links: StateMachineTransition[] = [
      { id: 1, from: 1, to: '1', label: 'Numeric edge' },
      { id: '1', from: 1, to: '1', label: 'Text edge' },
      { id: 'reverse', from: '1', to: 1 },
      { id: 'missing', from: 1, to: 'unknown' },
    ];
    const result = layout(links, { states: typed });
    expect(result.routes).toHaveLength(3);
    const a = routeOf(result, 1);
    const b = routeOf(result, '1');
    expect(a.lane).not.toBe(b.lane);
    expect(a.sourceX).not.toBe(b.sourceX);
    expect(a.targetX).not.toBe(b.targetX);
    expect(a.sourceX).toBeLessThan(
      requireDefined(result.states[0]).x + requireDefined(result.states[0]).width,
    );
    expect(a.targetX).toBeGreaterThan(requireDefined(result.states[1]).x);
    expect(routeOf(result, 'reverse').direction).toBe('reverse');
    expect(layout([...links].reverse(), { states: typed })).toEqual(result);
  });

  it('UIC-STATE-MACHINE-VIEW-4.2 honors geometry distances and caps both bends to equal radii', () => {
    const result = layout([transition('a', 0, 1), transition('b', 0, 1)], {
      geometry: { lanePitch: 26, stateGap: 0, rowSpacer: 15, cornerRadius: 10 },
    });
    expect(result.lanePitch).toBe(26);
    expect(Math.abs(routeOf(result, 'a').y - routeOf(result, 'b').y)).toBe(26);
    expect(result.rowY - (routeOf(result, 'a').labelY + routeOf(result, 'a').labelHeight)).toBe(15);
    expect(result.routes.every(({ radius }) => radius === 10)).toBe(true);
    const flat = layout([transition('short', 0, 0)], {
      geometry: { lanePitch: 0, rowSpacer: 0, cornerRadius: 1000, stateGap: 5 },
    });
    const route = routeOf(flat, 'short');
    expect(route.radius).toBeLessThanOrEqual(Math.abs(route.sourceX - route.targetX) / 2);
    expect(route.radius).toBeLessThanOrEqual(Math.abs(route.y - (flat.rowY + 8)) / 2);
    expect(route.path.match(/ Q /g)).toHaveLength(2);
    expect(route.arrow).not.toContain('Z');
    expect(flat.stateGap).toBe(5);
    expect(
      layout([], { geometry: { lanePitch: NaN, rowSpacer: -1, stateGap: Infinity } }),
    ).toMatchObject({ lanePitch: 26, rowSpacer: 15, stateGap: 0 });
  });

  it('UIC-STATE-MACHINE-VIEW-4.2 breaks equal-span ties by locale-independent typed identity', () => {
    const result = layout([transition('a', 0, 1), transition('ä', 0, 1), transition('B', 0, 1)]);
    expect(result.routes.map(({ transition: item }) => item.id)).toEqual(['B', 'a', 'ä']);
    expect(result.routes.map(({ lane }) => lane)).toEqual([0, 1, 2]);
  });

  it('UIC-STATE-MACHINE-VIEW-4.2 grows lane pitch and vertical bounds for tall measured content', () => {
    const result = layout(
      [transition('a', 0, 1), transition('b', 0, 1), transition('reverse', 4, 0)],
      {
        measurements: {
          ...measurements,
          labels: new Map([[toKeyIdentity('a'), { width: 200, height: 80 }]]),
        },
      },
    );
    expect(result.lanePitch).toBe(84);
    expect(result.routes.every(({ labelY }) => labelY >= 0)).toBe(true);
    expect(
      result.routes.every(({ labelY, labelHeight }) => labelY + labelHeight < result.height),
    ).toBe(true);
  });
});
