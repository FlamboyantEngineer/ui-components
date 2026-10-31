'use client';

import { TableGlyph } from '../../core/glyphs.js';
import { useId, type ReactNode } from 'react';
import { ToggleButton } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, Tone, RefProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { ProseTable } from '../prose-table/prose-table.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { chartHooks as hooks } from './chart-hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

/** `chart` shows the drawing; `table` shows the values as a table instead. */
export type ChartView = 'chart' | 'table';

/** One named set of values, drawn in the colour slot of its position among the chart's series. */
export interface ChartSeries {
  /** Identifies the series among its siblings. */
  id: Key;
  /** Names the series in the legend, the tooltip, the table and each value's name. */
  label: string;
  /** What the series stands for, such as `success` for passed checks. Unset, its position decides. */
  tone?: Tone | undefined;
}

/** A chart's values as a table: column headings, then rows whose first cell names the row. */
export interface ChartTable {
  columns: readonly string[];
  rows: ReadonlyArray<readonly string[]>;
}

/** The view state of a chart, controlled or not. */
export interface ChartViewProps {
  /** The view shown, controlled. */
  view?: ChartView | undefined;
  /** The view shown at first, uncontrolled. Defaults to `chart`. */
  defaultView?: ChartView | undefined;
  /** Called with the view the reader switches to. */
  onViewChange?: ((view: ChartView) => void) | undefined;
}

export interface ChartProps
  extends BaseProps, AriaLabellingProps, ChartViewProps, RefProps<HTMLDivElement> {
  /** Visible title that names the chart. Without one, name it with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** Text that describes what the chart shows, such as its range of values. */
  summary: string;
  /** Show the summary under the title. Defaults to `false`: only assistive technology reads it. */
  showSummary?: boolean | undefined;
  /** The values the table view lists. */
  table: ChartTable;
  /** A legend shown above the drawing, such as a `ChartLegend`. */
  legend?: ReactNode;
  /** The chart draws no value; publishes `data-empty`. Defaults to `false`. */
  isEmpty?: boolean | undefined;
  /** The drawing. */
  children?: ReactNode;
}

/** The table view: the first column names each row. */
function ChartValueTable({
  table,
  name,
}: {
  table: ChartTable;
  name: Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'>;
}) {
  return (
    <ProseTable
      className={hooks.slotClass('table')}
      {...name}
      header={table.columns.map((content, index) => ({
        key: String(index),
        content,
        isRowHeader: index === 0,
      }))}
      rows={table.rows.map((cells, row) => ({
        key: String(row),
        cells: cells.map((content, index) => ({ key: String(index), content })),
      }))}
    />
  );
}

/**
 * The accessible frame of a chart: a named figure described by a text summary, with a legend, the
 * drawing, and a toggle that shows the values as a table instead. Bar, line and donut charts render
 * it around their drawings; a host wraps its own drawing in it the same way.
 */
export function Chart({
  label,
  summary,
  showSummary = false,
  table,
  legend,
  view,
  defaultView = 'chart',
  onViewChange,
  isEmpty = false,
  children,
  className,
  'aria-describedby': describedBy,
  ...rest
}: ChartProps) {
  const strings = useUiStrings();
  const titleId = useId();
  const summaryId = useId();
  const [shown, setShown] = useControllableState(view, defaultView, onViewChange);
  const hasTitle =
    !isEmptyNode(label) && rest['aria-labelledby'] === undefined && !rest['aria-label'];
  const labelId = hasTitle ? titleId : rest['aria-labelledby'];
  const summaryText = (
    <p {...hooks.slot('summary')} id={summaryId}>
      {summary}
    </p>
  );
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { view: shown, empty: isEmpty } })}
      role="figure"
      aria-labelledby={labelId}
      aria-describedby={describedBy ? `${summaryId} ${describedBy}` : summaryId}
    >
      <div {...hooks.slot('header')}>
        {!isEmptyNode(label) ? (
          <span {...hooks.slot('title')} id={titleId}>
            {label}
          </span>
        ) : null}
        <ToggleButton
          className={hooks.slotClass('view-toggle')}
          isSelected={shown === 'table'}
          onChange={(isSelected) => setShown(isSelected ? 'table' : 'chart')}
        >
          <Glyph icon={TableGlyph} />
          {strings.showAsTable}
        </ToggleButton>
      </div>
      {showSummary ? summaryText : <VisuallyHidden>{summaryText}</VisuallyHidden>}
      {shown === 'table' ? (
        <ChartValueTable
          table={table}
          name={labelId ? { 'aria-labelledby': labelId } : { 'aria-label': rest['aria-label'] }}
        />
      ) : (
        <>
          {legend}
          <div {...hooks.slot('body')}>{children}</div>
        </>
      )}
    </div>
  );
}
