/** Strings of charts and dashboard grids. */
export interface DashboardStrings {
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
    chartSummary: (summary: {
        series: number;
        values: number;
        low: string;
        high: string;
    }) => string;
    /** Names one value of a chart by its series, where it sits on the other axis, and the value. */
    chartValue: (series: string, at: string, value: string) => string;
    /** Describes a donut chart by its total and its largest segment with that segment's share. */
    donutSummary: (total: string, largest: string, share: string) => string;
    /** Names a donut segment by its label, its value and its share of the total. */
    donutSegment: (label: string, value: string, share: string) => string;
    /** Names the handle that moves a dashboard tile, by the tile's label. */
    moveTile: (tile: string) => string;
    /** Names the handle that resizes a dashboard tile, by the tile's label. */
    resizeTile: (tile: string) => string;
    /** Announces where a moved dashboard tile now starts, counting columns and rows from 1. */
    tileMoved: (tile: string, column: number, row: number) => string;
    /** Announces the columns and rows a resized dashboard tile now spans. */
    tileResized: (tile: string, columns: number, rows: number) => string;
}
export declare const dashboardStrings: DashboardStrings;
//# sourceMappingURL=dashboard-strings.d.ts.map