import type { ReactNode } from 'react';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { chartHooks as hooks } from './chart-hooks.js';

/** The legend's position relative to its plot. Start and end follow the text direction. */
export type ChartLegendPlacement =
  'above' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

export function PlotWithLegend({
  children,
  legend,
  placement,
}: {
  children: ReactNode;
  legend: ReactNode;
  placement: ChartLegendPlacement;
}) {
  if (isEmptyNode(legend)) return children;
  return (
    <div {...hooks.slot('plot-frame', { placement })}>
      <div {...hooks.slot('legend')}>{legend}</div>
      {children}
    </div>
  );
}
