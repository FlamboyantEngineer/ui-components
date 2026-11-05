import type { Key } from '../../core/props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { StateMachineTransition } from './state-machine-view.js';

interface SequenceBox {
  x: number;
  width: number;
}

export interface SequenceRoute {
  transition: StateMachineTransition;
  direction: 'forward' | 'reverse';
  sourceX: number;
  targetX: number;
  labelX: number;
  labelWidth: number;
  labelHeight: number;
  span: number;
  lane: number;
}

interface RouteInput {
  transitions: readonly StateMachineTransition[];
  boxes: ReadonlyMap<Key, SequenceBox>;
  indices: ReadonlyMap<Key, number>;
  labels: ReadonlyMap<string, { width: number; height: number }>;
}

function createRoute(transition: StateMachineTransition, input: RouteInput): SequenceRoute | null {
  const from = input.indices.get(transition.from);
  const to = input.indices.get(transition.to);
  const source = input.boxes.get(transition.from);
  const target = input.boxes.get(transition.to);
  if (from === undefined || to === undefined || !source || !target) return null;
  const label = input.labels.get(toKeyIdentity(transition.id));
  return {
    transition,
    direction: to >= from ? 'forward' : 'reverse',
    sourceX: source.x,
    targetX: target.x,
    labelX: 0,
    labelWidth: transition.label?.trim() ? (label?.width ?? transition.label.length * 8 + 16) : 0,
    labelHeight: transition.label?.trim() ? (label?.height ?? 22) : 0,
    span: Math.abs(to - from),
    lane: 0,
  };
}

function compareRoutes(a: SequenceRoute, b: SequenceRoute): number {
  const aKey = toKeyIdentity(a.transition.id);
  const bKey = toKeyIdentity(b.transition.id);
  return a.span - b.span || (aKey < bKey ? -1 : aKey > bKey ? 1 : 0);
}

/** Source/target attachments occupy separate halves, and parallel attachments fan out inside them. */
function attachRoutes(routes: SequenceRoute[], boxes: ReadonlyMap<Key, SequenceBox>): void {
  const attachments = new Map<string, { route: SequenceRoute; source: boolean }[]>();
  for (const route of routes) {
    for (const source of [true, false]) {
      const id = source ? route.transition.from : route.transition.to;
      const key = `${toKeyIdentity(id)}:${route.direction}:${String(source)}`;
      const group = attachments.get(key) ?? [];
      group.push({ route, source });
      attachments.set(key, group);
    }
  }
  for (const group of attachments.values()) {
    const first = group[0];
    if (!first) continue;
    const right = first.source === (first.route.direction === 'forward');
    const loops = group.filter(({ route }) => route.span === 0);
    const spans = group.filter(({ route }) => route.span !== 0);
    // Outer routes wrap around inner ones; loops stay between incoming and outgoing ports.
    const ordered = right ? [...loops, ...spans.reverse()] : [...spans, ...loops.reverse()];
    ordered.forEach(({ route, source }, index) => {
      const box = boxes.get(source ? route.transition.from : route.transition.to);
      if (!box) return;
      const x =
        box.x + box.width * ((right ? 0.55 : 0.2) + (0.25 * (index + 1)) / (group.length + 1));
      if (source) route.sourceX = x;
      else route.targetX = x;
    });
  }
  for (const route of routes) {
    route.labelX = Math.max(0, (route.sourceX + route.targetX - route.labelWidth) / 2);
  }
}

/** Only routes in the same span group can share a lane; both stroke and label reserve horizontal room. */
function packRoutes(routes: SequenceRoute[]): void {
  let previousSpan = -1;
  let groupStart = 0;
  const lanes: { start: number; end: number }[][] = [];
  for (const route of routes) {
    if (route.span !== previousSpan) {
      groupStart = lanes.length;
      previousSpan = route.span;
    }
    const start = Math.min(route.sourceX, route.targetX, route.labelX) - 8;
    const end = Math.max(route.sourceX, route.targetX, route.labelX + route.labelWidth) + 8;
    let lane = groupStart;
    while (lanes[lane]?.some((range) => start < range.end && end > range.start)) lane++;
    const reservations = lanes[lane] ?? [];
    reservations.push({ start, end });
    lanes[lane] = reservations;
    route.lane = lane;
  }
}

export function layoutSequenceRoutes(input: RouteInput): SequenceRoute[] {
  const routes = input.transitions
    .flatMap((transition) => {
      const route = createRoute(transition, input);
      return route ? [route] : [];
    })
    .sort(compareRoutes);
  attachRoutes(routes, input.boxes);
  for (const direction of ['forward', 'reverse'] as const) {
    packRoutes(routes.filter((route) => route.direction === direction));
  }
  return routes;
}

/** A U-shaped orthogonal route with the same radius at both bends. */
export function drawSequenceRoute(options: {
  sourceX: number;
  targetX: number;
  attachmentY: number;
  laneY: number;
  cornerRadius: number;
}): { path: string; arrow: string; radius: number } {
  const { sourceX: sx, targetX: tx, attachmentY: y, laneY: ly, cornerRadius } = options;
  const dx = Math.sign(tx - sx);
  const dy = Math.sign(ly - y);
  const radius = Math.min(cornerRadius, Math.abs(tx - sx) / 2, Math.abs(ly - y) / 2);
  return {
    path: `M ${sx} ${y} L ${sx} ${ly - dy * radius} Q ${sx} ${ly} ${sx + dx * radius} ${ly} L ${tx - dx * radius} ${ly} Q ${tx} ${ly} ${tx} ${ly - dy * radius} L ${tx} ${y}`,
    arrow: `M ${tx - 4} ${y + dy * 6} L ${tx} ${y} L ${tx + 4} ${y + dy * 6}`,
    radius,
  };
}
