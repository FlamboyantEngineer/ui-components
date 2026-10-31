import type { BaseProps, RefProps } from '../../core/props.js';
import type { ScaleInterval, ScaleTick } from '../../utils/linear-scale.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { chartAxisHooks as hooks } from './chart-hooks.js';

/** The edge of the drawing an axis runs along. */
export type ChartAxisPosition = 'bottom' | 'left';

export interface ChartAxisProps extends BaseProps, RefProps<SVGGElement> {
  /** `bottom` runs along x under the drawing; `left` runs along y beside it. */
  position: ChartAxisPosition;
  /** The marks to label, from a library scale's `ticks()`. */
  ticks: ReadonlyArray<ScaleTick<string | number>>;
  /** Where the axis line sits across its direction: the y of a bottom axis, the x of a left axis. */
  offset: number;
  /** The two ends of the axis line along its direction. */
  range: ScaleInterval;
  /** Draws a grid line from each tick across the drawing, this long (up or to the right). */
  gridLength?: number | undefined;
}

/** Length of a tick mark and the gap between it and its label, in pixels. */
const tickLength = 4;
const labelGap = 8;

/**
 * An SVG axis from a scale's ticks: a line along one edge of the drawing, a mark and a label at
 * each tick, and optional grid lines across the drawing. It is decorative: a chart names its
 * values and lists them in its table.
 */
export function ChartAxis({
  position,
  ticks,
  offset,
  range,
  gridLength = 0,
  className,
  ...rest
}: ChartAxisProps) {
  const isBottom = position === 'bottom';
  const along = (at: number, across: number) =>
    isBottom ? { x: at, y: across } : { x: across, y: at };
  const line = (at: number, from: number, to: number) => {
    const start = along(at, from);
    const end = along(at, to);
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  };
  const towardGrid = isBottom ? -1 : 1;
  return (
    <g {...rest} {...hooks.root({ className, data: { position } })} aria-hidden="true">
      {gridLength > 0
        ? ticks.map((tick) => (
            <line
              key={`grid:${toKeyIdentity(tick.value)}`}
              {...hooks.slot('grid')}
              {...line(tick.position, offset, offset + towardGrid * gridLength)}
            />
          ))
        : null}
      <line
        {...hooks.slot('line')}
        {...(isBottom
          ? { x1: range[0], y1: offset, x2: range[1], y2: offset }
          : { x1: offset, y1: range[0], x2: offset, y2: range[1] })}
      />
      {ticks.map((tick) => (
        <g key={toKeyIdentity(tick.value)}>
          <line
            {...hooks.slot('tick')}
            {...line(tick.position, offset, offset - towardGrid * tickLength)}
          />
          <text
            {...hooks.slot('label')}
            {...along(tick.position, offset - towardGrid * labelGap)}
            textAnchor={isBottom ? 'middle' : 'end'}
            dominantBaseline={isBottom ? 'hanging' : 'middle'}
          >
            {tick.label}
          </text>
        </g>
      ))}
    </g>
  );
}
