const conflictsText = (count) => (count === 1 ? '1 conflict' : `${count} conflicts`);
const aggregateNames = {
    sum: 'Sum',
    count: 'Count',
    min: 'Minimum',
    max: 'Maximum',
    average: 'Average',
};
const lineChanges = { unchanged: null, changed: 'Changed', conflict: 'Conflict' };
export const analysisStrings = {
    mergeViewOurs: 'Ours',
    mergeViewBase: 'Base',
    mergeViewTheirs: 'Theirs',
    mergeViewResult: 'Result',
    mergeViewConflictCount: (unresolved, total) => {
        if (total === 0)
            return 'No conflicts';
        if (unresolved === 0)
            return total === 1 ? 'Conflict resolved' : `All ${total} conflicts resolved`;
        return `${unresolved} of ${conflictsText(total)} unresolved`;
    },
    mergeViewConflict: (index, total) => `Conflict ${index} of ${total}`,
    mergeViewConflictResult: (index) => `Result of conflict ${index}`,
    mergeViewUnresolved: 'Unresolved',
    mergeViewResolved: 'Resolved',
    mergeViewTake: (side) => `Take ${side}`,
    mergeViewTakeBoth: 'Take both',
    mergeViewPreviousConflict: 'Previous conflict',
    mergeViewNextConflict: 'Next conflict',
    mergeViewLine: (change, number) => lineChanges[change] === null ? `Line ${number}` : `${lineChanges[change]}, line ${number}`,
    pivotFields: 'Fields',
    pivotRows: 'Rows',
    pivotColumns: 'Columns',
    pivotValues: 'Values',
    pivotTotal: 'Total',
    pivotEmptyKey: '(empty)',
    pivotNoFields: 'No fields',
    pivotFieldChooser: 'Pivot fields',
    pivotAggregate: (aggregate) => aggregateNames[aggregate],
    pivotValueLabel: (aggregate, field) => `${aggregate} of ${field}`,
    pivotAggregationOf: (field) => `Aggregation of ${field}`,
};
//# sourceMappingURL=analysis-strings.js.map