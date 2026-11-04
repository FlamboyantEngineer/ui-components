import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { Size } from '../../core/props.js';
import { layoutSequenceRoutes, drawSequenceRoute } from './sequence-routes.js';
import type { SequenceRoute } from './sequence-routes.js';
import type {
  StateMachineState,
  StateMachineTransition,
  StateMachineViewDensity,
  StateMachineViewSequenceGeometry,
} from './state-machine-view.js';

export interface SequenceMeasurements {
  viewportWidth: number;
  states: ReadonlyMap<string, { width: number; height: number }>;
  labels: ReadonlyMap<string, { width: number; height: number }>;
}

export interface SequenceStatePosition {
  state: StateMachineState;
  x: number;
  width: number;
}

export interface SequenceLayout {
  states: SequenceStatePosition[];
  routes: (SequenceRoute & {
    y: number;
    labelY: number;
    path: string;
    arrow: string;
    radius: number;
  })[];
  width: number;
  height: number;
  rowY: number;
  rowHeight: number;
  lanePitch: number;
  stateGap: number;
  rowSpacer: number;
}

interface LayoutInput {
  states: readonly StateMachineState[];
  transitions: readonly StateMachineTransition[];
  density?: StateMachineViewDensity | undefined;
  size?: Size | undefined;
  geometry?: StateMachineViewSequenceGeometry | undefined;
  measurements: SequenceMeasurements;
}

const stateSizes = {
  xs: { default: [112, 28], compact: [80, 24] },
  sm: { default: [128, 36], compact: [96, 28] },
  md: { default: [144, 44], compact: [112, 32] },
  lg: { default: [160, 52], compact: [128, 36] },
  xl: { default: [176, 60], compact: [144, 40] },
} as const;

function resolveDistance(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function placeStates(
  input: LayoutInput,
  gap: number,
): { states: SequenceStatePosition[]; height: number } {
  const [minimumWidth, minimumHeight] = stateSizes[input.size ?? 'md'][input.density ?? 'default'];
  const sizes = input.states.map((state) => input.measurements.states.get(toKeyIdentity(state.id)));
  const width = Math.max(
    minimumWidth,
    ...sizes.map((size) => size?.width ?? 0),
    (input.measurements.viewportWidth - 16 - gap * Math.max(0, input.states.length - 1)) /
      Math.max(1, input.states.length),
  );
  return {
    states: input.states.map((state, index) => ({ state, x: 8 + index * (width + gap), width })),
    height: Math.max(minimumHeight, ...sizes.map((size) => size?.height ?? 0)),
  };
}

function countLanes(routes: SequenceRoute[], direction: SequenceRoute['direction']): number {
  return routes.reduce(
    (count, route) => (route.direction === direction ? Math.max(count, route.lane + 1) : count),
    0,
  );
}

export function layoutSequence(input: LayoutInput): SequenceLayout {
  const stateGap = resolveDistance(input.geometry?.stateGap, 0);
  const rowSpacer = resolveDistance(input.geometry?.rowSpacer, 15);
  const cornerRadius = resolveDistance(input.geometry?.cornerRadius, 10);
  const { states, height: rowHeight } = placeStates(input, stateGap);
  const routes = layoutSequenceRoutes({
    transitions: input.transitions,
    boxes: new Map(states.map(({ state, x, width }) => [state.id, { x, width }])),
    indices: new Map(states.map(({ state }, index) => [state.id, index])),
    labels: input.measurements.labels,
  });
  const labelHeight = Math.max(12, ...routes.map((route) => route.labelHeight));
  const lanePitch = Math.max(resolveDistance(input.geometry?.lanePitch, 26), labelHeight + 4);
  const above = countLanes(routes, 'forward');
  const below = countLanes(routes, 'reverse');
  const extent = (count: number) => (count ? rowSpacer + labelHeight + (count - 1) * lanePitch : 0);
  const rowY = 8 + extent(above);
  const placed = routes.map((route) => {
    const forward = route.direction === 'forward';
    const offset = rowSpacer + labelHeight / 2 + route.lane * lanePitch;
    const y = forward ? rowY - offset : rowY + rowHeight + offset;
    const attachmentY = forward ? rowY : rowY + rowHeight;
    return {
      ...route,
      y,
      labelY: y - route.labelHeight / 2,
      ...drawSequenceRoute({ ...route, attachmentY, laneY: y, cornerRadius }),
    };
  });
  const end = states.at(-1);
  return {
    states,
    routes: placed,
    rowY,
    rowHeight,
    lanePitch,
    stateGap,
    rowSpacer,
    width: Math.max(
      input.measurements.viewportWidth,
      end ? end.x + end.width + 8 : 16,
      ...routes.map((route) => route.labelX + route.labelWidth + 8),
    ),
    height: rowY + (states.length ? rowHeight : 0) + extent(below) + 8,
  };
}
