/**
 * Every series' values by coordinate, keeping the first point at a repeated coordinate. Each source
 * coordinate is read once, before the distinct coordinates are ordered.
 */
export function toLineTable(series, { xAxis, format, categoryLabel, }) {
    const byX = new Map();
    const indexed = series.map((entry) => {
        const points = new Map();
        for (const point of entry.points) {
            const at = xAxis.read(point.x);
            if (!Number.isFinite(at))
                continue;
            if (!byX.has(at))
                byX.set(at, point.x);
            if (!points.has(at))
                points.set(at, point);
        }
        return points;
    });
    const rows = [...byX.entries()]
        .sort(([a], [b]) => a - b)
        .map(([at, x]) => [
        xAxis.format(x),
        ...indexed.map((points) => {
            const point = points.get(at);
            return point && Number.isFinite(point.y) ? format.format(point.y) : '';
        }),
    ]);
    return { columns: [categoryLabel, ...series.map((entry) => entry.label)], rows };
}
//# sourceMappingURL=line-table.js.map