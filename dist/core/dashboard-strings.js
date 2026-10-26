const countText = (count, one, many) => `${count} ${count === 1 ? one : many}`;
export const dashboardStrings = {
    showAsTable: 'Show as table',
    chartLegend: 'Legend',
    chartCategory: 'Category',
    chartAmount: 'Value',
    chartShare: 'Share',
    chartSummary: ({ series, values, low, high }) => `${countText(series, 'series', 'series')}, ${countText(values, 'value', 'values')}, from ${low} to ${high}`,
    chartValue: (series, at, value) => `${series}, ${at}: ${value}`,
    donutSummary: (total, largest, share) => `Total ${total}, largest ${largest} at ${share}`,
    donutSegment: (label, value, share) => `${label}: ${value}, ${share}`,
    moveTile: (tile) => `Move ${tile}`,
    resizeTile: (tile) => `Resize ${tile}`,
    tileMoved: (tile, column, row) => `${tile} moved to column ${column}, row ${row}`,
    tileResized: (tile, columns, rows) => `${tile} resized to ${countText(columns, 'column', 'columns')} by ${countText(rows, 'row', 'rows')}`,
};
//# sourceMappingURL=dashboard-strings.js.map