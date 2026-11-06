import { defineStrings } from '../message-format.js';
/** Strings of charts and dashboard grids. */
interface DashboardStrings {
  /** Toggles a chart between its drawing and a table of its values. */
  showAsTable: string;
  /** Names a chart legend's group of series toggles. */
  chartLegend: string;
  /** Heads the first column of a chart's table when its categories have no label of their own. */
  chartCategory: string;
  /** Heads the column of a donut chart's table that holds each segment's value. */
  chartAmount: string;
  /** Heads the column of a donut chart's table that holds each segment's share of the total. */
  chartShare: string;
  /** Describes a chart by how many series and values it draws and its lowest and highest values. */
  chartSummary: (summary: { series: number; values: number; low: string; high: string }) => string;
  /** Names one value of a chart by its series, where it sits on the other axis, and the value. */
  chartValue: (series: string, at: string, value: string) => string;
  /** Names a scatter chart's observation without a label by its series and its coordinates. */
  chartPointValue: (series: string, value: string) => string;
  /** A scatter chart observation's coordinates, each after its axis's name. */
  chartCoordinates: (coordinates: {
    xLabel: string;
    x: string;
    yLabel: string;
    y: string;
  }) => string;
  /** Names a scatter chart's x axis when the chart gives it no name. */
  chartXAxis: string;
  /** Names a scatter chart's y axis when the chart gives it no name. */
  chartYAxis: string;
  /** Heads the column of a scatter chart's table that names each observation. */
  chartPoint: string;
  /** Heads the column of a scatter chart's table that names each observation's series. */
  chartSeries: string;
  /** Heads a calendar heatmap table's column of days. */
  chartDate: string;
  /** Describes a calendar heatmap's days: how many, how many have values, the lowest and highest. */
  heatmapSummary: (summary: { days: number; values: number; low: string; high: string }) => string;
  /** Stands for the value of a calendar heatmap's day given without one. */
  heatmapMissing: string;
  /** Names a calendar heatmap's legend of levels. */
  heatmapLegend: string;
  /** Names a calendar heatmap's lowest level: the values at or below its bound. */
  heatmapAtMost: (value: string) => string;
  /** Names a calendar heatmap's highest level, which also holds values above the bounds. */
  heatmapAtLeast: (value: string) => string;
  /** Names a calendar heatmap level by the values it spans. */
  heatmapRange: (from: string, to: string) => string;
  /** Describes a chart's reference line by its label and value. */
  chartReferenceLine: (label: string, value: string) => string;
  /** Describes a chart's reference band by its label and the values it spans. */
  chartReferenceBand: (label: string, from: string, to: string) => string;
  /** Adds a chart's references, already listed, to its generated summary. */
  chartSummaryReferences: (summary: string, references: string) => string;
  /** Describes a donut chart by its total and its largest segment with that segment's share. */
  donutSummary: (total: string, largest: string, share: string) => string;
  /** Names a donut segment by its label, its value and its share of the total. */
  donutSegment: (label: string, value: string, share: string) => string;
  /** A donut segment's tooltip value: its formatted value and share. */
  donutValue: (value: string, share: string) => string;
  /** Names the handle that moves a dashboard tile, by the tile's label. */
  moveTile: (tile: string) => string;
  /** Names the handle that resizes a dashboard tile, by the tile's label. */
  resizeTile: (tile: string) => string;
  /** Announces where a moved dashboard tile now starts, counting columns and rows from 1. */
  tileMoved: (tile: string, column: number, row: number) => string;
  /** Announces the columns and rows a resized dashboard tile now spans. */
  tileResized: (tile: string, columns: number, rows: number) => string;
  /** Removes a dashboard tile from the layout, from its menu, by the tile's label. */
  removeTile: (tile: string) => string;
  /** Announces a dashboard tile removed from the layout. */
  tileRemoved: (tile: string) => string;
  /** Names a dashboard tile's context menu, by the tile's label. */
  tileActions: (tile: string) => string;
  /** Names the context menu of a dashboard grid's empty space. */
  gridSpaceActions: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const dashboardStrings = defineStrings<DashboardStrings>({
  chartSummary: (summary) => ({ ...summary }),
  chartValue: (series, at, value) => ({ series, at, value }),
  chartPointValue: (series, value) => ({ series, value }),
  heatmapSummary: (summary) => ({ ...summary }),
  heatmapAtMost: (value) => ({ value }),
  heatmapAtLeast: (value) => ({ value }),
  heatmapRange: (from, to) => ({ from, to }),
  chartCoordinates: (coordinates) => ({ ...coordinates }),
  chartReferenceLine: (label, value) => ({ label, value }),
  chartReferenceBand: (label, from, to) => ({ label, from, to }),
  chartSummaryReferences: (summary, references) => ({ summary, references }),
  donutSummary: (total, largest, share) => ({ total, largest, share }),
  donutSegment: (label, value, share) => ({ label, value, share }),
  donutValue: (value, share) => ({ value, share }),
  moveTile: (tile) => ({ tile }),
  resizeTile: (tile) => ({ tile }),
  tileMoved: (tile, column, row) => ({ tile, column, row }),
  tileResized: (tile, columns, rows) => ({ tile, columns, rows }),
  removeTile: (tile) => ({ tile }),
  tileRemoved: (tile) => ({ tile }),
  tileActions: (tile) => ({ tile }),
});
